/**
 * Inicia el reembolso completo de un cobro del coto. Stripe confirma el
 * resultado final por webhook; esta ruta no cambia el estado del Pago.
 */
import { EstadoPago, TipoOperacionPago } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calcularDisponibleAhoraCoto, obtenerLiquidezPlataformaMx } from '@/lib/stripe/balance'
import { stripe } from '@/lib/stripe'

const ESTADOS_COMPROMETIDOS: EstadoPago[] = [
  EstadoPago.PENDIENTE,
  EstadoPago.PROCESANDO,
  EstadoPago.PAGADO,
]

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN' || !user.orgId) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { pagoId } = await req.json() as { pagoId?: string }
  if (!pagoId) return Response.json({ error: 'Falta pagoId' }, { status: 400 })

  const pago = await prisma.pago.findFirst({
    where: {
      id: pagoId,
      orgId: user.orgId,
      tipoOperacion: TipoOperacionPago.CARGO,
      estado: EstadoPago.PAGADO,
      enPlataforma: true,
    },
    select: {
      id: true,
      monto: true,
      montoConRecargo: true,
      stripePaymentIntentId: true,
    },
  })

  if (!pago) {
    return Response.json(
      { error: 'El pago no existe, no pertenece a tu condominio o ya no puede reembolsarse.' },
      { status: 404 }
    )
  }
  if (!pago.stripePaymentIntentId) {
    return Response.json({ error: 'El pago no tiene una referencia de Stripe para reembolsar.' }, { status: 400 })
  }

  const montoReembolso = Number(pago.montoConRecargo ?? pago.monto)
  const montoCentavos = Math.round(montoReembolso * 100)
  if (!Number.isFinite(montoCentavos) || montoCentavos <= 0) {
    return Response.json({ error: 'El pago tiene un monto inválido para reembolsar.' }, { status: 400 })
  }

  // La disponibilidad física se consulta fuera de cualquier transacción. Solo
  // se usa como tope junto con el saldo del coto; nunca se devuelve el balance
  // global de Stripe al administrador.
  let liquidezStripe: Awaited<ReturnType<typeof obtenerLiquidezPlataformaMx>>
  try {
    liquidezStripe = await obtenerLiquidezPlataformaMx()
  } catch (error) {
    console.error('No fue posible verificar la liquidez de Stripe para el reembolso:', error)
    return Response.json(
      { error: 'No fue posible verificar la disponibilidad actual con Stripe. Intenta nuevamente.' },
      { status: 503 }
    )
  }

  const [cobros, distribuciones] = await Promise.all([
    prisma.pago.findMany({
      where: {
        orgId: user.orgId,
        tipoOperacion: TipoOperacionPago.CARGO,
        estado: EstadoPago.PAGADO,
        enPlataforma: true,
      },
      select: { monto: true, montoNeto: true },
    }),
    prisma.distribucionPago.findMany({
      where: {
        orgId: user.orgId,
        origenManual: false,
        estado: { in: ESTADOS_COMPROMETIDOS },
      },
      select: { monto: true, comisionEstimada: true },
    }),
  ])

  const saldoContable = Math.max(0, cobros.reduce(
    (total, cobro) => total + Number(cobro.montoNeto ?? cobro.monto),
    0
  ) - distribuciones.reduce(
    (total, distribucion) => total + Number(distribucion.monto) + Number(distribucion.comisionEstimada ?? 0),
    0
  ))
  const disponibleAhora = calcularDisponibleAhoraCoto(saldoContable, liquidezStripe.disponible)

  if (montoReembolso > disponibleAhora) {
    return Response.json({
      error: `No es posible reembolsar ${moneda.format(montoReembolso)} ahora. Tu condominio tiene ${moneda.format(disponibleAhora)} disponibles; el resto del saldo puede estar comprometido en pagos a proveedores, retiros o en proceso de liquidación.`,
    }, { status: 400 })
  }

  try {
    const refund = await stripe.refunds.create(
      { payment_intent: pago.stripePaymentIntentId },
      { idempotencyKey: `reembolso-${pago.id}` }
    )

    return Response.json({
      refundId: refund.id,
      estado: refund.status,
      montoReembolso,
    })
  } catch (error: any) {
    console.error(`No fue posible iniciar el reembolso del Pago ${pago.id}:`, error)
    if (error.code === 'balance_insufficient') {
      return Response.json({
        error: `No es posible reembolsar ${moneda.format(montoReembolso)} ahora porque la disponibilidad de Stripe cambió. Intenta nuevamente más tarde.`,
      }, { status: 400 })
    }
    return Response.json({ error: 'No fue posible iniciar el reembolso en Stripe. Intenta nuevamente.' }, { status: 502 })
  }
}
