/**
 * Endpoint que recibe los eventos (webhooks) que Stripe envía a Kotta.
 * Se relaciona con lib/stripe.ts, el modelo WebhookEvent de Prisma,
 * y con la lógica de cuentas conectadas, cargos y transferencias
 * que se agregará en fases posteriores.
 * Existe para mantener sincronizado el estado de Kotta con el de Stripe
 * (pagos confirmados, cuentas verificadas, transferencias, etc.)
 */
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { notificarPagoExitoso, notificarPagoFallido } from '@/lib/notificaciones'
import Stripe from 'stripe'

export const runtime = 'nodejs' // requerido: necesitamos el body crudo, no el parseado por defecto

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

      // Como estos son Direct Charges, el PaymentIntent vive en la cuenta
      // conectada del condominio. Stripe incluye esa cuenta en `event.account`
      // cuando el webhook está configurado para escuchar eventos de cuentas conectadas.
      const cuentaConectadaId = event.account

      const comprobanteUrl =
        typeof paymentIntent.latest_charge === 'string'
          ? null // el charge expandido no viene por defecto; se puede resolver con stripe.charges.retrieve si se necesita la URL del recibo
          : paymentIntent.latest_charge?.receipt_url ?? null

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
          `payment_intent.succeeded sin Pago correspondiente: ${paymentIntent.id} (cuenta ${cuentaConectadaId})`
        )
        break
      }

      await prisma.pago.update({
        where: { id: pagoExitoso.id },
        data: {
          estado: 'PAGADO',
          comprobanteUrl: comprobanteUrl ?? undefined,
        },
      })

      await notificarPagoExitoso(pagoExitoso.id)

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

      await prisma.pago.update({
        where: { id: pagoFallido.id },
        data: {
          estado: 'FALLIDO',
          referencia: mensajeError ?? undefined,
        },
      })

      await notificarPagoFallido(pagoFallido.id, mensajeError)

      break
    }

    // TODO Fase 3: 'transfer.created' / 'transfer.failed' -> actualizar Pago (tipo TRANSFERENCIA)
    default:
      console.log(`Evento de Stripe recibido sin manejar todavía: ${event.type}`)
  }

  return new Response('OK', { status: 200 })
}