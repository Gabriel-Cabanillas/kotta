/*
  Warnings:

  - You are about to drop the column `isActive` on the `amenities` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `amenities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AmenityStatus" AS ENUM ('ACTIVA', 'INACTIVA', 'MANTENIMIENTO');

-- AlterTable
ALTER TABLE "amenities" DROP COLUMN "isActive",
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "endTime" TEXT NOT NULL DEFAULT '22:00',
ADD COLUMN     "extraCost" DECIMAL(10,2),
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rules" TEXT,
ADD COLUMN     "startTime" TEXT NOT NULL DEFAULT '08:00',
ADD COLUMN     "status" "AmenityStatus" NOT NULL DEFAULT 'ACTIVA',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weekDays" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[];

-- CreateIndex
CREATE INDEX "amenities_orgId_status_idx" ON "amenities"("orgId", "status");
