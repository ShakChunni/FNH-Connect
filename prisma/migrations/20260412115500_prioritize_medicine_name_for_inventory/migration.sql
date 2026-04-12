-- Allow multiple medicines under the same generic name (different medicine names/brands)
DROP INDEX IF EXISTS "Medicine_genericName_groupId_key";

-- Optimize medicine-name-first lookups and duplicate checks
CREATE INDEX IF NOT EXISTS "Medicine_brandName_idx" ON "Medicine"("brandName");
DROP INDEX IF EXISTS "Medicine_brandName_groupId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "Medicine_brandName_groupId_key" ON "Medicine"("brandName", "groupId");
