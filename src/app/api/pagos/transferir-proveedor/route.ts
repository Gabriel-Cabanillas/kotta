/**
 * Transfiere desde el balance de plataforma al proveedor de una orden completada.
 * Reserva una DistribucionPago en una transacción corta y serializable antes de
 * llamar a Stripe, para no gastar dos veces el saldo contable de un condominio.
 */
import { Prisma } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { calcularDisponibleAhoraCoto, obtenerLiquidezPlataformaMx } from '@/lib/stripe/balance'
import { calcularComisionPayoutEstimada } from '@/lib/stripe/fees'
import type Stripe from 'stripe'

type StripeError = {
  code?: string
  message?: string
}

const ESTADOS_COMPROMETIDOS: Array<'PENDIENTE' | 'PROCESANDO' | 'PAGADO'> = [
  'PENDIENTE',
  'PROCESANDO',
  'PAGADO',
]

function numeroDeIntento(referencia: string | null) {
  const coincidencia = referencia?.match(/^intento:(\d+)/)
  return coincidencia ? Number(coincidencia[1]) : 0
}

function referenciaDeIntento(intentos: number, mensaje?: string) {
  return mensaje ? `intento:${intentos} | ${mensaje}` : `intento:${intentos}`
}

function mensajeDeDisponibilidad(disponibleAhora: number, enLiquidacion: number) {
  const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
  return `Tienes ${moneda.format(disponibleAhora)} disponibles para retirar ahora. El resto de tu saldo (${moneda.format(enLiquidacion)}) está en proceso de liquidación con Stripe y normalmente estará disponible en unos días.`
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN' || !user.orgId) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { ordenId } = (await req.json()) as { ordenId?: string }
  if (!ordenId) {
    return Response.json({ error: 'Falta ordenId' }, { status: 400 })
  }

  // La organización se valida desde la consulta para impedir transferencias
  // sobre órdenes de otro coto.
  const orden = await prisma.workOrder.findFirst({
    where: { id: ordenId, orgId: user.orgId },
    select: { id: true, status: true, cost: true, providerId: true },
  })

  if (!orden) {
    return Response.json({ error: 'Orden no encontrada' }, { status: 404 })
  }
  if (orden.status !== 'COMPLETADA') {
    return Response.json({ error: 'Solo se pueden pagar órdenes completadas' }, { status: 400 })
  }

  const montoCentavos = Math.round(Number(orden.cost ?? 0) * 100)
  if (!Number.isFinite(montoCentavos) || montoCentavos <= 0) {
    return Response.json({ error: 'La orden no tiene un costo válido para pagar' }, { status: 400 })
  }
  const montoProveedor = montoCentavos / 100
  const { comisionEstimada, totalDescontado } = calcularComisionPayoutEstimada(montoProveedor)

  const cuentaProveedor = await prisma.cuentaConectada.findUnique({
    where: { proveedorId: orden.providerId },
    select: { id: true, stripeAccountId: true, payoutsEnabled: true },
  })

  if (!cuentaProveedor?.payoutsEnabled) {
    return Response.json({ error: 'El proveedor aún no tiene una cuenta lista para recibir pagos' }, { status: 400 })
  }

  // Esta llamada de red ocurre antes de la reserva serializable. Nunca se
  // expone este balance global: únicamente se usa como tope para el coto.
  let liquidezStripe: Awaited<ReturnType<typeof obtenerLiquidezPlataformaMx>>
  try {
    liquidezStripe = await obtenerLiquidezPlataformaMx()
  } catch (error) {
    console.error('No fue posible verificar la liquidez de Stripe para el proveedor:', error)
    return Response.json(
      { error: 'No fue posible verificar la disponibilidad actual con Stripe. Intenta nuevamente.' },
      { status: 503 }
    )
  }

  let reserva:
    | { tipo: 'LEGACY' }
    | { tipo: 'SIN_SALDO' }
    | { tipo: 'SIN_DISPONIBILIDAD_STRIPE'; disponibleAhora: number; enLiquidacion: number }
    | { tipo: 'DISTRIBUCION'; distribucion: Awaited<ReturnType<typeof prisma.distribucionPago.findUnique>> }
    | null = null

  // El cálculo y la reserva son atómicos. Stripe se llama después del commit:
  // nunca mantenemos locks de la base mientras esperamos una llamada de red.
  for (let intentoTransaccion = 0; intentoTransaccion < 3; intentoTransaccion++) {
    try {
      reserva = await prisma.$transaction(async (tx) => {
        // Compatibilidad temporal: el Pago TRANSFERENCIA histórico no tiene un
        // origen contable verificable; impedir otro pago evita duplicar los $400.
        const pagoLegacy = await tx.pago.findUnique({
          where: { workOrderId: orden.id },
          select: { tipoOperacion: true },
        })
        if (pagoLegacy?.tipoOperacion === 'TRANSFERENCIA') {
          return { tipo: 'LEGACY' as const }
        }

        const existente = await tx.distribucionPago.findUnique({
          where: { workOrderId: orden.id },
        })

        if (existente) {
          if (existente.estado === 'FALLIDO') {
            const siguienteIntento = numeroDeIntento(existente.referencia) + 1
            const reintentada = await tx.distribucionPago.update({
              where: { id: existente.id },
              data: {
                estado: 'PENDIENTE',
                referencia: referenciaDeIntento(siguienteIntento),
                montoOriginal: montoProveedor,
                comisionEstimada,
              },
            })
            return { tipo: 'DISTRIBUCION' as const, distribucion: reintentada }
          }

          return { tipo: 'DISTRIBUCION' as const, distribucion: existente }
        }

        // Todas las distribuciones comprometidas del coto, sin importar si su
        // destino es CONDOMINIO o PROVEEDOR, reducen el saldo disponible.
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

        const comprometido = distribuciones.reduce(
          (total, distribucion) => total + Number(distribucion.monto) + Number(distribucion.comisionEstimada ?? 0),
          0
        )
        const disponible = cobros.reduce((total, cobro) => total + Number(cobro.montoNeto ?? cobro.monto), 0) - comprometido
        if (totalDescontado > disponible) {
          return { tipo: 'SIN_SALDO' as const }
        }
        const disponibleAhora = calcularDisponibleAhoraCoto(disponible, liquidezStripe.disponible)
        if (totalDescontado > disponibleAhora) {
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
            destino: 'PROVEEDOR',
            cuentaConectadaId: cuentaProveedor.id,
            monto: montoProveedor,
            montoOriginal: montoProveedor,
            comisionEstimada,
            estado: 'PENDIENTE',
            workOrderId: orden.id,
            referencia: referenciaDeIntento(1),
          },
        })

        return { tipo: 'DISTRIBUCION' as const, distribucion }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      break
    } catch (error: any) {
      // Un conflicto serializable se reintenta con el saldo recalculado. P2002
      // indica que otra solicitud ya reservó esta misma orden.
      if (error.code === 'P2034' && intentoTransaccion < 2) continue
      if (error.code === 'P2002') {
        const existente = await prisma.distribucionPago.findUnique({
          where: { workOrderId: orden.id },
        })
        if (existente) {
          reserva = { tipo: 'DISTRIBUCION', distribucion: existente }
          break
        }
      }
      throw error
    }
  }

  if (!reserva) {
    return Response.json({ error: 'No fue posible reservar el pago. Intenta nuevamente.' }, { status: 409 })
  }
  if (reserva.tipo === 'LEGACY') {
    return Response.json({ error: 'Esta orden tiene un pago histórico pendiente de conciliación manual' }, { status: 409 })
  }
  if (reserva.tipo === 'SIN_SALDO') {
    return Response.json({ error: 'El condominio no tiene saldo disponible suficiente para pagar esta orden' }, { status: 400 })
  }
  if (reserva.tipo === 'SIN_DISPONIBILIDAD_STRIPE') {
    return Response.json(
      { error: mensajeDeDisponibilidad(reserva.disponibleAhora, reserva.enLiquidacion) },
      { status: 400 }
    )
  }

  let distribucion = reserva.distribucion
  if (!distribucion) {
    return Response.json({ error: 'No fue posible reservar el pago. Intenta nuevamente.' }, { status: 409 })
  }
  if (distribucion.estado === 'PAGADO') {
    return Response.json({ error: 'Esta orden ya fue pagada al proveedor' }, { status: 409 })
  }
  if (distribucion.estado === 'REEMBOLSADO') {
    return Response.json({ error: 'Esta orden ya fue pagada y posteriormente reembolsada' }, { status: 409 })
  }

  const numeroIntento = Math.max(1, numeroDeIntento(distribucion.referencia))
  let transfer: Stripe.Transfer

  try {
    transfer = await stripe.transfers.create(
      {
        amount: montoCentavos,
        currency: 'mxn',
        destination: cuentaProveedor.stripeAccountId,
        metadata: {
          distribucionId: distribucion.id,
          ordenId: orden.id,
          orgId: user.orgId,
          proveedorId: orden.providerId,
        },
      },
      { idempotencyKey: `transferencia-${distribucion.id}-${numeroIntento}` }
    )
  } catch (error) {
    const stripeError = error as StripeError
    const mensaje = stripeError.message ?? 'No fue posible iniciar la transferencia'
    await prisma.distribucionPago.update({
      where: { id: distribucion.id },
      data: { estado: 'FALLIDO', referencia: referenciaDeIntento(numeroIntento, mensaje) },
    })

    if (stripeError.code === 'balance_insufficient') {
      return Response.json(
        { error: 'La disponibilidad de Stripe cambió mientras se procesaba el pago. Intenta nuevamente para verificar el monto disponible ahora.' },
        { status: 400 }
      )
    }

    console.error('Error al transferir pago al proveedor:', error)
    return Response.json(
      { error: 'No fue posible iniciar la transferencia. Intenta nuevamente.' },
      { status: 502 }
    )
  }

  // Stripe respondió exitosamente; se confirma de forma síncrona. Esta
  // escritura queda fuera del catch para no falsear un Transfer ya creado.
  await prisma.distribucionPago.update({
    where: { id: distribucion.id },
    data: {
      stripeTransferId: transfer.id,
      estado: 'PAGADO',
      referencia: null,
    },
  })

  return Response.json({
    transferId: transfer.id,
    estado: 'PAGADO',
    montoProveedor,
    comisionEstimada,
    totalDescontado,
  })
}
