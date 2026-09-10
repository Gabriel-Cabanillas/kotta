import { prisma } from '@/lib/prisma'

export const BLOCKED_KOTTA_STATUSES = ['PENDING_ACTIVATION', 'SUSPENDED', 'CANCELED'] as const

export async function syncPastDueStatus(subscriptionId: string, now = new Date()) {
  const subscription = await prisma.kottaSubscription.findUnique({ where: { id: subscriptionId } })
  if (!subscription || !subscription.nextPaymentDueAt || subscription.status !== 'ACTIVE' || now <= subscription.nextPaymentDueAt) return subscription
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.kottaSubscription.updateMany({ where: { id: subscription.id, status: 'ACTIVE', nextPaymentDueAt: { lt: now } }, data: { status: 'PAST_DUE' } })
    if (claimed.count === 0) return tx.kottaSubscription.findUnique({ where: { id: subscription.id } })
    await tx.kottaSubscriptionEvent.create({ data: { subscriptionId, type: 'MARKED_PAST_DUE', previousStatus: 'ACTIVE', newStatus: 'PAST_DUE', reason: 'La fecha límite de pago transcurrió sin un pago registrado.' } })
    return tx.kottaSubscription.findUnique({ where: { id: subscription.id } })
  })
}

export function canTransition(from: string, to: string) {
  const allowed: Record<string, string[]> = {
    PENDING_ACTIVATION: ['ACTIVE'],
    ACTIVE: ['PAST_DUE', 'SUSPENDED', 'CANCELED'],
    PAST_DUE: ['ACTIVE', 'SUSPENDED', 'CANCELED'],
    SUSPENDED: ['ACTIVE', 'CANCELED'],
    CANCELED: [],
  }
  return allowed[from]?.includes(to) ?? false
}
