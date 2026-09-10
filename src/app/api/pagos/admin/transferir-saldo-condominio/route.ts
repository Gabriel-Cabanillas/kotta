/**
 * Transfiere saldo disponible de la plataforma a la cuenta conectada del
 * condominio. La reserva contable ocurre en una transacción corta; Stripe se
 * llama después del commit para no mantener locks durante una llamada de red.
 */
import { Prisma } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertFinancialOperationsAllowed, executeReservedTransfer, FinancialReviewRequired, transferReference } from '@/lib/stripe/financial-safety'
import { calcularDisponibleAhoraCoto, obtenerLiquidezPlataformaMx } from '@/lib/stripe/balance'

const ESTADOS_COMPROMETIDOS: Array<'PENDIENTE' | 'PROCESANDO' | 'PAGADO'> = [
  'PENDIENTE',
  'PROCESANDO',
  'PAGADO',
]

function mensajeDeDisponibilidad(disponibleAhora: number, enLiquidacion: number) {
  const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
  return `Tienes ${moneda.format(disponibleAhora)} disponibles para retirar ahora. El resto de tu saldo (${moneda.format(enLiquidacion)}) está en proceso de liquidación con Stripe y normalmente estará disponible en unos días.`
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN' || !user.orgId) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { monto, solicitudId } = (await req.json()) as {
    monto?: number
    solicitudId?: string
  }
  const montoNumero = Number(monto)
  const montoCentavos = Math.round(montoNumero * 100)

  if (
    !Number.isFinite(montoNumero) ||
    montoCentavos <= 0 ||
    Math.abs(montoNumero * 100 - montoCentavos) > 0.000001
  ) {
    return Response.json({ error: 'Ingresa un monto positivo válido' }, { status: 400 })
  }

  if (typeof solicitudId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(solicitudId)) {
    return Response.json(
      { error: 'Falta un identificador válido para la solicitud de retiro' },
      { status: 400 }
    )
  }

  const solicitudSegura = solicitudId
  const montoNormalizado = montoCentavos / 100

  const cuentaCondominio = await prisma.cuentaConectada.findUnique({
    where: { orgId: user.orgId },
    select: { id: true, stripeAccountId: true, payoutsEnabled: true },
  })

  if (!cuentaCondominio?.payoutsEnabled) {
    return Response.json(
      { error: 'El condominio no tiene una cuenta bancaria lista para recibir retiros' },
      { status: 400 }
    )
  }

  // Stripe se consulta antes de abrir la transacción: el balance es global y solo
  // se usa como tope físico junto con el saldo contable aislado del coto.
  let liquidezStripe: Awaited<ReturnType<typeof obtenerLiquidezPlataformaMx>>
  try {
    liquidezStripe = await obtenerLiquidezPlataformaMx()
  } catch (error) {
    console.error('No fue posible verificar la liquidez de Stripe para el retiro:', error)
    return Response.json(
      { error: 'No fue posible verificar la disponibilidad actual con Stripe. Intenta nuevamente.' },
      { status: 503 }
    )
  }

  let reserva:
    | { tipo: 'SIN_SALDO' }
    | { tipo: 'SIN_DISPONIBILIDAD_STRIPE'; disponibleAhora: number; enLiquidacion: number }
    | { tipo: 'PAGADO' }
    | { tipo: 'REEMBOLSADO' }
    | { tipo: 'DISTRIBUCION'; distribucion: Awaited<ReturnType<typeof prisma.distribucionPago.findFirst>> }
    | null = null

  for (let intentoTransaccion = 0; intentoTransaccion < 3; intentoTransaccion++) {
    try {
      reserva = await prisma.$transaction(async (tx) => {
        await assertFinancialOperationsAllowed(tx, user.orgId!)
        const referenciaSolicitud = `retiro:${solicitudSegura}|`
        const existente = await tx.distribucionPago.findFirst({
          where: {
            orgId: user.orgId!,
            destino: 'CONDOMINIO',
            workOrderId: null,
            referencia: { startsWith: referenciaSolicitud },
          },
        })

        if (existente) {
          if (existente.estado === 'PAGADO') return { tipo: 'PAGADO' as const }
          if (existente.estado === 'REEMBOLSADO') return { tipo: 'REEMBOLSADO' as const }
          return { tipo: 'DISTRIBUCION' as const, distribucion: existente }
        }

        const [cobros, distribuciones] = await Promise.all([
          tx.pago.findMany({
            where: {
              orgId: user.orgId!,
              tipoOperacion: 'CARGO',
              estado: 'PAGADO',
              enPlataforma: true,
            },
            select: { monto: true, montoNeto: true },
          }),
          tx.distribucionPago.findMany({
            where: {
              orgId: user.orgId!,
              origenManual: false,
              estado: { in: ESTADOS_COMPROMETIDOS },
            },
            select: { monto: true, comisionEstimada: true },
          }),
        ])

        const disponible = cobros.reduce((total, cobro) => total + Number(cobro.montoNeto ?? cobro.monto), 0)
          - distribuciones.reduce((total, distribucion) => total + Number(distribucion.monto) + Number(distribucion.comisionEstimada ?? 0), 0)
        if (montoNormalizado > disponible) return { tipo: 'SIN_SALDO' as const }
        const disponibleAhora = calcularDisponibleAhoraCoto(disponible, liquidezStripe.disponible)
        if (montoNormalizado > disponibleAhora) {
          return {
            tipo: 'SIN_DISPONIBILIDAD_STRIPE' as const,
            disponibleAhora,
            enLiquidacion: Math.max(0, disponible - disponibleAhora),
          }
        }

        const distribucion = await tx.distribucionPago.create({
          data: {
            orgId: user.orgId!,
            pagoOrigenId: null,
            destino: 'CONDOMINIO',
            cuentaConectadaId: cuentaCondominio.id,
            monto: montoNormalizado,
            estado: 'PENDIENTE',
            workOrderId: null,
            referencia: null,
          },
        })

        const reservada = await tx.distribucionPago.update({
          where: { id: distribucion.id },
          data: { referencia: transferReference(distribucion.id, {
            amount: montoCentavos, currency: 'mxn', destination: cuentaCondominio.stripeAccountId,
            metadata: { distribucionId: distribucion.id, orgId: user.orgId!, tipo: 'retiro_condominio' },
          }, solicitudSegura) },
        })
        return { tipo: 'DISTRIBUCION' as const, distribucion: reservada }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      break
    } catch (error: any) {
      if (error instanceof FinancialReviewRequired) return Response.json({ error: error.message }, { status: 409 })
      if (error.code === 'P2034' && intentoTransaccion < 2) continue
      throw error
    }
  }

  if (!reserva) {
    return Response.json(
      { error: 'No fue posible reservar el retiro. Intenta nuevamente.' },
      { status: 409 }
    )
  }
  if (reserva.tipo === 'SIN_SALDO') {
    return Response.json(
      { error: 'El monto solicitado excede el saldo disponible en plataforma' },
      { status: 400 }
    )
  }
  if (reserva.tipo === 'SIN_DISPONIBILIDAD_STRIPE') {
    return Response.json(
      { error: mensajeDeDisponibilidad(reserva.disponibleAhora, reserva.enLiquidacion) },
      { status: 400 }
    )
  }
  if (reserva.tipo === 'PAGADO') {
    return Response.json({ error: 'Esta solicitud de retiro ya fue procesada' }, { status: 409 })
  }
  if (reserva.tipo === 'REEMBOLSADO') {
    return Response.json(
      { error: 'Esta solicitud fue reembolsada. Genera un nuevo retiro.' },
      { status: 409 }
    )
  }

  const distribucion = reserva.distribucion
  if (!distribucion) {
    return Response.json(
      { error: 'No fue posible reservar el retiro. Intenta nuevamente.' },
      { status: 409 }
    )
  }

  try {
    const transfer = await executeReservedTransfer(distribucion, {
      orgId: user.orgId, amount: montoCentavos,
      destination: cuentaCondominio.stripeAccountId, accountId: cuentaCondominio.id,
    })
    return Response.json({ transferId: transfer.id, estado: 'PAGADO' })
  } catch (error) {
    if (error instanceof FinancialReviewRequired) return Response.json({ error: error.message }, { status: 409 })
    console.error('Retiro pendiente de confirmación:', error)
    return Response.json({ error: 'Resultado incierto. La reserva se conserva; el reintento utilizará la misma operación.' }, { status: 503 })
  }
}
