/*
  Warnings:

  - Added the required column `createdBy` to the `CashMovement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CashMovement" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" INTEGER,
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "ServiceCharge" ADD COLUMN     "collectedByStaffId" INTEGER,
ADD COLUMN     "collectionNotes" TEXT,
ADD COLUMN     "collectionTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "reconciledNotes" TEXT,
ADD COLUMN     "totalCollected" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "totalRefunded" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "varianceResolution" TEXT;

-- CreateTable
CREATE TABLE "CSRFToken" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CSRFToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CSRFToken_token_key" ON "CSRFToken"("token");

-- CreateIndex
CREATE INDEX "CSRFToken_userId_idx" ON "CSRFToken"("userId");

-- CreateIndex
CREATE INDEX "CSRFToken_expiresAt_idx" ON "CSRFToken"("expiresAt");

-- CreateIndex
CREATE INDEX "CashMovement_movementType_idx" ON "CashMovement"("movementType");

-- CreateIndex
CREATE INDEX "CashMovement_paymentId_idx" ON "CashMovement"("paymentId");

-- CreateIndex
CREATE INDEX "Shift_reconciledAt_idx" ON "Shift"("reconciledAt");

-- AddForeignKey
ALTER TABLE "CSRFToken" ADD CONSTRAINT "CSRFToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
