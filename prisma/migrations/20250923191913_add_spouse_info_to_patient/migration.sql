/*
  Warnings:

  - You are about to drop the column `address` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `alc` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `bp` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `hospitalName` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `husbandAge` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `husbandDOB` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `husbandName` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `mobileNumber` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `patientAge` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `patientDOB` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `patientFirstName` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `patientFullName` on the `InfertilityPatient` table. All the data in the column will be lost.
  - You are about to drop the column `patientLastName` on the `InfertilityPatient` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[patientId,hospitalId]` on the table `InfertilityPatient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `InfertilityPatient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `InfertilityPatient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `InfertilityPatient` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."InfertilityPatient_mobileNumber_idx";

-- DropIndex
DROP INDEX "public"."InfertilityPatient_patientFullName_idx";

-- AlterTable
ALTER TABLE "public"."InfertilityPatient" DROP COLUMN "address",
DROP COLUMN "alc",
DROP COLUMN "bp",
DROP COLUMN "hospitalName",
DROP COLUMN "husbandAge",
DROP COLUMN "husbandDOB",
DROP COLUMN "husbandName",
DROP COLUMN "mobileNumber",
DROP COLUMN "patientAge",
DROP COLUMN "patientDOB",
DROP COLUMN "patientFirstName",
DROP COLUMN "patientFullName",
DROP COLUMN "patientLastName",
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "bloodPressure" TEXT,
ADD COLUMN     "bmi" DECIMAL(65,30),
ADD COLUMN     "chiefComplaint" TEXT,
ADD COLUMN     "contraceptiveHistory" TEXT,
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "gravida" TEXT,
ADD COLUMN     "height" DECIMAL(65,30),
ADD COLUMN     "hospitalId" INTEGER NOT NULL,
ADD COLUMN     "lastModifiedBy" INTEGER,
ADD COLUMN     "medicalHistory" TEXT,
ADD COLUMN     "medications" TEXT,
ADD COLUMN     "menstrualHistory" TEXT,
ADD COLUMN     "nextAppointment" TIMESTAMP(3),
ADD COLUMN     "patientId" INTEGER NOT NULL,
ADD COLUMN     "referralSource" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'Active',
ADD COLUMN     "surgicalHistory" TEXT,
ADD COLUMN     "treatmentPlan" TEXT;

-- AlterTable
ALTER TABLE "public"."Patient" ADD COLUMN     "spouseAge" INTEGER,
ADD COLUMN     "spouseDOB" TIMESTAMP(3),
ADD COLUMN     "spouseGender" TEXT;

-- CreateTable
CREATE TABLE "public"."Hospital" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "website" TEXT,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_name_key" ON "public"."Hospital"("name");

-- CreateIndex
CREATE INDEX "Hospital_name_idx" ON "public"."Hospital"("name");

-- CreateIndex
CREATE INDEX "InfertilityPatient_patientId_idx" ON "public"."InfertilityPatient"("patientId");

-- CreateIndex
CREATE INDEX "InfertilityPatient_hospitalId_idx" ON "public"."InfertilityPatient"("hospitalId");

-- CreateIndex
CREATE INDEX "InfertilityPatient_createdAt_idx" ON "public"."InfertilityPatient"("createdAt");

-- CreateIndex
CREATE INDEX "InfertilityPatient_status_idx" ON "public"."InfertilityPatient"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InfertilityPatient_patientId_hospitalId_key" ON "public"."InfertilityPatient"("patientId", "hospitalId");

-- AddForeignKey
ALTER TABLE "public"."InfertilityPatient" ADD CONSTRAINT "InfertilityPatient_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InfertilityPatient" ADD CONSTRAINT "InfertilityPatient_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "public"."Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InfertilityPatient" ADD CONSTRAINT "InfertilityPatient_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InfertilityPatient" ADD CONSTRAINT "InfertilityPatient_lastModifiedBy_fkey" FOREIGN KEY ("lastModifiedBy") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
