-- AlterTable
ALTER TABLE "distribuciones_pago" ADD COLUMN     "notaManual" TEXT,
ADD COLUMN     "origenManual" BOOLEAN NOT NULL DEFAULT false;
