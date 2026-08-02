-- AlterTable
ALTER TABLE "pagos" ADD COLUMN "workOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pagos_workOrderId_key" ON "pagos"("workOrderId");

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
