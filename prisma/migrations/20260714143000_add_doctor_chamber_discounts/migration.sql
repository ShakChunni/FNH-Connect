-- Additive chamber billing fields. Existing rows keep their current total and
-- are copied into subtotal with a zero discount, so no historical money is
-- changed or lost.
ALTER TABLE "public"."DoctorChamberVisit"
  ADD COLUMN "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
  ADD COLUMN "discountType" TEXT,
  ADD COLUMN "discountValue" DECIMAL(65,30),
  ADD COLUMN "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "public"."DoctorChamberVisit"
SET "subtotal" = "totalAmount"
WHERE "subtotal" = 0 AND "totalAmount" <> 0;
