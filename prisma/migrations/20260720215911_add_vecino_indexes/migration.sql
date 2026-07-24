-- CreateIndex
CREATE INDEX "amenity_reservations_userId_date_idx" ON "amenity_reservations"("userId", "date");

-- CreateIndex
CREATE INDEX "amenity_reservations_amenityId_date_status_idx" ON "amenity_reservations"("amenityId", "date", "status");

-- CreateIndex
CREATE INDEX "payments_userId_year_month_idx" ON "payments"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "tickets_reportedById_status_createdAt_idx" ON "tickets"("reportedById", "status", "createdAt");
