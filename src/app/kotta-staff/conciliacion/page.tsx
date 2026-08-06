/** Conciliación global e interna de las comisiones mensuales de Stripe Connect. */
import { EstadoPago, Role, TipoDestino } from '@prisma/client'
import { redirect } from 'next/navigation'
import { ReceiptText, Scale, WalletCards } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ConciliacionesPayoutList from '@/components/kotta-staff/ConciliacionesPayoutList'
import KottaStaffLogout from '@/components/kotta-staff/KottaStaffLogout'

type FilaPeriodo = { periodo: string; totalEstimadoCobrado: number; totalRealFacturado: number | null; diferencia: number | null; estado: string }
const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

function periodoDe(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

export default async function ConciliacionPayoutPage() {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== Role.KOTTA_STAFF) redirect('/dashboard')

  // Información cross-org intencional, protegida exclusivamente por KOTTA_STAFF.
  const [distribuciones, conciliacionesGuardadas] = await Promise.all([
    prisma.distribucionPago.findMany({
      where: { destino: TipoDestino.PROVEEDOR, origenManual: false, estado: EstadoPago.PAGADO, comisionEstimada: { not: null } },
      select: { updatedAt: true, comisionEstimada: true },
    }),
    prisma.conciliacionPayoutMensual.findMany({ orderBy: { periodo: 'desc' } }),
  ])

  const estimados = distribuciones.reduce((periodos, distribucion) => {
    const periodo = periodoDe(distribucion.updatedAt)
    periodos.set(periodo, (periodos.get(periodo) ?? 0) + Number(distribucion.comisionEstimada ?? 0))
    return periodos
  }, new Map<string, number>())
  const guardadas = new Map(conciliacionesGuardadas.map((conciliacion) => [conciliacion.periodo, conciliacion]))
  const periodos = Array.from(new Set(Array.from(estimados.keys()).concat(Array.from(guardadas.keys())))).sort().reverse()
  const filas: FilaPeriodo[] = periodos.map((periodo) => {
    const guardada = guardadas.get(periodo)
    const totalEstimadoCobrado = estimados.get(periodo) ?? Number(guardada?.totalEstimadoCobrado ?? 0)
    const totalRealFacturado = guardada?.totalRealFacturado === null || !guardada ? null : Number(guardada.totalRealFacturado)
    return { periodo, totalEstimadoCobrado, totalRealFacturado, diferencia: totalRealFacturado === null ? null : totalRealFacturado - totalEstimadoCobrado, estado: guardada?.estado ?? 'PENDIENTE' }
  })
  const totalEstimado = filas.reduce((total, fila) => total + fila.totalEstimadoCobrado, 0)
  const totalPendiente = filas.filter((fila) => fila.estado !== 'CONCILIADO').length

  return <main className="min-h-screen bg-[#F7F8FA]"><div className="mx-auto max-w-6xl px-5 py-10 sm:px-8"><header className="mb-8 flex flex-col gap-4 border-b border-neutral-200 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium tracking-[0.12em] text-[#FD5F56]">KOTTA · INTERNO</p><h1 className="mt-2 font-display text-3xl tracking-tight text-neutral-900">Conciliación de payouts</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Control mensual de la estimación cobrada frente a las comisiones reales de Stripe Connect.</p></div><div className="flex items-center gap-3"><Link href="/kotta-staff/disputas" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Disputas</Link><p className="text-sm text-neutral-500">{user.name}</p><KottaStaffLogout /></div></header><section className="mb-7 grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-neutral-100 bg-white p-5"><WalletCards className="mb-4 h-5 w-5 text-neutral-900" /><p className="text-xs text-neutral-400">Estimado acumulado</p><p className="mt-1 font-display text-2xl text-neutral-900">{moneda.format(totalEstimado)}</p></article><article className="rounded-2xl border border-neutral-100 bg-white p-5"><ReceiptText className="mb-4 h-5 w-5 text-[#FD5F56]" /><p className="text-xs text-neutral-400">Períodos pendientes</p><p className="mt-1 font-display text-2xl text-neutral-900">{totalPendiente}</p></article></section><div className="mb-4 flex items-center gap-2"><Scale className="h-4 w-4 text-neutral-500" /><p className="text-xs text-neutral-500">Una diferencia positiva indica que faltó estimar; una negativa, que sobró colchón.</p></div><ConciliacionesPayoutList conciliaciones={filas} /></div></main>
}
