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
  if (!destinatario) return Response.json({ error: 'No autorizado' }, { status: 403 })
  const cuentaConectada = await prisma.cuentaConectada.findUnique({ where: { orgId: user.orgId } })
  if (!cuentaConectada?.chargesEnabled) return Response.json({ error: 'El condominio aún no puede recibir pagos.' }, { status: 400 })

  const montoOriginal = Number(destinatario.cargo.monto)
  const recargo = metodo === 'tarjeta' ? calcularRecargoTarjeta(montoOriginal) : null
  const montoCentavos = recargo?.montoCentavos ?? Math.round(montoOriginal * 100)

  let pago = await prisma.pago.findFirst({ where: { cargoId, vecinoId: user.id }, orderBy: { createdAt: 'desc' } })
  if (!pago) {
    pago = await prisma.pago.create({ data: { orgId: user.orgId, cargoId, vecinoId: user.id, monto: montoOriginal, montoOriginal, montoConRecargo: recargo?.montoConRecargo ?? null, metodoPagoSeleccionado: metodo, estado: EstadoPago.PENDIENTE, tipoOperacion: TipoOperacionPago.CARGO } })
  }
  const estadosResueltos: EstadoPago[] = [EstadoPago.PAGADO, EstadoPago.REEMBOLSADO, EstadoPago.EN_DISPUTA, EstadoPago.DISPUTA_PERDIDA]
  if (estadosResueltos.includes(pago.estado)) {
    return Response.json({ error: 'Este cargo ya fue resuelto y no puede cobrarse nuevamente.' }, { status: 400 })
  }

  let reutilizar = pago.stripePaymentIntentId && pago.metodoPagoSeleccionado === metodo
  if (reutilizar && pago.stripePaymentIntentId) {
    const existente = await stripe.paymentIntents.retrieve(pago.stripePaymentIntentId)
    if (!['succeeded', 'canceled'].includes(existente.status) && existente.client_secret) return Response.json({ clientSecret: existente.client_secret, montoOriginal, montoConRecargo: recargo?.montoConRecargo ?? null, metodoPagoSeleccionado })
    reutilizar = false
  }
  if (!reutilizar && pago.stripePaymentIntentId) {
    try { await stripe.paymentIntents.cancel(pago.stripePaymentIntentId) } catch { /* Intent terminal o ya cancelado; se crea uno nuevo. */ }
  }

  const intent = await stripe.paymentIntents.create({
    amount: montoCentavos,
    currency: 'mxn',
    ...(metodo === 'tarjeta' ? { payment_method_types: ['card'] } : { automatic_payment_methods: { enabled: true } }),
    transfer_group: `cargo-${pago.id}`,
    metadata: { cargoId, vecinoId: user.id, orgId: user.orgId, metodoPagoSeleccionado: metodo, montoOriginal: montoOriginal.toFixed(2), montoConRecargo: recargo?.montoConRecargo.toFixed(2) ?? '' },
  }, { idempotencyKey: `pago-${pago.id}-${pago.stripePaymentIntentId ?? 'inicial'}-${metodo}` })

  await prisma.pago.update({ where: { id: pago.id }, data: { stripePaymentIntentId: intent.id, monto: montoOriginal, montoOriginal, montoConRecargo: recargo?.montoConRecargo ?? null, metodoPagoSeleccionado: metodo, estado: EstadoPago.PENDIENTE } })
  return Response.json({ clientSecret: intent.client_secret, montoOriginal, montoConRecargo: recargo?.montoConRecargo ?? null, metodoPagoSeleccionado: metodo })
}
