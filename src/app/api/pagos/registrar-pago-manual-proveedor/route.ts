/**
 * Registra un pago externo a un proveedor sin crear una transferencia Stripe.
 * El registro conserva el historial del coto, pero no compromete saldo de plataforma.
 */
import { EstadoPago, Role, TipoCuentaConectada, TipoDestino } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function fechaLocal(valor: string) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (!coincidencia) return null

  const [, anioTexto, mesTexto, diaTexto] = coincidencia
  const anio = Number(anioTexto)
  const mes = Number(mesTexto)
  const dia = Number(diaTexto)
  const fecha = new Date(anio, mes - 1, dia, 12, 0, 0, 0)

  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return null
  return fecha
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user || user.role !== Role.ADMIN || !user.orgId) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const cuerpo = await request.json() as {
    proveedorId?: string
    monto?: number
    nota?: string
    concepto?: string
    fechaPago?: string
    ordenId?: string
  }
  const monto = Number(cuerpo.monto)
  const montoCentavos = Math.round(monto * 100)
  const notaManual = (cuerpo.nota ?? cuerpo.concepto ?? '').trim()
  const fechaPago = typeof cuerpo.fechaPago === 'string' ? fechaLocal(cuerpo.fechaPago) : null

  if (!cuerpo.proveedorId) return Response.json({ error: 'Selecciona un proveedor.' }, { status: 400 })
  if (!Number.isFinite(monto) || montoCentavos <= 0 || Math.abs(monto * 100 - montoCentavos) > 0.000001) {
    return Response.json({ error: 'Ingresa un monto positivo válido.' }, { status: 400 })
  }
  if (!fechaPago) return Response.json({ error: 'Ingresa una fecha de pago válida.' }, { status: 400 })
  if (notaManual.length > 500) return Response.json({ error: 'La nota no puede superar 500 caracteres.' }, { status: 400 })

  const proveedor = await prisma.user.findFirst({
    where: { id: cuerpo.proveedorId, orgId: user.orgId, role: Role.PROVEEDOR },
    select: { id: true, cuentaConectada: { select: { id: true, tipo: true } } },
  })
  if (!proveedor) return Response.json({ error: 'Proveedor no encontrado en este condominio.' }, { status: 404 })
  if (!proveedor.cuentaConectada || proveedor.cuentaConectada.tipo !== TipoCuentaConectada.PROVEEDOR) {
    return Response.json({ error: 'El proveedor necesita una cuenta de pago registrada para conservar este historial.' }, { status: 400 })
  }

  let workOrderId: string | null = null
  if (cuerpo.ordenId) {
    const orden = await prisma.workOrder.findFirst({
      where: { id: cuerpo.ordenId, orgId: user.orgId, providerId: proveedor.id, ticket: { orgId: user.orgId, reportedBy: { orgId: user.orgId } } },
      select: { id: true },
    })
    if (!orden) return Response.json({ error: 'La orden no corresponde a este proveedor o condominio.' }, { status: 400 })

    const existente = await prisma.distribucionPago.findUnique({ where: { workOrderId: orden.id }, select: { id: true } })
    if (existente) return Response.json({ error: 'Esta orden ya tiene un pago registrado.' }, { status: 409 })
    workOrderId = orden.id
  }

  const distribucion = await prisma.distribucionPago.create({
    data: {
      orgId: user.orgId,
      pagoOrigenId: null,
      destino: TipoDestino.PROVEEDOR,
      cuentaConectadaId: proveedor.cuentaConectada.id,
      monto: montoCentavos / 100,
      montoOriginal: montoCentavos / 100,
      estado: EstadoPago.PAGADO,
      origenManual: true,
      notaManual: notaManual || null,
      stripeTransferId: null,
      sourceTransactionId: null,
      workOrderId,
      createdAt: fechaPago,
      updatedAt: fechaPago,
    },
    select: { id: true, monto: true, estado: true, origenManual: true, notaManual: true, updatedAt: true },
  })

  return Response.json({ distribucion: { ...distribucion, monto: Number(distribucion.monto) } }, { status: 201 })
}
