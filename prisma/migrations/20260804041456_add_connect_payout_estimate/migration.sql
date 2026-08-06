-- AlterTable
ALTER TABLE "distribuciones_pago" ADD COLUMN     "comisionEstimada" DECIMAL(65,30),
ADD COLUMN     "montoOriginal" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- Los registros anteriores no tenían recargo: su monto original es el
-- importe ya registrado, conservando intacto el historial contable.
UPDATE "distribuciones_pago" SET "montoOriginal" = "monto";

-- CreateTable
CREATE TABLE "conciliaciones_payout_mensual" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "totalEstimadoCobrado" DECIMAL(65,30) NOT NULL,
    "totalRealFacturado" DECIMAL(65,30),
    "diferencia" DECIMAL(65,30),
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conciliaciones_payout_mensual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conciliaciones_payout_mensual_periodo_key" ON "conciliaciones_payout_mensual"("periodo");
