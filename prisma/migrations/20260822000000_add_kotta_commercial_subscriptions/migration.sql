CREATE TYPE "KottaSubscriptionStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED');
CREATE TYPE "KottaBillingMode" AS ENUM ('MONTHLY', 'ANNUAL');
CREATE TYPE "KottaSubscriptionEventType" AS ENUM ('SUBSCRIPTION_CREATED', 'COMMERCIAL_CONFIGURED', 'PRICE_UPDATED', 'ACTIVATED', 'MARKED_PAST_DUE', 'PAYMENT_RECORDED', 'SUSPENDED', 'REACTIVATED', 'RENEWED', 'CANCELED');

CREATE TABLE "kotta_subscriptions" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" "KottaSubscriptionStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
  "housingUnits" INTEGER,
  "billingMode" "KottaBillingMode",
  "isEnterprise" BOOLEAN NOT NULL DEFAULT false,
  "baseMonthlyPrice" DECIMAL(12,2),
  "discountRate" DECIMAL(5,4),
  "contractedMonthlyPrice" DECIMAL(12,2),
  "vatRate" DECIMAL(5,4),
  "pricingPolicyVersion" TEXT NOT NULL DEFAULT '2026-01',
  "contractSignedAt" TIMESTAMP(3),
  "serviceStartedAt" TIMESTAMP(3),
  "renewalAt" TIMESTAMP(3),
  "nextInvoiceAt" TIMESTAMP(3),
  "nextPaymentDueAt" TIMESTAMP(3),
  "lastPaymentAt" TIMESTAMP(3),
  "suspendedAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "kotta_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kotta_subscription_payments" (
  "id" TEXT NOT NULL, "subscriptionId" TEXT NOT NULL, "period" TEXT NOT NULL,
  "subtotal" DECIMAL(12,2) NOT NULL, "vatAmount" DECIMAL(12,2) NOT NULL,
  "lateFee" DECIMAL(12,2) NOT NULL DEFAULT 0, "totalExpected" DECIMAL(12,2) NOT NULL,
  "amountReceived" DECIMAL(12,2) NOT NULL, "paidAt" TIMESTAMP(3) NOT NULL,
  "bankReference" TEXT, "notes" TEXT, "recordedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kotta_subscription_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kotta_subscription_events" (
  "id" TEXT NOT NULL, "subscriptionId" TEXT NOT NULL, "type" "KottaSubscriptionEventType" NOT NULL,
  "actorId" TEXT, "previousStatus" "KottaSubscriptionStatus", "newStatus" "KottaSubscriptionStatus",
  "reason" TEXT, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kotta_subscription_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "kotta_subscriptions_organizationId_key" ON "kotta_subscriptions"("organizationId");
CREATE INDEX "kotta_subscriptions_status_idx" ON "kotta_subscriptions"("status");
CREATE INDEX "kotta_subscriptions_billingMode_idx" ON "kotta_subscriptions"("billingMode");
CREATE INDEX "kotta_subscriptions_nextPaymentDueAt_idx" ON "kotta_subscriptions"("nextPaymentDueAt");
CREATE INDEX "kotta_subscriptions_renewalAt_idx" ON "kotta_subscriptions"("renewalAt");
CREATE UNIQUE INDEX "kotta_subscription_payments_subscriptionId_period_key" ON "kotta_subscription_payments"("subscriptionId", "period");
CREATE INDEX "kotta_subscription_payments_paidAt_idx" ON "kotta_subscription_payments"("paidAt");
CREATE INDEX "kotta_subscription_events_subscriptionId_createdAt_idx" ON "kotta_subscription_events"("subscriptionId", "createdAt");
CREATE INDEX "kotta_subscription_events_type_createdAt_idx" ON "kotta_subscription_events"("type", "createdAt");
ALTER TABLE "kotta_subscriptions" ADD CONSTRAINT "kotta_subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "kotta_subscription_payments" ADD CONSTRAINT "kotta_subscription_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "kotta_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "kotta_subscription_payments" ADD CONSTRAINT "kotta_subscription_payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "kotta_subscription_events" ADD CONSTRAINT "kotta_subscription_events_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "kotta_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "kotta_subscription_events" ADD CONSTRAINT "kotta_subscription_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

