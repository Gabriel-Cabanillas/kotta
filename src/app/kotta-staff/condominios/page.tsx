import { prisma } from '@/lib/prisma'
import CondominiosTable from '@/components/kotta-staff/CondominiosTable'
import { addCalendarDays } from '@/lib/kotta-subscriptions/dates'
import { syncPastDueStatus } from '@/lib/kotta-subscriptions/status'

export const dynamic = 'force-dynamic'

export default async function CondominiosPage() {
  const now = new Date(); const renewalWindow = addCalendarDays(now, 30)
  const overdue = await prisma.kottaSubscription.findMany({ where: { status: 'ACTIVE', nextPaymentDueAt: { lt: now } }, select: { id: true } })
  await Promise.all(overdue.map(({ id }) => syncPastDueStatus(id, now)))
  const organizations = await prisma.organization.findMany({ orderBy: { createdAt: 'desc' }, include: { kottaSubscription: true } })
  const subscriptions = organizations.map(o => o.kottaSubscription).filter(Boolean)
  const stats = [
    ['Condominios totales', organizations.length], ['Pendientes', subscriptions.filter(s => s?.status === 'PENDING_ACTIVATION').length], ['Activos', subscriptions.filter(s => s?.status === 'ACTIVE').length], ['Pago vencido', subscriptions.filter(s => s?.status === 'PAST_DUE').length], ['Suspendidos', subscriptions.filter(s => s?.status === 'SUSPENDED').length], ['Mensual', subscriptions.filter(s => s?.billingMode === 'MONTHLY').length], ['Anual', subscriptions.filter(s => s?.billingMode === 'ANNUAL').length], ['Renovación ≤ 30 días', subscriptions.filter(s => s?.renewalAt && s.renewalAt >= now && s.renewalAt <= renewalWindow).length],
  ]
  const rows = organizations.map(o => ({ id: o.id, name: o.name, slug: o.slug, createdAt: o.createdAt.toISOString(), housingUnits: o.kottaSubscription?.housingUnits ?? null, billingMode: o.kottaSubscription?.billingMode ?? null, contractedMonthlyPrice: o.kottaSubscription?.contractedMonthlyPrice ? Number(o.kottaSubscription.contractedMonthlyPrice) : null, status: o.kottaSubscription?.status ?? 'LEGACY', nextPaymentDueAt: o.kottaSubscription?.nextPaymentDueAt?.toISOString() ?? null, renewalAt: o.kottaSubscription?.renewalAt?.toISOString() ?? null }))
  return <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8"><header className="mb-7"><p className="text-xs font-medium uppercase tracking-[0.12em] text-[#FD5F56]">Administración comercial</p><h1 className="mt-2 font-display text-3xl tracking-tight text-[#0F1F34]">Condominios</h1><p className="mt-2 text-sm text-neutral-500">Contrataciones, pagos manuales y estado de servicio.</p></header><section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value]) => <article key={label} className="rounded-2xl border border-neutral-100 bg-white p-5"><p className="text-xs text-neutral-400">{label}</p><p className="mt-2 font-display text-2xl text-neutral-900">{value}</p></article>)}</section><CondominiosTable rows={rows} /></main>
}
