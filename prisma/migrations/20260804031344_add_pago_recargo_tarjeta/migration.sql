-- AlterTable
ALTER TABLE "pagos" ADD COLUMN     "metodoPagoSeleccionado" TEXT,
ADD COLUMN     "montoConRecargo" DECIMAL(65,30),
ADD COLUMN     "montoNeto" DECIMAL(65,30),
ADD COLUMN     "montoOriginal" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "stripeFeeAmount" DECIMAL(65,30);

-- Conserva el significado contable de los pagos históricos: antes del recargo,
-- el monto registrado era exactamente el importe original del cargo.
UPDATE "pagos" SET "montoOriginal" = "monto";
