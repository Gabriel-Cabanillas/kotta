-- Evolve the existing in-app notifications table without removing legacy data.
CREATE TYPE "NotificationOrigin" AS ENUM ('MANUAL', 'SYSTEM');
CREATE TYPE "NotificationEmailStatus" AS ENUM ('DISABLED', 'PENDING', 'SENT', 'FAILED');

ALTER TABLE "notifications"
  ADD COLUMN "origin" "NotificationOrigin" NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN "href" TEXT,
  ADD COLUMN "entityType" TEXT,
  ADD COLUMN "entityId" TEXT,
  ADD COLUMN "readAt" TIMESTAMP(3),
  ADD COLUMN "emailStatus" "NotificationEmailStatus" NOT NULL DEFAULT 'DISABLED',
  ADD COLUMN "emailAttemptedAt" TIMESTAMP(3),
  ADD COLUMN "emailProviderId" TEXT,
  ADD COLUMN "deduplicationKey" TEXT,
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "actorId" TEXT;

-- Preserve the meaning of existing rows and attach their tenant when possible.
UPDATE "notifications" AS notification
SET "organizationId" = "users"."orgId"
FROM "users"
WHERE notification."userId" = "users"."id";

UPDATE "notifications"
SET "readAt" = "createdAt"
WHERE "leida" = true AND "readAt" IS NULL;

DROP INDEX "notifications_userId_leida_idx";

CREATE UNIQUE INDEX "notifications_userId_deduplicationKey_key"
  ON "notifications"("userId", "deduplicationKey");
CREATE INDEX "notifications_userId_leida_createdAt_idx"
  ON "notifications"("userId", "leida", "createdAt");
CREATE INDEX "notifications_organizationId_createdAt_idx"
  ON "notifications"("organizationId", "createdAt");
CREATE INDEX "notifications_actorId_createdAt_idx"
  ON "notifications"("actorId", "createdAt");
CREATE INDEX "notifications_emailStatus_createdAt_idx"
  ON "notifications"("emailStatus", "createdAt");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
