/** Genera el reporte financiero PDF del condominio del administrador autenticado. */
import { EstadoPago, TipoDestino, TipoOperacionPago } from '@prisma/client'
import { renderToBuffer } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import ReporteFinancieroDocument from '@/lib/pdf/ReporteFinancieroDocument'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
const ESTADOS_COMPROMETIDOS: EstadoPago[] = [EstadoPago.PENDIENTE, EstadoPago.PROCESANDO, EstadoPago.PAGADO]

function fechaLocal(valor: string) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (!coincidencia) return null
  const [, anioTexto, mesTexto, diaTexto] = coincidencia
  const anio = Number(anioTexto), mes = Number(mesTexto), dia = Number(diaTexto)
  const fecha = new Date(anio, mes - 1, dia)
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia ? fecha : null
}

function agrupar(filas: Array<{ id: string; etiqueta: string; monto: number }>) {
  return Array.from(filas.reduce((grupos, fila) => {
    const actual = grupos.get(fila.id) ?? { etiqueta: fila.etiqueta, monto: 0 }
    actual.monto += fila.monto
    grupos.set(fila.id, actual)
    return grupos
  }, new Map<string, { etiqueta: string; monto: number }>()).values()).sort((a, b) => b.monto - a.monto)
}

export async function GET(request: Request) {
  const user = await getSession()
  if (!user || user.role !== 'ADMIN' || !user.orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const params = new URL(request.url).searchParams
  const desdeParam = params.get('desde'), hastaParam = params.get('hasta')
  const desde = desdeParam ? fechaLocal(desdeParam) : null
  const hasta = hastaParam ? fechaLocal(hastaParam) : null
  if (!desde || !hasta || desde > hasta) return NextResponse.json({ error: 'El rango de fechas no es válido.' }, { status: 400 })

  const inicio = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate(), 0, 0, 0, 0)
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate(), 23, 59, 59, 999)
  const rango = { gte: inicio, lte: fin }
  const [pagos, distribuciones, cobrosEnPlataforma, distribucionesComprometidas] = await Promise.all([
    prisma.pago.findMany({ where: { orgId: user.orgId, tipoOperacion: TipoOperacionPago.CARGO, updatedAt: rango }, orderBy: { updatedAt: 'desc' }, select: { id: true, monto: true, estado: true, updatedAt: true, cargo: { select: { concepto: true } }, vecino: { select: { id: true, name: true, houseNumber: true } } } }),
    prisma.distribucionPago.findMany({ where: { orgId: user.orgId, updatedAt: rango }, orderBy: { updatedAt: 'desc' }, select: { id: true, destino: true, monto: true, montoOriginal: true, comisionEstimada: true, estado: true, origenManual: true, notaManual: true, updatedAt: true, workOrder: { select: { provider: { select: { id: true, name: true } }, ticket: { select: { folio: true, title: true, category: true } } } } } }),
    prisma.pago.findMany({ where: { orgId: user.orgId, tipoOperacion: TipoOperacionPago.CARGO, estado: EstadoPago.PAGADO, enPlataforma: true }, select: { monto: true, montoNeto: true } }),
    prisma.distribucionPago.findMany({ where: { orgId: user.orgId, origenManual: false, estado: { in: ESTADOS_COMPROMETIDOS } }, select: { monto: true, comisionEstimada: true } }),
  ])

  const pagosPagados = pagos.filter((pago) => pago.estado === EstadoPago.PAGADO)
  const egresosPagados = distribuciones.filter((distribucion) => distribucion.destino === TipoDestino.PROVEEDOR && distribucion.estado === EstadoPago.PAGADO)
  const ingresos = pagosPagados.reduce((total, pago) => total + Number(pago.monto), 0)
  const egresos = egresosPagados.reduce((total, distribucion) => total + Number(distribucion.monto), 0)
  const saldoDisponible = Math.max(0, cobrosEnPlataforma.reduce((total, cobro) => total + Number(cobro.montoNeto ?? cobro.monto), 0) - distribucionesComprometidas.reduce((total, distribucion) => total + Number(distribucion.monto) + Number(distribucion.comisionEstimada ?? 0), 0))
  const servicios: Record<string, string> = { PLOMERIA: 'Plomería', ELECTRICIDAD: 'Electricidad', HERRERIA: 'Herrería', JARDINERIA: 'Jardinería', LIMPIEZA: 'Limpieza', SEGURIDAD: 'Seguridad', INFRAESTRUCTURA: 'Infraestructura', OTRO: 'Otro' }

  const movimientos = [
    ...pagos.map((pago) => ({ id: `pago-${pago.id}`, tipo: 'Cobro a vecino', contraparte: pago.vecino ? `${pago.vecino.name}${pago.vecino.houseNumber ? ` · Casa ${pago.vecino.houseNumber}` : ''}` : 'Vecino no asignado', detalle: pago.cargo?.concepto ?? 'Cobro a vecino', monto: Number(pago.monto), estado: pago.estado, origenManual: false, fecha: pago.updatedAt })),
    ...distribuciones.map((distribucion) => {
      const esProveedor = distribucion.destino === TipoDestino.PROVEEDOR
      const comisionEstimada = Number(distribucion.comisionEstimada ?? 0)
      return { id: `distribucion-${distribucion.id}`, tipo: esProveedor ? 'Pago a proveedor' : 'Retiro a condominio', contraparte: esProveedor ? distribucion.workOrder?.provider.name ?? 'Proveedor no disponible' : 'Cuenta del condominio', detalle: distribucion.origenManual ? distribucion.notaManual ?? 'Pago externo registrado manualmente' : esProveedor ? distribucion.workOrder?.ticket ? `Orden · ${distribucion.workOrder.ticket.title} (#${distribucion.workOrder.ticket.folio})` : 'Pago a proveedor sin orden asociada' : 'Retiro de saldo a cuenta bancaria', monto: Number(distribucion.monto), montoRecibido: Number(distribucion.montoOriginal || distribucion.monto), comisionEstimada, montoDescontado: Number(distribucion.monto) + comisionEstimada, estado: distribucion.estado, origenManual: distribucion.origenManual, fecha: distribucion.updatedAt }
    }),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

  const etiquetaFecha = (fecha: Date) => fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  const buffer = await renderToBuffer(ReporteFinancieroDocument({
    nombreCondominio: user.org?.name ?? 'Condominio', rangoFechas: `${etiquetaFecha(inicio)} al ${etiquetaFecha(fin)}`,
    resumen: { ingresos, egresos, balanceNeto: ingresos - egresos, saldoDisponible },
    ingresosPorConcepto: agrupar(pagosPagados.map((pago) => ({ id: pago.cargo?.concepto ?? 'sin-concepto', etiqueta: pago.cargo?.concepto ?? 'Sin concepto asociado', monto: Number(pago.monto) }))),
    ingresosPorVecino: agrupar(pagosPagados.map((pago) => ({ id: pago.vecino?.id ?? 'sin-vecino', etiqueta: pago.vecino ? `${pago.vecino.name}${pago.vecino.houseNumber ? ` · Casa ${pago.vecino.houseNumber}` : ''}` : 'Vecino no asignado', monto: Number(pago.monto) }))),
    egresosPorProveedor: agrupar(egresosPagados.map((distribucion) => ({ id: distribucion.workOrder?.provider.id ?? 'sin-proveedor', etiqueta: distribucion.workOrder?.provider.name ?? 'Proveedor no disponible', monto: Number(distribucion.monto) }))),
    egresosPorServicio: agrupar(egresosPagados.map((distribucion) => { const categoria = distribucion.workOrder?.ticket.category; return { id: categoria ?? 'sin-categoria', etiqueta: categoria ? servicios[categoria] : 'Sin categoría de servicio', monto: Number(distribucion.monto) } })),
    movimientos,
  }))

  return new NextResponse(new Uint8Array(buffer), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reporte-financiero-${desdeParam}-${hastaParam}.pdf"` } })
}
