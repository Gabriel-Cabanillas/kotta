/** Crea el PaymentIntent del cargo vecino con recargo transparente solo para tarjeta. */
import { EstadoPago, TipoOperacionPago } from '@prisma/client'
import { calcularRecargoTarjeta } from '@/lib/stripe/fees'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

type MetodoPago = 'tarjeta' | 'spei'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'VECINO' || !user.orgId) return Response.json({ error: 'No autorizado' }, { status: 403 })

  const { cargoId, metodoPagoSeleccionado } = await req.json() as { cargoId?: string; metodoPagoSeleccionado?: MetodoPago }
  if (!cargoId || !['tarjeta', 'spei'].includes(metodoPagoSeleccionado ?? '')) return Response.json({ error: 'Selecciona un método de pago válido.' }, { status: 400 })
  const metodo = metodoPagoSeleccionado as MetodoPago

  const destinatario = await prisma.cargoDestinatario.findUnique({ where: { cargoId_viviendaId: { cargoId, viviendaId: user.id } }, include: { cargo: true } })
  if (!destinatario || destinatario.cargo.orgId !== user.orgId) return Response.json({ error: 'No autorizado' }, { status: 403 })
  const cuentaConectada = await prisma.cuentaConectada.findUnique({ where: { orgId: user.orgId } })
  if (!cuentaConectada?.chargesEnabled) return Response.json({ error: 'El condominio aún no puede recibir pagos.' }, { status: 400 })

  const montoOriginal = Number(destinatario.cargo.monto)
  const recargo = metodo === 'tarjeta' ? calcularRecargoTarjeta(montoOriginal) : null
  const montoCentavos = recargo?.montoCentavos ?? Math.round(montoOriginal * 100)

  let pago = await prisma.pago.findFirst({ where: { cargoId, vecinoId: user.id }, orderBy: { createdAt: 'desc' } })
  if (pago && pago.orgId !== user.orgId) return Response.json({ error: 'No autorizado' }, { status: 403 })
  if (!pago) {
    try {
      pago = await prisma.pago.create({ data: { orgId: user.orgId, cargoId, vecinoId: user.id, monto: montoOriginal, montoOriginal, montoConRecargo: recargo?.montoConRecargo ?? null, metodoPagoSeleccionado: metodo, estado: EstadoPago.PENDIENTE, tipoOperacion: TipoOperacionPago.CARGO } })
    } catch (error) {
      if ((error as { code?: string }).code !== 'P2002') throw error
      return Response.json({ error: 'El cargo ya está siendo preparado. Consulta nuevamente su estado.' }, { status: 409 })
    }
  }
  const estadosResueltos: EstadoPago[] = [EstadoPago.PAGADO, EstadoPago.REEMBOLSADO, EstadoPago.EN_DISPUTA, EstadoPago.DISPUTA_PERDIDA]
  if (estadosResueltos.includes(pago.estado)) {
    return Response.json({ error: 'Este cargo ya fue resuelto y no puede cobrarse nuevamente.' }, { status: 400 })
  }

  if (pago.stripePaymentIntentId) {
    try {
      const existente = await stripe.paymentIntents.retrieve(pago.stripePaymentIntentId)
      if (['succeeded', 'processing', 'requires_capture', 'canceled'].includes(existente.status)) {
        return Response.json({ error: 'Este intento está confirmado, en proceso o cerrado. No se creará otro cobro.' }, { status: 409 })
      }
      if (pago.metodoPagoSeleccionado !== metodo || existente.amount !== montoCentavos || existente.currency !== 'mxn' ||
          !['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existente.status) || !existente.client_secret) {
        return Response.json({ error: 'Conserva el método e importe del intento existente o solicita conciliación.' }, { status: 409 })
      }
      return Response.json({ clientSecret: existente.client_secret, montoOriginal, montoConRecargo: recargo?.montoConRecargo ?? null, metodoPagoSeleccionado })
    } catch {
      return Response.json({ error: 'No se pudo confirmar el estado del intento existente. No se creó otro cobro.' }, { status: 503 })
    }
  }

  // Solo el ganador de este CAS inicia Stripe. Una respuesta perdida conserva
  // la marca: ningún retry crea otro PI, ni siquiera después de 24 horas.
  if (Number(pago.monto) !== montoOriginal || Math.round(Number(pago.montoConRecargo ?? pago.monto) * 100) !== montoCentavos) {
    return Response.json({ error: 'El importe del intento cambió. Se requiere conciliación antes de cobrar.' }, { status: 409 })
  }
  const claimed = await prisma.pago.updateMany({
    where: { id: pago.id, orgId: user.orgId, stripePaymentIntentId: null, referencia: null, estado: EstadoPago.PENDIENTE, metodoPagoSeleccionado: metodo },
    data: { estado: EstadoPago.PROCESANDO, referencia: 'payment-intent:reserved:v1' },
  })
  if (claimed.count !== 1) return Response.json({ error: 'Intento pendiente de confirmación o conciliación. No se creará otro cobro.' }, { status: 409 })

  try {
  const intent = await stripe.paymentIntents.create({
    amount: montoCentavos,
    currency: 'mxn',
    ...(metodo === 'tarjeta' ? { payment_method_types: ['card'] } : { automatic_payment_methods: { enabled: true } }),
    transfer_group: `cargo-${pago.id}`,
    metadata: { pagoId: pago.id, cargoId, vecinoId: user.id, orgId: user.orgId, metodoPagoSeleccionado: metodo, montoOriginal: montoOriginal.toFixed(2), montoConRecargo: recargo?.montoConRecargo.toFixed(2) ?? '' },
  }, { idempotencyKey: `pago-${pago.id}-v1` })

  await prisma.pago.updateMany({ where: { id: pago.id, orgId: user.orgId, stripePaymentIntentId: null, referencia: 'payment-intent:reserved:v1' }, data: { stripePaymentIntentId: intent.id } })
  return Response.json({ clientSecret: intent.client_secret, montoOriginal, montoConRecargo: recargo?.montoConRecargo ?? null, metodoPagoSeleccionado: metodo })
  } catch {
    return Response.json({ error: 'El resultado del intento requiere confirmación. No repitas el cobro; solicita conciliación si persiste.' }, { status: 503 })
  }
}
