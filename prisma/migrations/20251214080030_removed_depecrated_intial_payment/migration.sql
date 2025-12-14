/*
  Warnings:

  - You are about to drop the column `initialPayment` on the `PathologyTest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PathologyTest" DROP COLUMN "initialPayment",
ALTER COLUMN "discountAmount" DROP NOT NULL,
ALTER COLUMN "discountAmount" DROP DEFAULT;
