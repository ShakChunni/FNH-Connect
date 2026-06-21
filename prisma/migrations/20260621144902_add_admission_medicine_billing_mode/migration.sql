-- Complete the admission-to-pharmacy persistence introduced in the Prisma
-- schema and add the per-admission medicine billing mode. The IF NOT EXISTS
-- clauses keep this migration safe for databases where the earlier feature
-- was deployed with `prisma db push` before a migration was committed.

CREATE TABLE IF NOT EXISTS "AdmissionMedicineCharge" (
    "id" SERIAL NOT NULL,
    "admissionId" INTEGER NOT NULL,
    "medicineId" INTEGER,
    "packageCode" TEXT,
    "operationName" TEXT NOT NULL,
    "requestedMedicineName" TEXT,
    "medicineName" TEXT NOT NULL,
    "genericName" TEXT,
    "groupName" TEXT,
    "companyName" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "lastModifiedBy" INTEGER,

    CONSTRAINT "AdmissionMedicineCharge_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MedicineSale"
ADD COLUMN IF NOT EXISTS "admissionId" INTEGER,
ADD COLUMN IF NOT EXISTS "admissionMedicineChargeId" INTEGER;

ALTER TABLE "Admission"
ADD COLUMN IF NOT EXISTS "medicineBillingEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "AdmissionMedicineCharge_admissionId_idx"
ON "AdmissionMedicineCharge"("admissionId");

CREATE INDEX IF NOT EXISTS "AdmissionMedicineCharge_medicineId_idx"
ON "AdmissionMedicineCharge"("medicineId");

CREATE INDEX IF NOT EXISTS "AdmissionMedicineCharge_packageCode_idx"
ON "AdmissionMedicineCharge"("packageCode");

CREATE INDEX IF NOT EXISTS "AdmissionMedicineCharge_operationName_idx"
ON "AdmissionMedicineCharge"("operationName");

CREATE INDEX IF NOT EXISTS "MedicineSale_admissionId_idx"
ON "MedicineSale"("admissionId");

CREATE INDEX IF NOT EXISTS "MedicineSale_admissionMedicineChargeId_idx"
ON "MedicineSale"("admissionMedicineChargeId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'AdmissionMedicineCharge_admissionId_fkey'
  ) THEN
    ALTER TABLE "AdmissionMedicineCharge"
    ADD CONSTRAINT "AdmissionMedicineCharge_admissionId_fkey"
    FOREIGN KEY ("admissionId") REFERENCES "Admission"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'AdmissionMedicineCharge_medicineId_fkey'
  ) THEN
    ALTER TABLE "AdmissionMedicineCharge"
    ADD CONSTRAINT "AdmissionMedicineCharge_medicineId_fkey"
    FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'MedicineSale_admissionId_fkey'
  ) THEN
    ALTER TABLE "MedicineSale"
    ADD CONSTRAINT "MedicineSale_admissionId_fkey"
    FOREIGN KEY ("admissionId") REFERENCES "Admission"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'MedicineSale_admissionMedicineChargeId_fkey'
  ) THEN
    ALTER TABLE "MedicineSale"
    ADD CONSTRAINT "MedicineSale_admissionMedicineChargeId_fkey"
    FOREIGN KEY ("admissionMedicineChargeId")
    REFERENCES "AdmissionMedicineCharge"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Preserve historical billed admissions, including inconsistent legacy
-- records where only the itemized rows contain a monetary value.
UPDATE "Admission" AS admission
SET "medicineBillingEnabled" = true
WHERE admission."medicineCharge" <> 0
   OR EXISTS (
     SELECT 1
     FROM "AdmissionMedicineCharge" AS charge
     WHERE charge."admissionId" = admission.id
       AND charge."totalAmount" <> 0
   );
