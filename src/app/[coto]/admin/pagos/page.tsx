/** Centro financiero de pagos para el administrador del condominio. */
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PagosListSkeleton from '@/components/admin/PagosListSkeleton'
import PagosAdminTabs from '@/components/admin/PagosAdminTabs'
import type { MovimientoFinanciero } from '@/components/admin/MovimientosFinancieros'

const ESTADOS_COMPROMETIDOS: Array<'PENDIENTE' | 'PROCESANDO' | 'PAGADO'> = ['PENDIENTE', 'PROCESANDO', 'PAGADO']

export default async function PagosPage({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return <div><div className="mb-6"><h1 className="font-display text-2xl text-[#0F1F34] mb-1">Pagos</h1><p className="text-sm text-[#6B7A99]">Resumen financiero y gestión de cobros</p></div><Suspense fallback={<PagosListSkeleton />}><PagosData orgId={user.orgId!} coto={params.coto} /></Suspense></div>
}

async function PagosData({ orgId, coto }: { orgId: string; coto: string }) {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioProximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
  const dentroDelMes = { gte: inicioMes, lt: inicioProximoMes }

  const [cargos, vecinos, pagos, distribuciones, proveedores, totalPagos, totalDistribuciones, ingresosMes, egresosMes, cobrosEnPlataforma, distribucionesComprometidas] = await Promise.all([
    prisma.cargo.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, include: { destinatarios: { include: { vivienda: { select: { id: true, name: true, houseNumber: true } } } }, pagos: { where: { tipoOperacion: 'CARGO' }, orderBy: { createdAt: 'desc' }, select: { vecinoId: true, estado: true, createdAt: true, updatedAt: true } } } }),
    prisma.user.findMany({ where: { orgId, role: 'VECINO', isActive: true }, orderBy: { name: 'asc' } }),
    prisma.pago.findMany({ where: { orgId, tipoOperacion: 'CARGO' }, orderBy: { updatedAt: 'desc' }, select: { id: true, monto: true, estado: true, updatedAt: true, cargo: { select: { concepto: true } }, vecino: { select: { name: true, houseNumber: true } } } }),
    prisma.distribucionPago.findMany({ where: { orgId }, orderBy: { updatedAt: 'desc' }, select: { id: true, destino: true, monto: true, estado: true, referencia: true, updatedAt: true, workOrder: { select: { provider: { select: { name: true } }, ticket: { select: { folio: true, title: true } } } } } }),
    prisma.user.findMany({ where: { orgId, role: 'PROVEEDOR' }, select: { id: true, name: true, cuentaConectada: { select: { payoutsEnabled: true } } } }),
    prisma.pago.count({ where: { orgId, tipoOperacion: 'CARGO' } }),
    prisma.distribucionPago.count({ where: { orgId } }),
    prisma.pago.aggregate({ where: { orgId, tipoOperacion: 'CARGO', estado: 'PAGADO', updatedAt: dentroDelMes }, _sum: { monto: true } }),
    prisma.distribucionPago.aggregate({ where: { orgId, destino: 'PROVEEDOR', estado: 'PAGADO', updatedAt: dentroDelMes }, _sum: { monto: true } }),
    prisma.pago.aggregate({ where: { orgId, tipoOperacion: 'CARGO', estado: 'PAGADO', enPlataforma: true }, _sum: { monto: true } }),
    prisma.distribucionPago.aggregate({ where: { orgId, estado: { in: ESTADOS_COMPROMETIDOS } }, _sum: { monto: true } }),
  ])

  const movimientos: MovimientoFinanciero[] = [
    ...pagos.map((pago) => ({ id: `pago-${pago.id}`, tipo: 'COBRO_VECINO' as const, monto: Number(pago.monto), estado: pago.estado, fecha: pago.updatedAt.toISOString(), contraparte: pago.vecino ? `${pago.vecino.name}${pago.vecino.houseNumber ? ` · Casa ${pago.vecino.houseNumber}` : ''}` : 'Vecino no asignado', detalle: pago.cargo?.concepto ?? 'Cobro a vecino' })),
    ...distribuciones.map((distribucion) => { const esProveedor = distribucion.destino === 'PROVEEDOR'; return { id: `distribucion-${distribucion.id}`, tipo: esProveedor ? 'PAGO_PROVEEDOR' as const : 'RETIRO_CONDOMINIO' as const, monto: Number(distribucion.monto), estado: distribucion.estado, fecha: distribucion.updatedAt.toISOString(), contraparte: esProveedor ? distribucion.workOrder?.provider.name ?? 'Proveedor no disponible' : 'Cuenta del condominio', detalle: esProveedor ? distribucion.workOrder?.ticket ? `Orden · ${distribucion.workOrder.ticket.title} (#${distribucion.workOrder.ticket.folio})` : 'Pago a proveedor sin orden asociada' : 'Retiro de saldo a cuenta bancaria' } }),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 100)

  const cargosVencidos = cargos.filter((cargo) => {
    if (cargo.fechaLimite >= ahora) return false
    return cargo.destinatarios.some(({ vivienda }) => cargo.pagos.find((pago) => pago.vecinoId === vivienda.id)?.estado !== 'PAGADO')
  }).map((cargo) => ({ id: cargo.id, concepto: cargo.concepto, pendientes: cargo.destinatarios.filter(({ vivienda }) => cargo.pagos.find((pago) => pago.vecinoId === vivienda.id)?.estado !== 'PAGADO').length }))
  const proveedoresPendientes = proveedores.filter((proveedor) => !proveedor.cuentaConectada?.payoutsEnabled).map(({ id, name }) => ({ id, name }))
  const transferenciasFallidas = distribuciones.filter((distribucion) => distribucion.estado === 'FALLIDO').map((distribucion) => ({ id: distribucion.id, monto: Number(distribucion.monto), destino: distribucion.destino, contraparte: distribucion.destino === 'PROVEEDOR' ? distribucion.workOrder?.provider.name ?? 'Proveedor no disponible' : 'Cuenta del condominio', referencia: distribucion.referencia }))
  const ingresos = Number(ingresosMes._sum.monto ?? 0)
  const egresos = Number(egresosMes._sum.monto ?? 0)
  const saldoDisponible = Math.max(0, Number(cobrosEnPlataforma._sum.monto ?? 0) - Number(distribucionesComprometidas._sum.monto ?? 0))

  return <PagosAdminTabs resumen={{ ingresos, egresos, balanceNeto: ingresos - egresos, saldoDisponible }} movimientos={movimientos} totalMovimientos={totalPagos + totalDistribuciones} cargos={cargos as any} vecinos={vecinos as any} alertas={{ cargosVencidos, proveedoresPendientes, transferenciasFallidas }} rutas={{ usuarios: `/${coto}/admin/usuarios`, ordenes: `/${coto}/admin/ordenes`, configuracion: `/${coto}/admin/configuracion` }} />
}
