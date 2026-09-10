import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncPastDueStatus } from '@/lib/kotta-subscriptions/status'
import TenantCommercialBlock from '@/components/subscriptions/TenantCommercialBlock'

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.org?.slug !== params.coto) redirect('/dashboard')
  if (!user.orgId) redirect('/dashboard')

  let subscription = await prisma.kottaSubscription.findUnique({ where: { organizationId: user.orgId } })
  if (subscription?.status === 'ACTIVE') subscription = await syncPastDueStatus(subscription.id)
  if (subscription && ['PENDING_ACTIVATION', 'SUSPENDED', 'CANCELED'].includes(subscription.status)) {
    return <TenantCommercialBlock status={subscription.status as 'PENDING_ACTIVATION' | 'SUSPENDED' | 'CANCELED'} organizationName={user.org?.name ?? 'Condominio'} />
  }
  return children
}

