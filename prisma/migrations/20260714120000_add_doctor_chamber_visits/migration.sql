-- CreateTable
CREATE TABLE "public"."DoctorChamberVisit" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "visitNumber" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultrasoundCharge" DECIMAL(65,30) NOT NULL DEFAULT 800,
    "visitingCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "lastModifiedBy" INTEGER NOT NULL,

    CONSTRAINT "DoctorChamberVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorChamberFee" (
    "id" SERIAL NOT NULL,
    "chamberVisitId" INTEGER NOT NULL,
    "feeName" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "lastModifiedBy" INTEGER,

    CONSTRAINT "DoctorChamberFee_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."ServiceCharge" ADD COLUMN "doctorChamberVisitId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "DoctorChamberVisit_visitNumber_key" ON "public"."DoctorChamberVisit"("visitNumber");
CREATE INDEX "DoctorChamberVisit_patientId_idx" ON "public"."DoctorChamberVisit"("patientId");
CREATE INDEX "DoctorChamberVisit_departmentId_idx" ON "public"."DoctorChamberVisit"("departmentId");
CREATE INDEX "DoctorChamberVisit_doctorId_idx" ON "public"."DoctorChamberVisit"("doctorId");
CREATE INDEX "DoctorChamberVisit_visitDate_idx" ON "public"."DoctorChamberVisit"("visitDate");
CREATE INDEX "DoctorChamberFee_chamberVisitId_idx" ON "public"."DoctorChamberFee"("chamberVisitId");
CREATE INDEX "ServiceCharge_doctorChamberVisitId_idx" ON "public"."ServiceCharge"("doctorChamberVisitId");

-- AddForeignKey
ALTER TABLE "public"."DoctorChamberVisit" ADD CONSTRAINT "DoctorChamberVisit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."DoctorChamberVisit" ADD CONSTRAINT "DoctorChamberVisit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."DoctorChamberVisit" ADD CONSTRAINT "DoctorChamberVisit_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."DoctorChamberFee" ADD CONSTRAINT "DoctorChamberFee_chamberVisitId_fkey" FOREIGN KEY ("chamberVisitId") REFERENCES "public"."DoctorChamberVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ServiceCharge" ADD CONSTRAINT "ServiceCharge_doctorChamberVisitId_fkey" FOREIGN KEY ("doctorChamberVisitId") REFERENCES "public"."DoctorChamberVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

