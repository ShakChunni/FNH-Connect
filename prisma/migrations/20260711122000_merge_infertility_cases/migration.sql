ALTER TABLE "InfertilityPatient"
ADD COLUMN "mergedIntoId" INTEGER,
ADD COLUMN "mergedAt" TIMESTAMP(3),
ADD COLUMN "mergedReason" TEXT;

CREATE INDEX "InfertilityPatient_mergedIntoId_idx"
ON "InfertilityPatient"("mergedIntoId");

ALTER TABLE "InfertilityPatient"
ADD CONSTRAINT "InfertilityPatient_mergedIntoId_fkey"
FOREIGN KEY ("mergedIntoId") REFERENCES "InfertilityPatient"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "InfertilityCaseMergeArchive" (
    "id" SERIAL NOT NULL,
    "sourceCaseId" INTEGER NOT NULL,
    "sourceCaseNumber" TEXT NOT NULL,
    "canonicalCaseId" INTEGER NOT NULL,
    "canonicalCaseNumber" TEXT NOT NULL,
    "sourcePatientId" INTEGER NOT NULL,
    "sourceCaseSnapshot" TEXT NOT NULL,
    "sourcePatientSnapshot" TEXT NOT NULL,
    "sourceTestsSnapshot" TEXT NOT NULL,
    "sourcePathologyTestsSnapshot" TEXT NOT NULL,
    "sourceAccountSnapshot" TEXT,
    "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,

    CONSTRAINT "InfertilityCaseMergeArchive_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InfertilityCaseMergeArchive_sourceCaseId_canonicalCaseId_key"
ON "InfertilityCaseMergeArchive"("sourceCaseId", "canonicalCaseId");

CREATE INDEX "InfertilityCaseMergeArchive_sourceCaseId_idx"
ON "InfertilityCaseMergeArchive"("sourceCaseId");

CREATE INDEX "InfertilityCaseMergeArchive_canonicalCaseId_idx"
ON "InfertilityCaseMergeArchive"("canonicalCaseId");

CREATE INDEX "InfertilityCaseMergeArchive_mergedAt_idx"
ON "InfertilityCaseMergeArchive"("mergedAt");
