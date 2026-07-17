CREATE TABLE "public"."InfertilityCaseNumberSequence" (
    "year" INTEGER NOT NULL,
    "lastSequence" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfertilityCaseNumberSequence_pkey" PRIMARY KEY ("year")
);

-- Seed every existing year from assigned case numbers, including records that
-- are currently hidden/merged, so no historical number can be reused.
INSERT INTO "public"."InfertilityCaseNumberSequence" ("year", "lastSequence")
SELECT
    SUBSTRING("caseNumber" FROM 5 FOR 2)::INTEGER AS "year",
    MAX(SUBSTRING("caseNumber" FROM 8)::INTEGER) AS "lastSequence"
FROM "public"."InfertilityPatient"
WHERE "caseNumber" ~ '^INF-[0-9]{2}-[0-9]{5}$'
GROUP BY SUBSTRING("caseNumber" FROM 5 FOR 2);
