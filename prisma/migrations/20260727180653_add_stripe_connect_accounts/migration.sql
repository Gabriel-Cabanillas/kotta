-- CreateEnum
CREATE TYPE "TipoCuentaConectada" AS ENUM ('CONDOMINIO', 'PROVEEDOR');

-- CreateTable
CREATE TABLE "cuentas_conectadas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCuentaConectada" NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orgId" TEXT,
    "proveedorId" TEXT,

    CONSTRAINT "cuentas_conectadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "procesadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_conectadas_stripeAccountId_key" ON "cuentas_conectadas"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_conectadas_orgId_key" ON "cuentas_conectadas"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_conectadas_proveedorId_key" ON "cuentas_conectadas"("proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_stripeEventId_key" ON "webhook_events"("stripeEventId");

-- AddForeignKey
ALTER TABLE "cuentas_conectadas" ADD CONSTRAINT "cuentas_conectadas_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuentas_conectadas" ADD CONSTRAINT "cuentas_conectadas_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
