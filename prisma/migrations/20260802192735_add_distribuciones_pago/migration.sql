-- CreateEnum
CREATE TYPE "TipoDestino" AS ENUM ('CONDOMINIO', 'PROVEEDOR');

-- CreateTable
CREATE TABLE "distribuciones_pago" (
    "id" TEXT NOT NULL,
    "pagoOrigenId" TEXT NOT NULL,
    "destino" "TipoDestino" NOT NULL,
    "cuentaConectadaId" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "estado" "EstadoPago" NOT NULL,
    "stripeTransferId" TEXT,
    "sourceTransactionId" TEXT,
    "workOrderId" TEXT,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribuciones_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "distribuciones_pago_stripeTransferId_key" ON "distribuciones_pago"("stripeTransferId");

-- CreateIndex
CREATE UNIQUE INDEX "distribuciones_pago_workOrderId_key" ON "distribuciones_pago"("workOrderId");

-- AddForeignKey
ALTER TABLE "distribuciones_pago" ADD CONSTRAINT "distribuciones_pago_pagoOrigenId_fkey" FOREIGN KEY ("pagoOrigenId") REFERENCES "pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuciones_pago" ADD CONSTRAINT "distribuciones_pago_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
