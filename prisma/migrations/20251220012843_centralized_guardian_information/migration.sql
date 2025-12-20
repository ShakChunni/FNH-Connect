/*
  Warnings:

  - You are about to drop the column `spouseDOB` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `spouseGender` on the `Patient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "spouseDOB",
DROP COLUMN "spouseGender",
ADD COLUMN     "guardianAddress" TEXT,
ADD COLUMN     "guardianDOB" TIMESTAMP(3),
ADD COLUMN     "guardianEmail" TEXT,
ADD COLUMN     "guardianGender" TEXT,
ADD COLUMN     "guardianPhone" TEXT;
