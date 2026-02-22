-- Add default sale price to medicine master records
ALTER TABLE "Medicine"
ADD COLUMN "defaultSalePrice" DECIMAL NOT NULL DEFAULT 0;