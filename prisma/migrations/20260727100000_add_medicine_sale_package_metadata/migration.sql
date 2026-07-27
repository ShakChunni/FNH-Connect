ALTER TABLE "MedicineSale"
ADD COLUMN "packageCode" TEXT,
ADD COLUMN "operationName" TEXT;

CREATE INDEX "MedicineSale_packageCode_idx"
ON "MedicineSale"("packageCode");
