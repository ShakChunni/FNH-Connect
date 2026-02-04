-- CreateTable
CREATE TABLE "MedicineGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineCompany" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" SERIAL NOT NULL,
    "genericName" TEXT NOT NULL,
    "brandName" TEXT,
    "groupId" INTEGER NOT NULL,
    "strength" TEXT,
    "dosageForm" TEXT,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicinePurchase" (
    "id" SERIAL NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "batchNumber" TEXT,
    "remainingQty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "MedicinePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineSale" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "purchaseId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "MedicineSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicineGroup_name_key" ON "MedicineGroup"("name");

-- CreateIndex
CREATE INDEX "MedicineGroup_name_idx" ON "MedicineGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineCompany_name_key" ON "MedicineCompany"("name");

-- CreateIndex
CREATE INDEX "MedicineCompany_name_idx" ON "MedicineCompany"("name");

-- CreateIndex
CREATE INDEX "Medicine_groupId_idx" ON "Medicine"("groupId");

-- CreateIndex
CREATE INDEX "Medicine_genericName_idx" ON "Medicine"("genericName");

-- CreateIndex
CREATE INDEX "Medicine_currentStock_idx" ON "Medicine"("currentStock");

-- CreateIndex
CREATE UNIQUE INDEX "Medicine_genericName_groupId_key" ON "Medicine"("genericName", "groupId");

-- CreateIndex
CREATE INDEX "MedicinePurchase_companyId_idx" ON "MedicinePurchase"("companyId");

-- CreateIndex
CREATE INDEX "MedicinePurchase_medicineId_idx" ON "MedicinePurchase"("medicineId");

-- CreateIndex
CREATE INDEX "MedicinePurchase_purchaseDate_idx" ON "MedicinePurchase"("purchaseDate");

-- CreateIndex
CREATE INDEX "MedicinePurchase_invoiceNumber_idx" ON "MedicinePurchase"("invoiceNumber");

-- CreateIndex
CREATE INDEX "MedicineSale_patientId_idx" ON "MedicineSale"("patientId");

-- CreateIndex
CREATE INDEX "MedicineSale_medicineId_idx" ON "MedicineSale"("medicineId");

-- CreateIndex
CREATE INDEX "MedicineSale_purchaseId_idx" ON "MedicineSale"("purchaseId");

-- CreateIndex
CREATE INDEX "MedicineSale_saleDate_idx" ON "MedicineSale"("saleDate");

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MedicineGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicinePurchase" ADD CONSTRAINT "MedicinePurchase_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "MedicineCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicinePurchase" ADD CONSTRAINT "MedicinePurchase_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineSale" ADD CONSTRAINT "MedicineSale_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineSale" ADD CONSTRAINT "MedicineSale_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineSale" ADD CONSTRAINT "MedicineSale_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "MedicinePurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
