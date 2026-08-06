-- AlterEnum
ALTER TYPE "EstadoPago" ADD VALUE 'DISPUTA_PERDIDA';

-- CreateTable
CREATE TABLE "disputas_stripe" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "stripeDisputeId" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "moneda" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "estadoStripe" TEXT NOT NULL,
    "fechaLimite" TIMESTAMP(3),
    "creadaEn" TIMESTAMP(3) NOT NULL,
    "cerradaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputas_stripe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disputas_stripe_pagoId_key" ON "disputas_stripe"("pagoId");

-- CreateIndex
CREATE UNIQUE INDEX "disputas_stripe_stripeDisputeId_key" ON "disputas_stripe"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "disputas_stripe_estadoStripe_fechaLimite_idx" ON "disputas_stripe"("estadoStripe", "fechaLimite");

-- AddForeignKey
ALTER TABLE "disputas_stripe" ADD CONSTRAINT "disputas_stripe_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
