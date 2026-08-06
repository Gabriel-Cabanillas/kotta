/** Centro financiero de pagos para el administrador del condominio. */
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { EstadoPago, TipoCuentaConectada, TipoDestino, TipoOperacionPago } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { obtenerLiquidezPlataformaMx } from '@/lib/stripe/balance'
import PagosListSkeleton from '@/components/admin/PagosListSkeleton'
import PagosAdminTabs from '@/components/admin/PagosAdminTabs'
import type { MovimientoFinanciero } from '@/components/admin/MovimientosFinancieros'

const ESTADOS_COMPROMETIDOS: EstadoPago[] = [EstadoPago.PENDIENTE, EstadoPago.PROCESANDO, EstadoPago.PAGADO]

export default async function PagosPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-[#0F1F34] mb-1">Pagos</h1><p className="text-sm text-[#6B7A99]">Resumen financiero y gestión de cobros</p></div>
      <Suspense fallback={<PagosListSkeleton />}><PagosData orgId={user.orgId!} coto={params.coto} /></Suspense>
    </div>
  )
}

async function PagosData({ orgId, coto }: { orgId: string; coto: string }) {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioProximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
  const dentroDelMes = { gte: inicioMes, lt: inicioProximoMes }

  const [cargos, vecinos, pagos, distribuciones, proveedores, cuentaCondominio, totalPagos, totalDistribuciones, ingresosMes, egresosMes, cobrosEnPlataforma, distribucionesComprometidas] = await Promise.all([
    prisma.cargo.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, include: { destinatarios: { include: { vivienda: { select: { id: true, name: true, houseNumber: true } } } }, pagos: { where: { tipoOperacion: TipoOperacionPago.CARGO }, orderBy: { createdAt: 'desc' }, select: { id: true, vecinoId: true, monto: true, montoConRecargo: true, estado: true, createdAt: true, updatedAt: true } } } }),
    prisma.user.findMany({ where: { orgId, role: 'VECINO', isActive: true }, orderBy: { name: 'asc' } }),
    prisma.pago.findMany({ where: { orgId, tipoOperacion: TipoOperacionPago.CARGO }, orderBy: { updatedAt: 'desc' }, select: { id: true, monto: true, estado: true, enPlataforma: true, updatedAt: true, cargo: { select: { concepto: true } }, vecino: { select: { id: true, name: true, houseNumber: true } } } }),
    prisma.distribucionPago.findMany({ where: { orgId }, orderBy: { updatedAt: 'desc' }, select: { id: true, destino: true, monto: true, montoOriginal: true, comisionEstimada: true, estado: true, origenManual: true, notaManual: true, referencia: true, updatedAt: true, workOrder: { select: { provider: { select: { id: true, name: true } }, ticket: { select: { folio: true, title: true, category: true } } } } } }),
    prisma.user.findMany({ where: { orgId, role: 'PROVEEDOR' }, select: { id: true, name: true, cuentaConectada: { select: { chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true } } } }),
    prisma.cuentaConectada.findFirst({ where: { orgId, tipo: TipoCuentaConectada.CONDOMINIO }, select: { chargesEnabled: true, payoutsEnabled: true, detailsSubmitted: true } }),
    prisma.pago.count({ where: { orgId, tipoOperacion: TipoOperacionPago.CARGO } }),
    prisma.distribucionPago.count({ where: { orgId } }),
    prisma.pago.aggregate({ where: { orgId, tipoOperacion: TipoOperacionPago.CARGO, estado: EstadoPago.PAGADO, updatedAt: dentroDelMes }, _sum: { monto: true } }),
    prisma.distribucionPago.aggregate({ where: { orgId, destino: TipoDestino.PROVEEDOR, estado: EstadoPago.PAGADO, updatedAt: dentroDelMes }, _sum: { monto: true } }),
    prisma.pago.findMany({ where: { orgId, tipoOperacion: TipoOperacionPago.CARGO, estado: EstadoPago.PAGADO, enPlataforma: true }, select: { monto: true, montoNeto: true } }),
    prisma.distribucionPago.findMany({ where: { orgId, origenManual: false, estado: { in: ESTADOS_COMPROMETIDOS } }, select: { monto: true, comisionEstimada: true } }),
  ])

  const movimientos: MovimientoFinanciero[] = [
    ...pagos.map((pago) => ({ id: `pago-${pago.id}`, tipo: 'COBRO_VECINO' as const, monto: Number(pago.monto), estado: pago.estado, origenManual: false, fecha: pago.updatedAt.toISOString(), contraparte: pago.vecino ? `${pago.vecino.name}${pago.vecino.houseNumber ? ` · Casa ${pago.vecino.houseNumber}` : ''}` : 'Vecino no asignado', detalle: pago.cargo?.concepto ?? 'Cobro a vecino' })),
    ...distribuciones.map((distribucion) => {
      const esProveedor = distribucion.destino === TipoDestino.PROVEEDOR
      const montoRecibido = Number(distribucion.montoOriginal || distribucion.monto)
      const comisionEstimada = Number(distribucion.comisionEstimada ?? 0)
      return { id: `distribucion-${distribucion.id}`, tipo: esProveedor ? 'PAGO_PROVEEDOR' as const : 'RETIRO_CONDOMINIO' as const, monto: Number(distribucion.monto), montoRecibido, comisionEstimada, montoDescontado: Number(distribucion.monto) + comisionEstimada, estado: distribucion.estado, origenManual: distribucion.origenManual, fecha: distribucion.updatedAt.toISOString(), contraparte: esProveedor ? distribucion.workOrder?.provider.name ?? 'Proveedor no disponible' : 'Cuenta del condominio', detalle: distribucion.origenManual ? distribucion.notaManual ?? 'Pago externo registrado manualmente' : esProveedor ? distribucion.workOrder?.ticket ? `Orden · ${distribucion.workOrder.ticket.title} (#${distribucion.workOrder.ticket.folio})` : 'Pago a proveedor sin orden asociada' : 'Retiro de saldo a cuenta bancaria' }
    }),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 100)

  const esObligacionResuelta = (estado: EstadoPago | undefined) =>
    estado === EstadoPago.PAGADO ||
    estado === EstadoPago.REEMBOLSADO ||
    estado === EstadoPago.EN_DISPUTA ||
    estado === EstadoPago.DISPUTA_PERDIDA
  const cargosVencidos = cargos.filter((cargo) => cargo.fechaLimite < ahora && cargo.destinatarios.some(({ vivienda }) => !esObligacionResuelta(cargo.pagos.find((pago) => pago.vecinoId === vivienda.id)?.estado))).map((cargo) => ({ id: cargo.id, concepto: cargo.concepto, pendientes: cargo.destinatarios.filter(({ vivienda }) => !esObligacionResuelta(cargo.pagos.find((pago) => pago.vecinoId === vivienda.id)?.estado)).length }))
  const proveedoresPendientes = proveedores.filter((proveedor) => !proveedor.cuentaConectada?.payoutsEnabled).map(({ id, name }) => ({ id, name }))
  const transferenciasFallidas = distribuciones.filter((distribucion) => distribucion.estado === EstadoPago.FALLIDO).map((distribucion) => ({ id: distribucion.id, monto: Number(distribucion.monto), destino: distribucion.destino, contraparte: distribucion.destino === TipoDestino.PROVEEDOR ? distribucion.workOrder?.provider.name ?? 'Proveedor no disponible' : 'Cuenta del condominio', referencia: distribucion.referencia }))
  const ingresos = Number(ingresosMes._sum.monto ?? 0)
  const egresos = Number(egresosMes._sum.monto ?? 0)
  const saldoDisponible = Math.max(0, cobrosEnPlataforma.reduce((total, cobro) => total + Number(cobro.montoNeto ?? cobro.monto), 0) - distribucionesComprometidas.reduce((total, distribucion) => total + Number(distribucion.monto) + Number(distribucion.comisionEstimada ?? 0), 0))
  // La liquidez de Stripe es global; solo se serializa el mínimo seguro para este coto.
  const liquidezStripe = await obtenerLiquidezPlataformaMx().catch((error) => {
    console.error('No fue posible consultar la liquidez de Stripe para el resumen:', error)
    return null
  })
  const disponibleAhora = liquidezStripe ? Math.min(saldoDisponible, liquidezStripe.disponible) : null
  const enLiquidacion = disponibleAhora === null ? null : Math.max(0, saldoDisponible - disponibleAhora)
  const necesitaAtencion = (cuenta: { chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean } | null) => !(cuenta?.chargesEnabled && cuenta.payoutsEnabled && cuenta.detailsSubmitted)
  const proveedoresOrdenados = proveedores.map((proveedor) => ({ id: proveedor.id, name: proveedor.name, cuenta: proveedor.cuentaConectada })).sort((a, b) => Number(necesitaAtencion(b.cuenta)) - Number(necesitaAtencion(a.cuenta)) || a.name.localeCompare(b.name, 'es-MX'))

  const etiquetasServicio: Record<string, string> = { PLOMERIA: 'Plomería', ELECTRICIDAD: 'Electricidad', HERRERIA: 'Herrería', JARDINERIA: 'Jardinería', LIMPIEZA: 'Limpieza', SEGURIDAD: 'Seguridad', INFRAESTRUCTURA: 'Infraestructura', OTRO: 'Otro' }
  const agrupar = (filas: Array<{ id: string; etiqueta: string; monto: number }>) => Array.from(filas.reduce((grupos, fila) => { const actual = grupos.get(fila.id) ?? { id: fila.id, etiqueta: fila.etiqueta, monto: 0 }; actual.monto += fila.monto; grupos.set(fila.id, actual); return grupos }, new Map<string, { id: string; etiqueta: string; monto: number }>()).values()).sort((a, b) => b.monto - a.monto)
  const pagoMensual = (pago: typeof pagos[number]) => pago.estado === EstadoPago.PAGADO && pago.enPlataforma && pago.updatedAt >= inicioMes && pago.updatedAt < inicioProximoMes
  const distribucionMensual = (distribucion: typeof distribuciones[number]) => distribucion.destino === TipoDestino.PROVEEDOR && distribucion.estado === EstadoPago.PAGADO && distribucion.updatedAt >= inicioMes && distribucion.updatedAt < inicioProximoMes
  const ingresosPorConcepto = agrupar(pagos.filter(pagoMensual).map((pago) => ({ id: pago.cargo?.concepto ?? 'sin-concepto', etiqueta: pago.cargo?.concepto ?? 'Sin concepto asociado', monto: Number(pago.monto) })))
  const ingresosPorVecino = agrupar(pagos.filter(pagoMensual).map((pago) => ({ id: pago.vecino?.id ?? 'sin-vecino', etiqueta: pago.vecino ? `${pago.vecino.name}${pago.vecino.houseNumber ? ` · Casa ${pago.vecino.houseNumber}` : ''}` : 'Vecino no asignado', monto: Number(pago.monto) })))
  const egresosPorProveedor = agrupar(distribuciones.filter(distribucionMensual).map((distribucion) => ({ id: distribucion.workOrder?.provider.id ?? 'sin-proveedor', etiqueta: distribucion.workOrder?.provider.name ?? 'Proveedor no disponible', monto: Number(distribucion.monto) })))
  const egresosPorServicio = agrupar(distribuciones.filter(distribucionMensual).map((distribucion) => { const categoria = distribucion.workOrder?.ticket.category; return { id: categoria ?? 'sin-categoria', etiqueta: categoria ? etiquetasServicio[categoria] : 'Sin categoría de servicio', monto: Number(distribucion.monto) } }))
  const periodos = Array.from({ length: 6 }, (_, indice) => { const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - indice), 1); const fin = new Date(ahora.getFullYear(), ahora.getMonth() - (4 - indice), 1); const ingresosPeriodo = pagos.filter((pago) => pago.estado === EstadoPago.PAGADO && pago.enPlataforma && pago.updatedAt >= inicio && pago.updatedAt < fin).reduce((total, pago) => total + Number(pago.monto), 0); const egresosPeriodo = distribuciones.filter((distribucion) => distribucion.destino === TipoDestino.PROVEEDOR && distribucion.estado === EstadoPago.PAGADO && distribucion.updatedAt >= inicio && distribucion.updatedAt < fin).reduce((total, distribucion) => total + Number(distribucion.monto), 0); return { id: inicio.toISOString(), etiqueta: inicio.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }), ingresos: ingresosPeriodo, egresos: egresosPeriodo } })
  const distribucionCargos = cargos.filter((cargo) => cargo.createdAt >= inicioMes && cargo.createdAt < inicioProximoMes).reduce((totales, cargo) => { cargo.destinatarios.forEach(({ vivienda }) => { const estado = cargo.pagos.find((pago) => pago.vecinoId === vivienda.id)?.estado; if (estado === EstadoPago.PAGADO) totales.PAGADO += 1; else if (estado === EstadoPago.REEMBOLSADO) totales.REEMBOLSADO += 1; else if (estado === EstadoPago.EN_DISPUTA) totales.EN_DISPUTA += 1; else if (estado === EstadoPago.DISPUTA_PERDIDA) totales.DISPUTA_PERDIDA += 1; else if (cargo.fechaLimite < ahora) totales.VENCIDO += 1; else totales.PENDIENTE += 1 }); return totales }, { PAGADO: 0, PENDIENTE: 0, VENCIDO: 0, REEMBOLSADO: 0, EN_DISPUTA: 0, DISPUTA_PERDIDA: 0 })

  return <PagosAdminTabs resumen={{ ingresos, egresos, balanceNeto: ingresos - egresos, saldoDisponible, disponibleAhora, enLiquidacion }} desgloses={{ ingresosPorConcepto, ingresosPorVecino, egresosPorProveedor, egresosPorServicio, periodos }} graficas={{ periodos, distribucionCargos: [{ nombre: 'Pagados', valor: distribucionCargos.PAGADO, color: '#2BC842' }, { nombre: 'Reembolsados', valor: distribucionCargos.REEMBOLSADO, color: '#737373' }, { nombre: 'En disputa', valor: distribucionCargos.EN_DISPUTA, color: '#F97316' }, { nombre: 'Disputa perdida', valor: distribucionCargos.DISPUTA_PERDIDA, color: '#FD5F56' }, { nombre: 'Pendientes', valor: distribucionCargos.PENDIENTE, color: '#FFBA2E' }, { nombre: 'Vencidos', valor: distribucionCargos.VENCIDO, color: '#FD5F56' }] }} cuentasConectadas={{ condominio: cuentaCondominio, proveedores: proveedoresOrdenados }} movimientos={movimientos} totalMovimientos={totalPagos + totalDistribuciones} cargos={cargos as any} vecinos={vecinos as any} alertas={{ cargosVencidos, proveedoresPendientes, transferenciasFallidas }} rutas={{ usuarios: `/${coto}/admin/usuarios`, ordenes: `/${coto}/admin/ordenes`, configuracion: `/${coto}/admin/configuracion` }} />
}
