import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, CalendarDays, Users } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import CondominioCommercialPanel from '@/components/kotta-staff/CondominioCommercialPanel'
import SubscriptionStatusBadge from '@/components/kotta-staff/SubscriptionStatusBadge'
import StaffNotificationComposer from '@/components/notifications/StaffNotificationComposer'

export const dynamic = 'force-dynamic'

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})
const date = (value: Date | null) => value?.toLocaleDateString('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}) ?? '—'

export default async function CondominioDetailPage({ params }: { params: { organizationId: string } }) {
  const org = await prisma.organization.findUnique({
    where: { id: params.organizationId },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
        orderBy: { createdAt: 'asc' },
      },
      kottaSubscription: {
        include: {
          payments: {
            include: { recordedBy: { select: { name: true } } },
            orderBy: { paidAt: 'desc' },
          },
          events: {
            include: { actor: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })
  if (!org) notFound()

  const subscription = org.kottaSubscription
  const primaryAdmin = org.users.find((user) => user.role === 'ADMIN')
  const activeAdmins = org.users
    .filter((user) => user.role === 'ADMIN' && user.isActive)
    .map((user) => ({ id: user.id, name: user.name }))
  const serialized = subscription ? {
    id: subscription.id,
    status: subscription.status,
    housingUnits: subscription.housingUnits,
    billingMode: subscription.billingMode,
    isEnterprise: subscription.isEnterprise,
    baseMonthlyPrice: subscription.baseMonthlyPrice ? Number(subscription.baseMonthlyPrice) : null,
    discountRate: subscription.discountRate ? Number(subscription.discountRate) : null,
    contractedMonthlyPrice: subscription.contractedMonthlyPrice ? Number(subscription.contractedMonthlyPrice) : null,
    vatRate: subscription.vatRate ? Number(subscription.vatRate) : null,
    contractSignedAt: subscription.contractSignedAt?.toISOString() ?? null,
    serviceStartedAt: subscription.serviceStartedAt?.toISOString() ?? null,
    renewalAt: subscription.renewalAt?.toISOString() ?? null,
    nextInvoiceAt: subscription.nextInvoiceAt?.toISOString() ?? null,
    nextPaymentDueAt: subscription.nextPaymentDueAt?.toISOString() ?? null,
    lastPaymentAt: subscription.lastPaymentAt?.toISOString() ?? null,
    suspendedAt: subscription.suspendedAt?.toISOString() ?? null,
    paymentsCount: subscription.payments.length,
  } : null

  return (
    <main className="mx-auto max-w-6xl px-5 py-9 sm:px-8">
      <Link href="/kotta-staff/condominios" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600">
        <ArrowLeft className="h-4 w-4" />Condominios
      </Link>

      <header className="mt-6 flex flex-col gap-4 border-b border-neutral-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#FD5F56]">Ficha comercial</p>
          <h1 className="mt-2 font-display text-3xl text-[#0F1F34]">{org.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">/{org.slug}</p>
        </div>
        <SubscriptionStatusBadge status={subscription?.status ?? 'LEGACY'} />
      </header>

      <section className="my-7 grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-neutral-100 bg-white p-5">
          <Building2 className="h-5 w-5" />
          <p className="mt-4 text-xs text-neutral-400">Registro en Kotta</p>
          <p className="mt-1 text-sm font-medium">{date(org.createdAt)}</p>
        </article>
        <article className="rounded-2xl border border-neutral-100 bg-white p-5">
          <Users className="h-5 w-5" />
          <p className="mt-4 text-xs text-neutral-400">Administrador principal · {org.users.length} usuarios</p>
          <p className="mt-1 text-sm font-medium">{primaryAdmin ? `${primaryAdmin.name} · ${primaryAdmin.email}` : 'No localizado'}</p>
        </article>
        <article className="rounded-2xl border border-neutral-100 bg-white p-5">
          <CalendarDays className="h-5 w-5" />
          <p className="mt-4 text-xs text-neutral-400">Próximo vencimiento / renovación</p>
          <p className="mt-1 text-sm font-medium">{date(subscription?.nextPaymentDueAt ?? null)} · {date(subscription?.renewalAt ?? null)}</p>
        </article>
      </section>

      <StaffNotificationComposer organizationId={org.id} admins={activeAdmins} />
      <CondominioCommercialPanel organizationId={org.id} subscription={serialized} />

      {subscription && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-100 bg-white p-6">
            <h2 className="font-display text-xl text-[#0F1F34]">Historial de pagos</h2>
            <div className="mt-4 divide-y divide-neutral-100">
              {subscription.payments.map((payment) => (
                <article key={payment.id} className="py-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-900">Periodo {payment.period}</p>
                      <p className="mt-1 text-xs text-neutral-500">{date(payment.paidAt)} · {payment.recordedBy.name}{payment.bankReference ? ` · Ref. ${payment.bankReference}` : ''}</p>
                    </div>
                    <p className="font-medium">{money.format(Number(payment.amountReceived))}</p>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">Subtotal {money.format(Number(payment.subtotal))} · IVA {money.format(Number(payment.vatAmount))} · Mora {money.format(Number(payment.lateFee))}</p>
                </article>
              ))}
              {subscription.payments.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Aún no hay pagos registrados.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white p-6">
            <h2 className="font-display text-xl text-[#0F1F34]">Auditoría comercial</h2>
            <div className="mt-4 divide-y divide-neutral-100">
              {subscription.events.map((event) => (
                <article key={event.id} className="py-4">
                  <p className="text-sm font-medium text-neutral-900">{event.type.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-xs text-neutral-500">{date(event.createdAt)} · {event.actor?.name ?? 'Sistema'}</p>
                  {event.reason && <p className="mt-2 text-sm text-neutral-600">{event.reason}</p>}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
