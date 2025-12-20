-- AlterTable
ALTER TABLE "Admission" ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DECIMAL(65,30),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Admitted';

-- CreateIndex
CREATE INDEX "Admission_status_idx" ON "Admission"("status");
