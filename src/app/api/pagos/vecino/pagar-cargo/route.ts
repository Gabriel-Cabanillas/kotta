/**
 * Crea o reutiliza el PaymentIntent para que un vecino pague un Cargo mediante
 * un Direct Charge sobre la cuenta conectada del condominio.
 *
 * Se relaciona con Pago, Cargo, CargoDestinatario y CuentaConectada. Existe
 * para validar al destinatario, evitar cobros duplicados y reutilizar el mismo
 * intento de Stripe cuando llegan solicitudes concurrentes.
 */
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'VECINO' || !user.orgId) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { cargoId } = (await req.json()) as { cargoId: string }
  if (!cargoId) {
    return Response.json({ error: 'Falta cargoId' }, { status: 400 })
  }

  // 1. Confirma que este vecino es destinatario de este cargo.
  const destinatario = await prisma.cargoDestinatario.findUnique({
    where: { cargoId_viviendaId: { cargoId, viviendaId: user.id } },
    include: { cargo: true },
  })

  if (!destinatario) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const cargo = destinatario.cargo

  // 2. Confirma que el condominio puede recibir pagos antes de reservar un Pago.
  const cuentaConectada = await prisma.cuentaConectada.findUnique({
    where: { orgId: user.orgId },
  })

  if (!cuentaConectada || !cuentaConectada.chargesEnabled) {
    return Response.json({ error: 'El condominio aun no puede recibir pagos' }, { status: 400 })
  }

  // 3. Reserva una sola fila Pago para el cargo y vecino. La constraint
  // (cargoId, vecinoId) es la garantIa final ante solicitudes simultaneas.
  let pagoExistente = null as Awaited<ReturnType<typeof prisma.pago.findFirst>>
  try {
    pagoExistente = await prisma.$transaction(async (tx) => {
      const existente = await tx.pago.findFirst({
        where: { cargoId, vecinoId: user.id },
        orderBy: { createdAt: 'desc' },
      })

      if (existente) return existente

      return tx.pago.create({
        data: {
          orgId: user.orgId,
          cargoId: cargo.id,
          vecinoId: user.id,
          monto: cargo.monto,
          estado: 'PENDIENTE',
          tipoOperacion: 'CARGO',
        },
      })
    })
  } catch (err: any) {
    // Otra peticion pudo insertar la fila entre findFirst y create. P2002
    // corresponde a la constraint compuesta; recuperamos y reutilizamos la fila ganadora.
    if (err.code === 'P2002') {
      pagoExistente = await prisma.pago.findFirst({
        where: { cargoId, vecinoId: user.id },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!pagoExistente) throw err
  }

  if (pagoExistente.estado === 'PAGADO') {
    return Response.json({ error: 'Este cargo ya fue pagado' }, { status: 400 })
  }

  // 4. Reutiliza un PaymentIntent pendiente. Si el anterior esta terminal,
  // crea uno nuevo y actualiza la misma fila Pago reservada.
  let paymentIntentId = pagoExistente.stripePaymentIntentId
  let clientSecret: string | null = null

  if (paymentIntentId) {
    const intentExistente = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      {},
      { stripeAccount: cuentaConectada.stripeAccountId }
    )

    if (intentExistente.status !== 'succeeded' && intentExistente.status !== 'canceled') {
      clientSecret = intentExistente.client_secret
    }
  }

  if (!clientSecret) {
    const montoCentavos = Math.round(Number(cargo.monto) * 100)
    const intentoAnteriorId = paymentIntentId ?? 'inicial'

    // Dos solicitudes que reservan el mismo Pago antes de guardar su PI reciben
    // el mismo PaymentIntent de Stripe. Un intento terminal usa una clave nueva.
    const intent = await stripe.paymentIntents.create(
      {
        amount: montoCentavos,
        currency: 'mxn',
        automatic_payment_methods: { enabled: true },
        metadata: { cargoId: cargo.id, vecinoId: user.id, orgId: user.orgId },
      },
      {
        stripeAccount: cuentaConectada.stripeAccountId,
        idempotencyKey: `pago-${pagoExistente.id}-${intentoAnteriorId}`,
      }
    )

    clientSecret = intent.client_secret
    paymentIntentId = intent.id

    await prisma.pago.update({
      where: { id: pagoExistente.id },
      data: { stripePaymentIntentId: paymentIntentId, estado: 'PENDIENTE' },
    })
  }

  return Response.json({ clientSecret, stripeAccountId: cuentaConectada.stripeAccountId })
}
