-- Additive migration: existing chamber fee rows remain intact and are
-- classified as manual extra charges. New selectable medical tests reuse the
-- same fee relation with feeType = TEST and a stable testCode.
ALTER TABLE "public"."DoctorChamberFee"
  ADD COLUMN "feeType" TEXT NOT NULL DEFAULT 'EXTRA',
  ADD COLUMN "testCode" TEXT;

CREATE INDEX "DoctorChamberFee_testCode_idx"
  ON "public"."DoctorChamberFee"("testCode");
