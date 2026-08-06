/**
 * Endpoint que recibe los eventos (webhooks) que Stripe envía a Kotta.
 * Se relaciona con lib/stripe.ts, el modelo WebhookEvent de Prisma,
 * y con la lógica de cuentas conectadas, cargos y transferencias.
 * Existe para mantener sincronizado el estado de Kotta con el de Stripe
 * (pagos confirmados, cuentas verificadas, transferencias, etc.)
 */
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { EstadoPago } from '@prisma/client'
import { notificarDisputaAKottaStaff, notificarPagoExitoso, notificarPagoFallido, notificarPagoReembolsado } from '@/lib/notificaciones'
import Stripe from 'stripe'

export const runtime = 'nodejs' // requerido: necesitamos el body crudo, no el parseado por defecto

// Estos estados reflejan un hecho posterior al cobro exitoso. Un evento de
// PaymentIntent entregado tarde jamás debe regresarlos a PAGADO.
const ESTADOS_PROTEGIDOS_CONTRA_PAGO_EXITOSO: EstadoPago[] = [
  EstadoPago.EN_DISPUTA,
  EstadoPago.DISPUTA_PERDIDA,
  EstadoPago.REEMBOLSADO,
]

/** Avanza a PAGADO sin permitir que un webhook retrasado revierta un estado posterior. */
async function marcarPagoComoPagado(pagoId: string) {
  const resultado = await prisma.pago.updateMany({
    where: { id: pagoId, estado: { notIn: ESTADOS_PROTEGIDOS_CONTRA_PAGO_EXITOSO } },
    data: { estado: EstadoPago.PAGADO },
  })
  if (resultado.count === 0) {
    console.warn(`Se evitó sobrescribir con PAGADO el Pago ${pagoId}: ya tiene un estado posterior.`)
  }
  return resultado.count > 0
}

/** Obtiene el PaymentIntent de una disputa, incluso si Stripe no lo expandió. */
async function obtenerPaymentIntentIdDeDisputa(disputa: Stripe.Dispute) {
  if (typeof disputa.payment_intent === 'string') return disputa.payment_intent
  if (disputa.payment_intent?.id) return disputa.payment_intent.id

  const chargeId = typeof disputa.charge === 'string' ? disputa.charge : disputa.charge.id
  const charge = await stripe.charges.retrieve(chargeId)
  return typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id ?? null
}

function estadoKottaDeDisputa(estadoStripe: Stripe.Dispute.Status): EstadoPago {
  if (estadoStripe === 'lost') return EstadoPago.DISPUTA_PERDIDA
  if (estadoStripe === 'won' || estadoStripe === 'warning_closed' || estadoStripe === 'prevented') {
    return EstadoPago.PAGADO
  }
  return EstadoPago.EN_DISPUTA
}

/** Sincroniza una disputa de Stripe de forma idempotente y devuelve si es nueva. */
async function sincronizarDisputa(disputa: Stripe.Dispute) {
  const paymentIntentId = await obtenerPaymentIntentIdDeDisputa(disputa)
  if (!paymentIntentId) {
    console.warn(`Disputa sin PaymentIntent asociado: ${disputa.id}`)
    return null
  }

  const pago = await prisma.pago.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true, estado: true },
  })
  if (!pago) {
    console.warn(`Disputa sin Pago correspondiente: ${disputa.id}`)
    return null
  }

  const existente = await prisma.disputaStripe.findUnique({
    where: { stripeDisputeId: disputa.id },
    select: { id: true },
  })
  const fechaLimite = disputa.evidence_details?.due_by
    ? new Date(disputa.evidence_details.due_by * 1000)
    : null
  const estadoPago = estadoKottaDeDisputa(disputa.status)
  const cerradaEn = ['won', 'lost', 'warning_closed', 'prevented'].includes(disputa.status)
    ? new Date()
    : null

  await prisma.disputaStripe.upsert({
    where: { stripeDisputeId: disputa.id },
    create: {
      pagoId: pago.id,
      stripeDisputeId: disputa.id,
      monto: disputa.amount / 100,
      moneda: disputa.currency.toUpperCase(),
      motivo: disputa.reason,
      estadoStripe: disputa.status,
      fechaLimite,
      creadaEn: new Date(disputa.created * 1000),
      cerradaEn,
    },
    update: {
      monto: disputa.amount / 100,
      moneda: disputa.currency.toUpperCase(),
      motivo: disputa.reason,
      estadoStripe: disputa.status,
      fechaLimite,
      cerradaEn,
    },
  })

  if (pago.estado !== estadoPago) {
    if (estadoPago === EstadoPago.PAGADO) {
      // Un cierre ganado sí puede resolver EN_DISPUTA, pero no debe revertir
      // un reembolso ni una disputa perdida que se hayan procesado después.
      const resultado = await prisma.pago.updateMany({
        where: { id: pago.id, estado: { notIn: [EstadoPago.REEMBOLSADO, EstadoPago.DISPUTA_PERDIDA] } },
        data: { estado: estadoPago },
      })
      if (resultado.count === 0) {
        console.warn(`Se evitó sobrescribir con PAGADO el Pago ${pago.id} al cerrar una disputa.`)
      }
    } else if (estadoPago === EstadoPago.EN_DISPUTA) {
      // Un evento activo entregado tarde no debe reabrir una disputa ya
      // perdida ni sustituir un reembolso confirmado por Stripe.
      const resultado = await prisma.pago.updateMany({
        where: { id: pago.id, estado: { notIn: [EstadoPago.REEMBOLSADO, EstadoPago.DISPUTA_PERDIDA] } },
        data: { estado: estadoPago },
      })
      if (resultado.count === 0) {
        console.warn(`Se evitó reabrir como EN_DISPUTA el Pago ${pago.id}: ya tiene un estado terminal.`)
      }
    } else {
      await prisma.pago.update({ where: { id: pago.id }, data: { estado: estadoPago } })
    }
  }

  return { esNueva: !existente, disputaId: disputa.id }
}

export async function POST(req: Request) {
  const rawBody = await req.text() // el body SIN procesar — la firma se calcula sobre esto
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Falta la firma de Stripe', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Firma de webhook inválida:', err)
    return new Response('Firma inválida', { status: 400 })
  }

  // Idempotencia: si ya procesamos este evento, no lo repetimos.
  const yaExiste = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  })

  if (yaExiste) {
    return new Response('Evento ya procesado', { status: 200 })
  }

  // Registramos el evento como procesado ANTES de actuar sobre él,
  // para que si algo truena a la mitad, no se reintente infinitamente.
  await prisma.webhookEvent.create({
    data: {
      stripeEventId: event.id,
      tipo: event.type,
    },
  })

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      await prisma.cuentaConectada.updateMany({
        where: { stripeAccountId: account.id },
        data: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
        },
      })
      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      const comprobanteUrl =
        typeof paymentIntent.latest_charge === 'string'
          ? null // el charge expandido no viene por defecto; se puede resolver con stripe.charges.retrieve si se necesita la URL del recibo
          : paymentIntent.latest_charge?.receipt_url ?? null

      // Stripe expone fee y net en la Balance Transaction del Charge. Si aún
      // no existe, el estado del pago no se bloquea y los campos quedan null.
      let stripeFeeAmount: number | undefined
      let montoNeto: number | undefined
      try {
        const chargeId = typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge?.id
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId)
          const balanceTransactionId = typeof charge.balance_transaction === 'string'
            ? charge.balance_transaction
            : charge.balance_transaction?.id
          if (balanceTransactionId) {
            const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId)
            stripeFeeAmount = balanceTransaction.fee / 100
            montoNeto = balanceTransaction.net / 100
          }
        }
      } catch (error) {
        console.warn(`No se pudo obtener la Balance Transaction de ${paymentIntent.id}; se completará en un reintento posterior.`, error)
      }

      // Buscamos primero (en vez de updateMany directo) porque necesitamos
      // el id del Pago para poder notificar después de actualizarlo.
      const pagoExitoso = await prisma.pago.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
        select: { id: true },
      })

      if (!pagoExitoso) {
        // No debería pasar en flujo normal (el Pago se crea antes de confirmar
        // el PaymentIntent), pero lo dejamos registrado para investigar si ocurre.
        console.warn(
          `payment_intent.succeeded sin Pago correspondiente: ${paymentIntent.id}`
        )
        break
      }

      // Los importes y comprobante se conservan aunque el estado ya haya
      // avanzado (por ejemplo, una disputa abierta mientras este handler
      // esperaba la Balance Transaction).
      await prisma.pago.update({
        where: { id: pagoExitoso.id },
        data: {
          comprobanteUrl: comprobanteUrl ?? undefined,
          stripeFeeAmount,
          montoNeto,
        },
      })

      const seMarcoPagado = await marcarPagoComoPagado(pagoExitoso.id)
      if (seMarcoPagado) await notificarPagoExitoso(pagoExitoso.id)

      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const mensajeError = paymentIntent.last_payment_error?.message ?? null

      const pagoFallido = await prisma.pago.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
        select: { id: true },
      })

      if (!pagoFallido) {
        console.warn(
          `payment_intent.payment_failed sin Pago correspondiente: ${paymentIntent.id}`
        )
        break
      }

      const resultado = await prisma.pago.updateMany({
        where: {
          id: pagoFallido.id,
          estado: { in: [EstadoPago.PENDIENTE, EstadoPago.PROCESANDO, EstadoPago.FALLIDO] },
        },
        data: { estado: EstadoPago.FALLIDO, referencia: mensajeError ?? undefined },
      })
      if (resultado.count === 0) {
        console.warn(`Se evitó sobrescribir con FALLIDO el Pago ${pagoFallido.id}: ya tiene un estado posterior.`)
      } else {
        await notificarPagoFallido(pagoFallido.id, mensajeError)
      }

      break
    }

    // Reintento natural: Stripe puede emitir charge.updated cuando la Balance
    // Transaction ya está disponible después de payment_intent.succeeded.
    case 'charge.updated': {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
      const balanceTransactionId = typeof charge.balance_transaction === 'string' ? charge.balance_transaction : charge.balance_transaction?.id
      if (paymentIntentId && balanceTransactionId) {
        try {
          const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId)
          await prisma.pago.updateMany({
            where: { stripePaymentIntentId: paymentIntentId, montoNeto: null },
            data: { stripeFeeAmount: balanceTransaction.fee / 100, montoNeto: balanceTransaction.net / 100 },
          })
        } catch (error) {
          console.warn(`No se pudo completar el neto de ${paymentIntentId}.`, error)
        }
      }
      break
    }

    // refund.updated contiene el Refund con su payment_intent. Solo el estado
    // succeeded confirma el reembolso; la ruta que lo inicia no cambia Pago.
    case 'refund.updated': {
      const refund = event.data.object as Stripe.Refund
      if (refund.status !== 'succeeded') break
      const paymentIntentId = typeof refund.payment_intent === 'string'
        ? refund.payment_intent
        : refund.payment_intent?.id
      if (!paymentIntentId) {
        console.warn(`refund.updated sin payment_intent: ${refund.id}`)
        break
      }

      const pago = await prisma.pago.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { id: true, estado: true },
      })
      if (!pago) {
        console.warn(`refund.updated sin Pago correspondiente: ${refund.id}`)
        break
      }
      if (pago.estado !== 'REEMBOLSADO') {
        await prisma.pago.update({ where: { id: pago.id }, data: { estado: 'REEMBOLSADO' } })
        await notificarPagoReembolsado(pago.id)
      }
      break
    }

    // Respaldo para endpoints configurados con el evento clásico. Como Kotta
    // solo inicia reembolsos completos, charge.refunded también confirma el
    // cambio de estado de forma idempotente.
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id
      if (!paymentIntentId) break
      const pago = await prisma.pago.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        select: { id: true, estado: true },
      })
      if (!pago) {
        console.warn(`charge.refunded sin Pago correspondiente: ${charge.id}`)
        break
      }
      if (pago.estado !== 'REEMBOLSADO') {
        await prisma.pago.update({ where: { id: pago.id }, data: { estado: 'REEMBOLSADO' } })
        await notificarPagoReembolsado(pago.id)
      }
      break
    }

    case 'charge.dispute.created': {
      const resultado = await sincronizarDisputa(event.data.object as Stripe.Dispute)
      if (resultado?.esNueva) {
        await notificarDisputaAKottaStaff(resultado.disputaId)
      }
      break
    }

    // Stripe puede entregar actualizaciones y eventos de movimientos de fondos
    // en distinto orden. La sincronización por stripeDisputeId conserva la
    // auditoría y actualiza el Pago al estado final que reporte Stripe.
    case 'charge.dispute.updated':
    case 'charge.dispute.closed':
    case 'charge.dispute.funds_withdrawn':
    case 'charge.dispute.funds_reinstated': {
      await sincronizarDisputa(event.data.object as Stripe.Dispute)
      break
    }

    case 'transfer.created': {
      const transfer = event.data.object as Stripe.Transfer
      const distribucionId = transfer.metadata.distribucionId

      // Si el webhook llega antes de que el endpoint guarde stripeTransferId,
      // el identificador incluido por Kotta en metadata permite resolver la
      // distribución reservada sin crear un registro duplicado.
      const distribucion = await prisma.distribucionPago.findFirst({
        where: {
          OR: [
            { stripeTransferId: transfer.id },
            ...(distribucionId ? [{ id: distribucionId }] : []),
          ],
        },
        select: { id: true, estado: true },
      })

      if (!distribucion) {
        console.warn(`transfer.created sin DistribucionPago correspondiente: ${transfer.id}`)
        break
      }

      // El endpoint ya la marca PAGADO al recibir una respuesta exitosa de
      // Stripe. Esta confirmación es idempotente y no duplica ningún efecto.
      if (distribucion.estado !== 'PAGADO') {
        await prisma.distribucionPago.update({
          where: { id: distribucion.id },
          data: {
            stripeTransferId: transfer.id,
            estado: 'PAGADO',
          },
        })
      }
      break
    }

    case 'transfer.reversed': {
      const transfer = event.data.object as Stripe.Transfer
      const distribucionId = transfer.metadata.distribucionId
      const distribucion = await prisma.distribucionPago.findFirst({
        where: {
          OR: [
            { stripeTransferId: transfer.id },
            ...(distribucionId ? [{ id: distribucionId }] : []),
          ],
        },
        select: { id: true, estado: true },
      })

      if (!distribucion) {
        console.warn(`transfer.reversed sin DistribucionPago correspondiente: ${transfer.id}`)
        break
      }

      if (distribucion.estado !== 'REEMBOLSADO') {
        await prisma.distribucionPago.update({
          where: { id: distribucion.id },
          data: { stripeTransferId: transfer.id, estado: 'REEMBOLSADO' },
        })
      }
      break
    }

    default:
      console.log(`Evento de Stripe recibido sin manejar todavía: ${event.type}`)
  }

  return new Response('OK', { status: 200 })
}
