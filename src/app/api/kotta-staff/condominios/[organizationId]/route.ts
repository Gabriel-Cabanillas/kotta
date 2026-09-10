import { KottaBillingMode, Prisma } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { annualRenewalDate, nextInvoiceDate, parseCalendarDate, paymentDueDate, periodFromDate, suspensionEligibleDate, addCalendarMonths } from '@/lib/kotta-subscriptions/dates'
import { calculateAnnualCancellationFeeCents, calculateKottaPricing, calculateLateFeeCents, centsToDecimalString, decimalToCents, KOTTA_PRICING_POLICY_VERSION, KOTTA_VAT_BASIS_POINTS } from '@/lib/kotta-subscriptions/pricing'
import { canTransition } from '@/lib/kotta-subscriptions/status'

const jsonError = (message: string, status = 400) => Response.json({ error: message }, { status })
const metadata = (value: Record<string, unknown>) => value as Prisma.InputJsonValue

export async function POST(req: Request, { params }: { params: { organizationId: string } }) {
  const actor = await getSession()
  if (!actor || actor.role !== 'KOTTA_STAFF') return jsonError('No autorizado.', 403)
  const organization = await prisma.organization.findUnique({ where: { id: params.organizationId }, select: { id: true } })
  if (!organization) return jsonError('Condominio no encontrado.', 404)

  try {
    const body = await req.json() as Record<string, unknown>
    const action = body.action
    if (action === 'configure') return Response.json(await configure(params.organizationId, actor.id, body))
    if (action === 'record_payment') return Response.json(await recordPayment(params.organizationId, actor.id, body))
    if (action === 'activate') return Response.json(await activate(params.organizationId, actor.id))
    if (action === 'suspend') return Response.json(await suspend(params.organizationId, actor.id, body))
    if (action === 'reactivate') return Response.json(await reactivate(params.organizationId, actor.id, body))
    if (action === 'cancel') return Response.json(await cancel(params.organizationId, actor.id, body))
    if (action === 'renew') return Response.json(await renew(params.organizationId, actor.id, body))
    return jsonError('Acción no válida.')
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return jsonError('Ya existe un pago para ese periodo.', 409)
    return jsonError(error instanceof Error ? error.message : 'No fue posible completar la operación.')
  }
}

async function configure(organizationId: string, actorId: string, body: Record<string, unknown>) {
  const housingUnits = Number(body.housingUnits)
  const billingMode: KottaBillingMode | null = body.billingMode === 'ANNUAL' ? KottaBillingMode.ANNUAL : body.billingMode === 'MONTHLY' ? KottaBillingMode.MONTHLY : null
  if (!billingMode) throw new Error('Selecciona una modalidad válida.')
  const enterpriseCents = body.enterpriseMonthlyPrice ? decimalToCents(String(body.enterpriseMonthlyPrice)) : null
  const quote = calculateKottaPricing(housingUnits, billingMode, enterpriseCents)
  if (quote.isEnterprise && !quote.baseMonthlyCents) throw new Error('El precio Enterprise acordado es obligatorio.')
  const contractSignedAt = parseCalendarDate(body.contractSignedAt, 'La fecha de firma')
  const serviceStartedAt = parseCalendarDate(body.serviceStartedAt, 'La fecha de inicio')
  const existing = await prisma.kottaSubscription.findUnique({ where: { organizationId } })
  if (existing?.status === 'CANCELED') throw new Error('Una suscripción cancelada no puede reconfigurarse sin recontratación.')
  const data = {
    housingUnits, billingMode, isEnterprise: quote.isEnterprise,
    baseMonthlyPrice: centsToDecimalString(quote.baseMonthlyCents!),
    discountRate: (quote.discountBasisPoints / 10_000).toFixed(4),
    contractedMonthlyPrice: centsToDecimalString(quote.contractedMonthlyCents!),
    vatRate: (KOTTA_VAT_BASIS_POINTS / 10_000).toFixed(4), pricingPolicyVersion: KOTTA_PRICING_POLICY_VERSION,
    contractSignedAt, serviceStartedAt,
    renewalAt: billingMode === 'ANNUAL' ? annualRenewalDate(serviceStartedAt) : null,
  }
  return prisma.$transaction(async (tx) => {
    const subscription = existing
      ? await tx.kottaSubscription.update({ where: { id: existing.id }, data })
      : await tx.kottaSubscription.create({ data: { organizationId, status: 'PENDING_ACTIVATION', ...data } })
    await tx.kottaSubscriptionEvent.create({ data: { subscriptionId: subscription.id, actorId, type: existing ? 'PRICE_UPDATED' : 'SUBSCRIPTION_CREATED', previousStatus: existing?.status, newStatus: subscription.status, reason: String(body.reason ?? 'Configuración comercial confirmada por KOTTA_STAFF.'), metadata: metadata({ previous: existing ? { housingUnits: existing.housingUnits, baseMonthlyPrice: existing.baseMonthlyPrice?.toString(), contractedMonthlyPrice: existing.contractedMonthlyPrice?.toString() } : null, current: quote }) } })
    if (existing) await tx.kottaSubscriptionEvent.create({ data: { subscriptionId: subscription.id, actorId, type: 'COMMERCIAL_CONFIGURED', newStatus: subscription.status, reason: 'Datos comerciales y fechas contractuales guardados.' } })
    return subscription
  })
}

async function recordPayment(organizationId: string, actorId: string, body: Record<string, unknown>) {
  const subscription = await prisma.kottaSubscription.findUnique({ where: { organizationId } })
  if (!subscription?.contractedMonthlyPrice || !subscription.vatRate || !subscription.serviceStartedAt) throw new Error('Primero completa la configuración comercial.')
  const invoiceDate = subscription.nextInvoiceAt ?? subscription.serviceStartedAt
  const dueAt = subscription.nextPaymentDueAt ?? paymentDueDate(invoiceDate)
  const subtotalCents = decimalToCents(subscription.contractedMonthlyPrice.toString())
  const vatCents = Math.round(subtotalCents * Number(subscription.vatRate))
  const paidAt = parseCalendarDate(body.paidAt, 'La fecha de pago')
  const lateFeeCents = paidAt > dueAt ? calculateLateFeeCents(subtotalCents) : 0
  const amountReceivedCents = decimalToCents(String(body.amountReceived))
  const totalExpectedCents = subtotalCents + vatCents + lateFeeCents
  if (amountReceivedCents < totalExpectedCents) throw new Error(`El importe recibido debe cubrir al menos ${centsToDecimalString(totalExpectedCents)} MXN.`)
  const period = typeof body.period === 'string' && /^\d{4}-\d{2}$/.test(body.period) ? body.period : periodFromDate(invoiceDate)
  return prisma.$transaction(async (tx) => {
    const payment = await tx.kottaSubscriptionPayment.create({ data: { subscriptionId: subscription.id, period, subtotal: centsToDecimalString(subtotalCents), vatAmount: centsToDecimalString(vatCents), lateFee: centsToDecimalString(lateFeeCents), totalExpected: centsToDecimalString(totalExpectedCents), amountReceived: centsToDecimalString(amountReceivedCents), paidAt, bankReference: typeof body.bankReference === 'string' ? body.bankReference.trim() || null : null, notes: typeof body.notes === 'string' ? body.notes.trim() || null : null, recordedById: actorId } })
    const data: Prisma.KottaSubscriptionUpdateInput = { lastPaymentAt: paidAt }
    if (subscription.status !== 'PENDING_ACTIVATION') {
      const next = addCalendarMonths(invoiceDate, 1)
      data.nextInvoiceAt = next
      data.nextPaymentDueAt = paymentDueDate(next)
      if (subscription.status === 'PAST_DUE') data.status = 'ACTIVE'
    }
    await tx.kottaSubscription.update({ where: { id: subscription.id }, data })
    await tx.kottaSubscriptionEvent.create({ data: { subscriptionId: subscription.id, actorId, type: 'PAYMENT_RECORDED', previousStatus: subscription.status, newStatus: subscription.status === 'PAST_DUE' ? 'ACTIVE' : subscription.status, reason: typeof body.notes === 'string' ? body.notes : null, metadata: metadata({ paymentId: payment.id, period, amountReceivedCents, lateFeeCents }) } })
    return payment
  })
}

async function activate(organizationId: string, actorId: string) {
  const subscription = await prisma.kottaSubscription.findUnique({ where: { organizationId }, include: { _count: { select: { payments: true } } } })
  if (!subscription || subscription.status !== 'PENDING_ACTIVATION') throw new Error('Solo una suscripción pendiente puede activarse.')
  if (!subscription.housingUnits || !subscription.billingMode || !subscription.baseMonthlyPrice || !subscription.contractedMonthlyPrice || !subscription.contractSignedAt || !subscription.serviceStartedAt || subscription._count.payments < 1) throw new Error('Completa contrato, viviendas, modalidad, precio, fecha de inicio y primer pago antes de activar.')
  const serviceStartedAt = subscription.serviceStartedAt
  const nextInvoiceAt = nextInvoiceDate(serviceStartedAt)
  return prisma.$transaction(async (tx) => {
    const updated = await tx.kottaSubscription.update({ where: { id: subscription.id }, data: { status: 'ACTIVE', nextInvoiceAt, nextPaymentDueAt: paymentDueDate(nextInvoiceAt), renewalAt: subscription.billingMode === 'ANNUAL' ? annualRenewalDate(serviceStartedAt) : null } })
    await tx.kottaSubscriptionEvent.create({ data: { subscriptionId: subscription.id, actorId, type: 'ACTIVATED', previousStatus: 'PENDING_ACTIVATION', newStatus: 'ACTIVE', reason: 'Checklist comercial completo y pago inicial registrado.' } })
    return updated
  })
}

async function suspend(organizationId: string, actorId: string, body: Record<string, unknown>) {
  const reason = String(body.reason ?? '').trim(); if (!reason) throw new Error('El motivo de suspensión es obligatorio.')
  const subscription = await prisma.kottaSubscription.findUnique({ where: { organizationId } }); if (!subscription || !canTransition(subscription.status, 'SUSPENDED')) throw new Error('La suscripción no puede suspenderse desde su estado actual.')
  if (body.forNonPayment === true && (!subscription.nextPaymentDueAt || new Date() < suspensionEligibleDate(subscription.nextPaymentDueAt))) throw new Error('Aún no han transcurrido 15 días naturales después del vencimiento.')
  return transition(subscription.id, actorId, subscription.status, 'SUSPENDED', 'SUSPENDED', reason, { suspendedAt: new Date() })
}

async function reactivate(organizationId: string, actorId: string, body: Record<string, unknown>) {
  const subscription = await prisma.kottaSubscription.findUnique({ where: { organizationId } }); if (!subscription || !canTransition(subscription.status, 'ACTIVE')) throw new Error('La suscripción no puede reactivarse.')
  return transition(subscription.id, actorId, subscription.status, 'ACTIVE', 'REACTIVATED', String(body.reason ?? '').trim() || 'Reactivación autorizada por KOTTA_STAFF.', { suspendedAt: null })
}

async function cancel(organizationId: string, actorId: string, body: Record<string, unknown>) {
  const reason = String(body.reason ?? '').trim(); if (!reason) throw new Error('El motivo de cancelación es obligatorio.')
  const subscription = await prisma.kottaSubscription.findUnique({ where: { organizationId } }); if (!subscription || !canTransition(subscription.status, 'CANCELED')) throw new Error('La suscripción no puede cancelarse.')
  const fee = subscription.billingMode === 'ANNUAL' && subscription.renewalAt && subscription.contractedMonthlyPrice && new Date() < subscription.renewalAt ? calculateAnnualCancellationFeeCents(decimalToCents(subscription.contractedMonthlyPrice.toString()), Math.max(1, Math.ceil((subscription.renewalAt.getTime() - Date.now()) / (30.4375 * 86400000)))) : 0
  return transition(subscription.id, actorId, subscription.status, 'CANCELED', 'CANCELED', reason, { canceledAt: new Date() }, { cancellationFeeCents: fee })
}

async function renew(organizationId: string, actorId: string, body: Record<string, unknown>) {
  const subscription = await prisma.kottaSubscription.findUnique({ where: { organizationId } }); if (!subscription || subscription.billingMode !== 'ANNUAL' || !subscription.renewalAt || subscription.status === 'CANCELED') throw new Error('Solo contratos anuales vigentes pueden renovarse.')
  const previousRenewalAt = subscription.renewalAt
  const renewalAt = addCalendarMonths(previousRenewalAt, 12)
  return prisma.$transaction(async (tx) => { const updated = await tx.kottaSubscription.update({ where: { id: subscription.id }, data: { renewalAt } }); await tx.kottaSubscriptionEvent.create({ data: { subscriptionId: subscription.id, actorId, type: 'RENEWED', previousStatus: subscription.status, newStatus: subscription.status, reason: String(body.reason ?? '').trim() || 'Renovación anual confirmada.', metadata: metadata({ previousRenewalAt: previousRenewalAt.toISOString(), renewalAt: renewalAt.toISOString() }) } }); return updated })
}

async function transition(id: string, actorId: string, previousStatus: 'PENDING_ACTIVATION' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED', newStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELED', type: 'REACTIVATED' | 'SUSPENDED' | 'CANCELED', reason: string, data: Prisma.KottaSubscriptionUpdateInput, extra: Record<string, unknown> = {}) {
  return prisma.$transaction(async (tx) => { const updated = await tx.kottaSubscription.update({ where: { id }, data: { ...data, status: newStatus } }); await tx.kottaSubscriptionEvent.create({ data: { subscriptionId: id, actorId, type, previousStatus, newStatus, reason, metadata: metadata(extra) } }); return updated })
}
