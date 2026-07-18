-- CreateIndex
CREATE INDEX "assets_orgId_createdAt_idx" ON "assets"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_orgId_year_month_idx" ON "payments"("orgId", "year", "month");

-- CreateIndex
CREATE INDEX "payments_orgId_status_idx" ON "payments"("orgId", "status");

-- CreateIndex
CREATE INDEX "tickets_orgId_status_createdAt_idx" ON "tickets"("orgId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "users_orgId_role_idx" ON "users"("orgId", "role");

-- CreateIndex
CREATE INDEX "work_orders_orgId_createdAt_idx" ON "work_orders"("orgId", "createdAt");
