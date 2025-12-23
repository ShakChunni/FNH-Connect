-- AlterTable
ALTER TABLE "public"."InfertilityPatient" ADD COLUMN "caseNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InfertilityPatient_caseNumber_key" ON "public"."InfertilityPatient"("caseNumber");