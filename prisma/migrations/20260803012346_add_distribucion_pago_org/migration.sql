/*
  Warnings:

  - Added the required column `orgId` to the `distribuciones_pago` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "distribuciones_pago" DROP CONSTRAINT "distribuciones_pago_pagoOrigenId_fkey";

-- AlterTable
ALTER TABLE "distribuciones_pago" ADD COLUMN     "orgId" TEXT NOT NULL,
ALTER COLUMN "pagoOrigenId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "distribuciones_pago_orgId_idx" ON "distribuciones_pago"("orgId");

-- AddForeignKey
ALTER TABLE "distribuciones_pago" ADD CONSTRAINT "distribuciones_pago_pagoOrigenId_fkey" FOREIGN KEY ("pagoOrigenId") REFERENCES "pagos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuciones_pago" ADD CONSTRAINT "distribuciones_pago_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
