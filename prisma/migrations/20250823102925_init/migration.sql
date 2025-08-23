-- CreateTable
CREATE TABLE "public"."Patient" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER,
    "dateOfBirth" TIMESTAMP(3),
    "guardianName" TEXT,
    "address" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "bloodGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Staff" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "specialization" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffDepartment" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StaffDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "staffId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admission" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "dateAdmitted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDischarged" TIMESTAMP(3),
    "isDischarged" BOOLEAN NOT NULL DEFAULT false,
    "admissionFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "serviceCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "seatRent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "medicineCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otherCharges" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dueAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "initialPayment" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "seatNumber" TEXT,
    "ward" TEXT,
    "diagnosis" TEXT,
    "otType" TEXT,
    "treatment" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "lastModifiedBy" INTEGER NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PathologyTest" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "testNumber" TEXT NOT NULL,
    "admissionId" INTEGER,
    "orderedById" INTEGER NOT NULL,
    "doneById" INTEGER,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportDate" TIMESTAMP(3),
    "testCategory" TEXT NOT NULL,
    "testResults" JSONB,
    "remarks" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "testCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dueAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "initialPayment" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "lastModifiedBy" INTEGER NOT NULL,

    CONSTRAINT "PathologyTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shift" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openingCash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "closingCash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "systemCash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "variance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "reconciledAt" TIMESTAMP(3),
    "reconciledBy" INTEGER,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CashMovement" (
    "id" SERIAL NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "movementType" TEXT NOT NULL,
    "description" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentId" INTEGER,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientAccount" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "totalCharges" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalDue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "advanceBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "PatientAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceCharge" (
    "id" SERIAL NOT NULL,
    "patientAccountId" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "originalAmount" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(65,30) NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "admissionId" INTEGER,
    "pathologyTestId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "ServiceCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "patientAccountId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedById" INTEGER NOT NULL,
    "shiftId" INTEGER NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentAllocation" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "serviceChargeId" INTEGER NOT NULL,
    "allocatedAmount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceFingerprint" TEXT,
    "readableFingerprint" TEXT,
    "osType" TEXT,
    "browserName" TEXT,
    "browserVersion" TEXT,
    "deviceType" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT,
    "entityId" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "sessionId" TEXT,
    "deviceFingerprint" TEXT,
    "readableFingerprint" TEXT,
    "deviceType" TEXT,
    "browserName" TEXT,
    "browserVersion" TEXT,
    "osType" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HospitalConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "HospitalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InfertilityPatient" (
    "id" SERIAL NOT NULL,
    "hospitalName" TEXT,
    "patientFirstName" TEXT NOT NULL,
    "patientLastName" TEXT,
    "patientFullName" TEXT NOT NULL,
    "patientAge" INTEGER,
    "patientDOB" TIMESTAMP(3),
    "husbandName" TEXT,
    "husbandAge" INTEGER,
    "husbandDOB" TIMESTAMP(3),
    "mobileNumber" TEXT,
    "address" TEXT,
    "yearsMarried" INTEGER,
    "yearsTrying" INTEGER,
    "para" TEXT,
    "alc" TEXT,
    "weight" DECIMAL(65,30),
    "bp" TEXT,
    "infertilityType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfertilityPatient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Patient_fullName_idx" ON "public"."Patient"("fullName");

-- CreateIndex
CREATE INDEX "Patient_phoneNumber_idx" ON "public"."Patient"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "public"."Department"("name");

-- CreateIndex
CREATE INDEX "Staff_fullName_idx" ON "public"."Staff"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "StaffDepartment_staffId_departmentId_key" ON "public"."StaffDepartment"("staffId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_staffId_key" ON "public"."User"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_admissionNumber_key" ON "public"."Admission"("admissionNumber");

-- CreateIndex
CREATE INDEX "Admission_patientId_idx" ON "public"."Admission"("patientId");

-- CreateIndex
CREATE INDEX "Admission_departmentId_idx" ON "public"."Admission"("departmentId");

-- CreateIndex
CREATE INDEX "Admission_doctorId_idx" ON "public"."Admission"("doctorId");

-- CreateIndex
CREATE INDEX "Admission_dateAdmitted_idx" ON "public"."Admission"("dateAdmitted");

-- CreateIndex
CREATE INDEX "Admission_isDischarged_idx" ON "public"."Admission"("isDischarged");

-- CreateIndex
CREATE UNIQUE INDEX "PathologyTest_testNumber_key" ON "public"."PathologyTest"("testNumber");

-- CreateIndex
CREATE INDEX "PathologyTest_patientId_idx" ON "public"."PathologyTest"("patientId");

-- CreateIndex
CREATE INDEX "PathologyTest_departmentId_idx" ON "public"."PathologyTest"("departmentId");

-- CreateIndex
CREATE INDEX "PathologyTest_admissionId_idx" ON "public"."PathologyTest"("admissionId");

-- CreateIndex
CREATE INDEX "PathologyTest_orderedById_idx" ON "public"."PathologyTest"("orderedById");

-- CreateIndex
CREATE INDEX "PathologyTest_testDate_idx" ON "public"."PathologyTest"("testDate");

-- CreateIndex
CREATE INDEX "Shift_staffId_idx" ON "public"."Shift"("staffId");

-- CreateIndex
CREATE INDEX "Shift_startTime_idx" ON "public"."Shift"("startTime");

-- CreateIndex
CREATE INDEX "Shift_isActive_idx" ON "public"."Shift"("isActive");

-- CreateIndex
CREATE INDEX "CashMovement_shiftId_idx" ON "public"."CashMovement"("shiftId");

-- CreateIndex
CREATE INDEX "CashMovement_timestamp_idx" ON "public"."CashMovement"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAccount_patientId_key" ON "public"."PatientAccount"("patientId");

-- CreateIndex
CREATE INDEX "PatientAccount_patientId_idx" ON "public"."PatientAccount"("patientId");

-- CreateIndex
CREATE INDEX "ServiceCharge_patientAccountId_idx" ON "public"."ServiceCharge"("patientAccountId");

-- CreateIndex
CREATE INDEX "ServiceCharge_departmentId_idx" ON "public"."ServiceCharge"("departmentId");

-- CreateIndex
CREATE INDEX "ServiceCharge_serviceType_idx" ON "public"."ServiceCharge"("serviceType");

-- CreateIndex
CREATE INDEX "ServiceCharge_serviceDate_idx" ON "public"."ServiceCharge"("serviceDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "public"."Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_patientAccountId_idx" ON "public"."Payment"("patientAccountId");

-- CreateIndex
CREATE INDEX "Payment_collectedById_idx" ON "public"."Payment"("collectedById");

-- CreateIndex
CREATE INDEX "Payment_shiftId_idx" ON "public"."Payment"("shiftId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "public"."Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "public"."PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_serviceChargeId_idx" ON "public"."PaymentAllocation"("serviceChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "public"."Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_deviceFingerprint_idx" ON "public"."Session"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "Session_readableFingerprint_idx" ON "public"."Session"("readableFingerprint");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "public"."ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "public"."ActivityLog"("timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "public"."ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_sessionId_idx" ON "public"."ActivityLog"("sessionId");

-- CreateIndex
CREATE INDEX "ActivityLog_deviceFingerprint_idx" ON "public"."ActivityLog"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "ActivityLog_readableFingerprint_idx" ON "public"."ActivityLog"("readableFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalConfig_key_key" ON "public"."HospitalConfig"("key");

-- CreateIndex
CREATE INDEX "InfertilityPatient_patientFullName_idx" ON "public"."InfertilityPatient"("patientFullName");

-- CreateIndex
CREATE INDEX "InfertilityPatient_mobileNumber_idx" ON "public"."InfertilityPatient"("mobileNumber");

-- AddForeignKey
ALTER TABLE "public"."StaffDepartment" ADD CONSTRAINT "StaffDepartment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffDepartment" ADD CONSTRAINT "StaffDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Admission" ADD CONSTRAINT "Admission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Admission" ADD CONSTRAINT "Admission_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Admission" ADD CONSTRAINT "Admission_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathologyTest" ADD CONSTRAINT "PathologyTest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathologyTest" ADD CONSTRAINT "PathologyTest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathologyTest" ADD CONSTRAINT "PathologyTest_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathologyTest" ADD CONSTRAINT "PathologyTest_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathologyTest" ADD CONSTRAINT "PathologyTest_doneById_fkey" FOREIGN KEY ("doneById") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shift" ADD CONSTRAINT "Shift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashMovement" ADD CONSTRAINT "CashMovement_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CashMovement" ADD CONSTRAINT "CashMovement_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientAccount" ADD CONSTRAINT "PatientAccount_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceCharge" ADD CONSTRAINT "ServiceCharge_patientAccountId_fkey" FOREIGN KEY ("patientAccountId") REFERENCES "public"."PatientAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceCharge" ADD CONSTRAINT "ServiceCharge_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceCharge" ADD CONSTRAINT "ServiceCharge_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "public"."Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceCharge" ADD CONSTRAINT "ServiceCharge_pathologyTestId_fkey" FOREIGN KEY ("pathologyTestId") REFERENCES "public"."PathologyTest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_patientAccountId_fkey" FOREIGN KEY ("patientAccountId") REFERENCES "public"."PatientAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_serviceChargeId_fkey" FOREIGN KEY ("serviceChargeId") REFERENCES "public"."ServiceCharge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
