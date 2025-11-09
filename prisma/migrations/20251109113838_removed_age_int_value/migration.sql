/*
  Warnings:

  - You are about to drop the column `createdAt` on the `BlockedIP` table. All the data in the column will be lost.
  - You are about to drop the column `unblock_reason` on the `BlockedIP` table. All the data in the column will be lost.
  - You are about to drop the column `unblocked_at` on the `BlockedIP` table. All the data in the column will be lost.
  - You are about to drop the column `unblocked_by` on the `BlockedIP` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `BlockedIP` table. All the data in the column will be lost.
  - You are about to drop the column `approvedAt` on the `CashMovement` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `CashMovement` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `CashMovement` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `CashMovement` table. All the data in the column will be lost.
  - You are about to drop the column `age` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `spouseAge` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `RateLimit` table. All the data in the column will be lost.
  - You are about to drop the column `login_attempts` on the `RateLimit` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RateLimit` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `SecurityLog` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `SecurityLog` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `SecurityLog` table. All the data in the column will be lost.
  - You are about to drop the column `collectedByStaffId` on the `ServiceCharge` table. All the data in the column will be lost.
  - You are about to drop the column `collectionNotes` on the `ServiceCharge` table. All the data in the column will be lost.
  - You are about to drop the column `collectionTime` on the `ServiceCharge` table. All the data in the column will be lost.
  - You are about to drop the column `reconciledNotes` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `totalCollected` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `totalRefunded` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `varianceResolution` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the `CSRFToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[ip_address,path,window_start]` on the table `RateLimit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `path` to the `RateLimit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `window_end` to the `RateLimit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."CSRFToken" DROP CONSTRAINT "CSRFToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SecurityLog" DROP CONSTRAINT "SecurityLog_userId_fkey";

-- DropIndex
DROP INDEX "public"."BlockedIP_blocked_at_idx";

-- DropIndex
DROP INDEX "public"."BlockedIP_is_permanent_idx";

-- DropIndex
DROP INDEX "public"."CashMovement_movementType_idx";

-- DropIndex
DROP INDEX "public"."CashMovement_paymentId_idx";

-- DropIndex
DROP INDEX "public"."RateLimit_ip_address_idx";

-- DropIndex
DROP INDEX "public"."RateLimit_ip_address_key";

-- DropIndex
DROP INDEX "public"."RateLimit_window_start_idx";

-- DropIndex
DROP INDEX "public"."SecurityLog_severity_idx";

-- DropIndex
DROP INDEX "public"."SecurityLog_userId_idx";

-- DropIndex
DROP INDEX "public"."Shift_reconciledAt_idx";

-- AlterTable
ALTER TABLE "public"."BlockedIP" DROP COLUMN "createdAt",
DROP COLUMN "unblock_reason",
DROP COLUMN "unblocked_at",
DROP COLUMN "unblocked_by",
DROP COLUMN "updatedAt",
ADD COLUMN     "paths" TEXT[],
ALTER COLUMN "attempt_count" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."CashMovement" DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
DROP COLUMN "createdBy",
DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "public"."Patient" DROP COLUMN "age",
DROP COLUMN "spouseAge";

-- AlterTable
ALTER TABLE "public"."RateLimit" DROP COLUMN "createdAt",
DROP COLUMN "login_attempts",
DROP COLUMN "updatedAt",
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "request_count" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "window_end" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."SecurityLog" DROP COLUMN "description",
DROP COLUMN "userId",
DROP COLUMN "user_agent",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "path" TEXT;

-- AlterTable
ALTER TABLE "public"."ServiceCharge" DROP COLUMN "collectedByStaffId",
DROP COLUMN "collectionNotes",
DROP COLUMN "collectionTime";

-- AlterTable
ALTER TABLE "public"."Shift" DROP COLUMN "reconciledNotes",
DROP COLUMN "totalCollected",
DROP COLUMN "totalRefunded",
DROP COLUMN "varianceResolution";

-- DropTable
DROP TABLE "public"."CSRFToken";

-- CreateTable
CREATE TABLE "public"."LoginAttempt" (
    "id" SERIAL NOT NULL,
    "ip_address" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_address_idx" ON "public"."LoginAttempt"("ip_address");

-- CreateIndex
CREATE INDEX "LoginAttempt_username_idx" ON "public"."LoginAttempt"("username");

-- CreateIndex
CREATE INDEX "LoginAttempt_timestamp_idx" ON "public"."LoginAttempt"("timestamp");

-- CreateIndex
CREATE INDEX "LoginAttempt_success_idx" ON "public"."LoginAttempt"("success");

-- CreateIndex
CREATE INDEX "RateLimit_window_end_idx" ON "public"."RateLimit"("window_end");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_ip_address_path_window_start_key" ON "public"."RateLimit"("ip_address", "path", "window_start");
