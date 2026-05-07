CREATE TYPE "InvestigationSubjectType" AS ENUM ('PATIENT', 'SPOUSE', 'UNKNOWN');

ALTER TABLE "InfertilityTest"
ADD COLUMN     "subjectType" "InvestigationSubjectType" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "subjectNameSnapshot" TEXT,
ADD COLUMN     "sourcePathologyTestId" INTEGER;

ALTER TABLE "InfertilityServiceCharge"
ADD COLUMN     "sourceServiceChargeId" INTEGER;

ALTER TABLE "InfertilityPayment"
ADD COLUMN     "sourcePaymentId" INTEGER;

ALTER TABLE "InfertilityPaymentAllocation"
ADD COLUMN     "sourcePaymentAllocationId" INTEGER;

ALTER TABLE "InfertilityCashMovement"
ADD COLUMN     "sourceCashMovementId" INTEGER;

ALTER TABLE "InfertilityShift"
ADD COLUMN     "sourceShiftId" INTEGER;

CREATE UNIQUE INDEX "InfertilityTest_sourcePathologyTestId_key" ON "InfertilityTest"("sourcePathologyTestId");
CREATE UNIQUE INDEX "InfertilityServiceCharge_sourceServiceChargeId_key" ON "InfertilityServiceCharge"("sourceServiceChargeId");
CREATE UNIQUE INDEX "InfertilityPayment_sourcePaymentId_key" ON "InfertilityPayment"("sourcePaymentId");
CREATE UNIQUE INDEX "InfertilityPaymentAllocation_sourcePaymentAllocationId_key" ON "InfertilityPaymentAllocation"("sourcePaymentAllocationId");
CREATE UNIQUE INDEX "InfertilityCashMovement_sourceCashMovementId_key" ON "InfertilityCashMovement"("sourceCashMovementId");
CREATE UNIQUE INDEX "InfertilityShift_sourceShiftId_key" ON "InfertilityShift"("sourceShiftId");
CREATE INDEX "InfertilityTest_infertilityPatientId_testDate_idx" ON "InfertilityTest"("infertilityPatientId", "testDate" DESC);
