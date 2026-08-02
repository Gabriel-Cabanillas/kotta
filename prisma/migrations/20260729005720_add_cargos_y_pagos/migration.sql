-- CreateEnum
CREATE TYPE "TipoCargo" AS ENUM ('MASIVO', 'GRUPO', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PROCESANDO', 'PAGADO', 'FALLIDO', 'EN_DISPUTA', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "TipoOperacionPago" AS ENUM ('CARGO', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoCargo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT NOT NULL,
    "creadoPorId" TEXT NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_destinatarios" (
    "id" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "viviendaId" TEXT NOT NULL,

    CONSTRAINT "cargo_destinatarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "estado" "EstadoPago" NOT NULL,
    "tipoOperacion" "TipoOperacionPago" NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeTransferId" TEXT,
    "referencia" TEXT,
    "comprobanteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT NOT NULL,
    "cargoId" TEXT,
    "vecinoId" TEXT,
    "proveedorId" TEXT,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cargo_destinatarios_cargoId_viviendaId_key" ON "cargo_destinatarios"("cargoId", "viviendaId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_stripePaymentIntentId_key" ON "pagos"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_stripeTransferId_key" ON "pagos"("stripeTransferId");

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_destinatarios" ADD CONSTRAINT "cargo_destinatarios_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_destinatarios" ADD CONSTRAINT "cargo_destinatarios_viviendaId_fkey" FOREIGN KEY ("viviendaId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_vecinoId_fkey" FOREIGN KEY ("vecinoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
