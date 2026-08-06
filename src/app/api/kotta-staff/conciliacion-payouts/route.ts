/** Registra la conciliación mensual global de las comisiones Connect estimadas. */
import { EstadoPago, Role, TipoDestino } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function inicioYFinPeriodo(periodo: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) return null
  const [anio, mes] = periodo.split('-').map(Number)
  return { inicio: new Date(anio, mes - 1, 1), fin: new Date(anio, mes, 1) }
}

export async function POST(request: Request) {
  const user = await getSession()
  if (!user || user.role !== Role.KOTTA_STAFF) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json() as { periodo?: string; totalRealFacturado?: number }
  const rango = typeof body.periodo === 'string' ? inicioYFinPeriodo(body.periodo) : null
  const totalReal = Number(body.totalRealFacturado)
  const totalRealCentavos = Math.round(totalReal * 100)
  if (!rango || !Number.isFinite(totalReal) || totalRealCentavos < 0 || Math.abs(totalReal * 100 - totalRealCentavos) > 0.000001) {
    return Response.json({ error: 'Ingresa un período y monto válido.' }, { status: 400 })
  }

  // Consulta global intencional: esta conciliación pertenece a Kotta, no a un coto.
  const distribuciones = await prisma.distribucionPago.findMany({
    where: {
      destino: TipoDestino.PROVEEDOR,
      origenManual: false,
      estado: EstadoPago.PAGADO,
      updatedAt: { gte: rango.inicio, lt: rango.fin },
      comisionEstimada: { not: null },
    },
    select: { comisionEstimada: true },
  })
  const totalEstimadoCobrado = distribuciones.reduce((total, distribucion) => total + Number(distribucion.comisionEstimada ?? 0), 0)
  const totalRealFacturado = totalRealCentavos / 100
  const diferencia = totalRealFacturado - totalEstimadoCobrado

  const conciliacion = await prisma.conciliacionPayoutMensual.upsert({
    where: { periodo: body.periodo! },
    create: { periodo: body.periodo!, totalEstimadoCobrado, totalRealFacturado, diferencia, estado: 'CONCILIADO' },
    update: { totalEstimadoCobrado, totalRealFacturado, diferencia, estado: 'CONCILIADO' },
    select: { periodo: true, totalEstimadoCobrado: true, totalRealFacturado: true, diferencia: true, estado: true, updatedAt: true },
  })

  return Response.json({
    conciliacion: {
      ...conciliacion,
      totalEstimadoCobrado: Number(conciliacion.totalEstimadoCobrado),
      totalRealFacturado: Number(conciliacion.totalRealFacturado),
      diferencia: Number(conciliacion.diferencia),
    },
  })
}
