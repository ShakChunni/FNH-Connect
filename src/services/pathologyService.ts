/**
 * Pathology Service Layer
 * Business logic for pathology patient management with payment tracking
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface PathologyFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
  testCategory?: string;
}

export interface PatientData {
  id?: number | null;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  age: number | null;
  dateOfBirth: Date | null;
  guardianName: string;
  address: string;
  phoneNumber: string;
  email: string;
  bloodGroup: string;
}

export interface HospitalData {
  id?: number | null;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website: string;
  type: string;
}

export interface GuardianData {
  name: string;
  age: number | null;
  dateOfBirth: Date | null;
  gender: string;
}

export interface PathologyData {
  selectedTests: string[]; // Array of test codes
  testCharge: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number; // Amount paid by patient
  dueAmount: number;
  remarks: string;
  isCompleted: boolean;
  orderedById: number | null; // Doctor who ordered the test
  doneById: number | null; // Staff who performed the test
}

// ═══════════════════════════════════════════════════════════════
// QUERY SERVICES
// ═══════════════════════════════════════════════════════════════

export async function getPathologyPatients(filters: PathologyFilters) {
  const where: Prisma.PathologyTestWhereInput = {};

  // Search filter - search by patient name, phone, or test number
  if (filters.search) {
    where.OR = [
      {
        patient: {
          OR: [
            { fullName: { contains: filters.search, mode: "insensitive" } },
            { phoneNumber: { contains: filters.search } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        },
      },
      { testNumber: { contains: filters.search } },
    ];
  }

  // Date range filter - filter by testDate
  if (filters.startDate || filters.endDate) {
    where.testDate = {};
    if (filters.startDate) {
      where.testDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.testDate.lte = new Date(filters.endDate);
    }
  }

  // Completion status filter
  if (filters.isCompleted !== undefined) {
    where.isCompleted = filters.isCompleted;
  }

  // Test category filter
  if (filters.testCategory) {
    where.testCategory = filters.testCategory;
  }

  return await prisma.pathologyTest.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          email: true,
          gender: true,
          dateOfBirth: true,
          guardianName: true,
          guardianDOB: true,
          guardianGender: true,
          address: true,
          bloodGroup: true,
          hospitalId: true,
          hospital: {
            select: {
              id: true,
              name: true,
              address: true,
              phoneNumber: true,
              email: true,
              website: true,
              type: true,
            },
          },
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      orderedBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
      doneBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      testDate: "desc",
    },
  });
}

export async function getPathologyPatientById(id: number) {
  return await prisma.pathologyTest.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          hospital: true,
        },
      },
      department: true,
      orderedBy: {
        select: {
          fullName: true,
        },
      },
      doneBy: {
        select: {
          fullName: true,
        },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// MUTATION SERVICES WITH PAYMENT TRACKING
// ═══════════════════════════════════════════════════════════════

export async function createPathologyPatient(
  patientData: PatientData,
  hospitalData: HospitalData,
  guardianData: GuardianData,
  pathologyData: PathologyData,
  staffId: number,
  userId: number,
  shiftId: number | null // Current active shift for cash tracking
) {
  return await prisma.$transaction(async (tx) => {
    // 2. Get or create Pathology department
    let department = await tx.department.findFirst({
      where: { name: "Pathology" },
    });

    if (!department) {
      department = await tx.department.create({
        data: {
          name: "Pathology",
          description: "Pathology and Laboratory Services",
          isActive: true,
        },
      });
    }

    // 2.5 Handle Hospital - Find existing, create new, or use provided ID
    let hospitalId: number | null = hospitalData.id || null;

    const cleanHospitalName = hospitalData.name?.trim();

    if (!hospitalId && cleanHospitalName) {
      // Try to find by name first to avoid duplicates
      const existingHospital = await tx.hospital.findFirst({
        where: { name: { equals: cleanHospitalName, mode: "insensitive" } },
      });

      if (existingHospital) {
        hospitalId = existingHospital.id;
      } else {
        // Create new hospital
        const newHospital = await tx.hospital.create({
          data: {
            name: cleanHospitalName,
            address: hospitalData.address,
            phoneNumber: hospitalData.phoneNumber,
            email: hospitalData.email,
            website: hospitalData.website,
            type: hospitalData.type,
            isActive: true,
            createdBy: staffId,
          },
        });
        hospitalId = newHospital.id;
      }
    }

    // 1. Create or update patient
    let patient;
    if (patientData.id) {
      patient = await tx.patient.update({
        where: { id: patientData.id },
        data: {
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          fullName: patientData.fullName,
          gender: patientData.gender,
          dateOfBirth: patientData.dateOfBirth,
          guardianName: guardianData.name,
          address: patientData.address,
          phoneNumber: patientData.phoneNumber,
          email: patientData.email,
          bloodGroup: patientData.bloodGroup,
          guardianDOB: guardianData.dateOfBirth,
          guardianGender: guardianData.gender,
          hospitalId: hospitalId, // Link hospital
        },
      });
    } else {
      patient = await tx.patient.create({
        data: {
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          fullName: patientData.fullName,
          gender: patientData.gender,
          dateOfBirth: patientData.dateOfBirth,
          guardianName: guardianData.name,
          address: patientData.address,
          phoneNumber: patientData.phoneNumber,
          email: patientData.email,
          bloodGroup: patientData.bloodGroup,
          guardianDOB: guardianData.dateOfBirth,
          guardianGender: guardianData.gender,
          hospitalId: hospitalId, // Link hospital
          createdBy: staffId,
        },
      });
    }

    // 3. Generate unique test number
    const testCount = await tx.pathologyTest.count();
    const testNumber = `PATH-${Date.now()}-${testCount + 1}`;

    // 4. Validate orderedById - required field, must be provided from frontend
    if (!pathologyData.orderedById) {
      throw new Error("Ordering doctor/self is required for pathology tests");
    }
    const finalOrderedById = pathologyData.orderedById;

    // 5. Create pathology test record
    const pathologyTest = await tx.pathologyTest.create({
      data: {
        patientId: patient.id,
        departmentId: department.id,
        testNumber,
        testDate: new Date(),
        testCategory: "Multiple Tests", // Can be refined based on selected tests
        testResults: {
          tests: pathologyData.selectedTests,
        }, // Store selected test codes
        remarks: pathologyData.remarks,
        isCompleted: pathologyData.isCompleted,
        testCharge: pathologyData.testCharge,
        discountAmount: pathologyData.discountAmount,
        grandTotal: pathologyData.grandTotal,
        paidAmount: pathologyData.paidAmount,
        dueAmount: pathologyData.dueAmount,
        orderedById: finalOrderedById,
        doneById: pathologyData.doneById ?? undefined,
        createdBy: staffId,
        lastModifiedBy: staffId,
      },
    });

    // 6. Create patient account if doesn't exist
    let patientAccount = await tx.patientAccount.findUnique({
      where: { patientId: patient.id },
    });

    if (!patientAccount) {
      patientAccount = await tx.patientAccount.create({
        data: {
          patientId: patient.id,
          totalCharges: pathologyData.grandTotal,
          totalPaid: pathologyData.paidAmount,
          totalDue: pathologyData.dueAmount,
        },
      });
    } else {
      // Update existing account
      patientAccount = await tx.patientAccount.update({
        where: { id: patientAccount.id },
        data: {
          totalCharges: { increment: pathologyData.grandTotal },
          totalPaid: { increment: pathologyData.paidAmount },
          totalDue: { increment: pathologyData.dueAmount },
        },
      });
    }

    // 7. Create service charge record
    const serviceCharge = await tx.serviceCharge.create({
      data: {
        patientAccountId: patientAccount.id,
        serviceType: "PATHOLOGY_TEST",
        serviceName: `Pathology Tests - ${testNumber}`,
        departmentId: department.id,
        originalAmount: pathologyData.testCharge,
        discountAmount: pathologyData.discountAmount,
        finalAmount: pathologyData.grandTotal,
        pathologyTestId: pathologyTest.id,
        createdBy: staffId,
      },
    });

    // 8. Record initial payment if any
    if (pathologyData.paidAmount > 0 && shiftId) {
      // Generate unique receipt number
      const paymentCount = await tx.payment.count();
      const receiptNumber = `RCP-${Date.now()}-${paymentCount + 1}`;

      const payment = await tx.payment.create({
        data: {
          patientAccountId: patientAccount.id,
          amount: pathologyData.paidAmount,
          paymentMethod: "Cash", // Default to cash
          collectedById: staffId,
          shiftId: shiftId,
          receiptNumber,
          notes: `Initial payment for pathology test ${testNumber}`,
        },
      });

      // Track payment allocation
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          serviceChargeId: serviceCharge.id,
          allocatedAmount: pathologyData.paidAmount,
        },
      });

      // Track cash movement for shift
      await tx.cashMovement.create({
        data: {
          shiftId: shiftId,
          amount: pathologyData.paidAmount,
          movementType: "PAYMENT_RECEIVED",
          description: `Pathology test payment - ${testNumber}`,
          paymentId: payment.id,
        },
      });
    }

    // 9. Log activity for audit trail
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Created pathology test ${testNumber} for ${patient.fullName}. Total: BDT ${pathologyData.grandTotal}, Paid: BDT ${pathologyData.paidAmount}, Due: BDT ${pathologyData.dueAmount}`,
        entityType: "PathologyTest",
        entityId: pathologyTest.id,
        timestamp: new Date(),
      },
    });

    return {
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        isNew: !patientData.id,
      },
      pathologyTest: {
        id: pathologyTest.id,
        testNumber: pathologyTest.testNumber,
      },
      displayId: testNumber,
    };
  });
}

export async function updatePathologyPatient(
  id: number,
  patientData: PatientData,
  hospitalData: HospitalData,
  guardianData: GuardianData,
  pathologyData: PathologyData,
  staffId: number,
  userId: number
) {
  return await prisma.$transaction(async (tx) => {
    // Check if record exists
    const existingRecord = await tx.pathologyTest.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingRecord) {
      throw new Error("Pathology test record not found");
    }

    // 1. Update patient
    const updatedPatient = await tx.patient.update({
      where: { id: existingRecord.patientId },
      data: {
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        fullName: patientData.fullName,
        gender: patientData.gender,
        dateOfBirth: patientData.dateOfBirth,
        guardianName: guardianData.name,
        address: patientData.address,
        phoneNumber: patientData.phoneNumber,
        email: patientData.email,
        bloodGroup: patientData.bloodGroup,
        guardianDOB: guardianData.dateOfBirth,
        guardianGender: guardianData.gender,
      },
    });

    // 2. Calculate payment difference for updating totals
    const oldGrandTotal = Number(existingRecord.grandTotal);
    const oldPaidAmount = Number(existingRecord.paidAmount);
    const oldDueAmount = Number(existingRecord.dueAmount);

    const grandTotalDiff = pathologyData.grandTotal - oldGrandTotal;
    const paidAmountDiff = pathologyData.paidAmount - oldPaidAmount;
    const dueAmountDiff = pathologyData.dueAmount - oldDueAmount;

    // 3. Determine orderedById - use orderedById if provided, otherwise keep existing
    const finalOrderedById =
      pathologyData.orderedById ?? existingRecord.orderedById;

    // 4. Update pathology test record
    const updatedRecord = await tx.pathologyTest.update({
      where: { id },
      data: {
        testResults: {
          tests: pathologyData.selectedTests,
        },
        remarks: pathologyData.remarks,
        isCompleted: pathologyData.isCompleted,
        testCharge: pathologyData.testCharge,
        discountAmount: pathologyData.discountAmount,
        grandTotal: pathologyData.grandTotal,
        paidAmount: pathologyData.paidAmount,
        dueAmount: pathologyData.dueAmount,
        orderedById: finalOrderedById,
        doneById: pathologyData.doneById ?? undefined,
        lastModifiedBy: staffId,
      },
    });

    // 5. Update patient account totals
    const patientAccount = await tx.patientAccount.findUnique({
      where: { patientId: updatedPatient.id },
    });

    if (patientAccount) {
      await tx.patientAccount.update({
        where: { id: patientAccount.id },
        data: {
          totalCharges: { increment: grandTotalDiff },
          totalPaid: { increment: paidAmountDiff },
          totalDue: { increment: dueAmountDiff },
        },
      });
    }

    // 6. Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated pathology test ${existingRecord.testNumber} for ${updatedPatient.fullName}`,
        entityType: "PathologyTest",
        entityId: updatedRecord.id,
        timestamp: new Date(),
      },
    });

    return {
      id: updatedRecord.id,
      patient: {
        id: updatedPatient.id,
        fullName: updatedPatient.fullName,
      },
      testNumber: updatedRecord.testNumber,
    };
  });
}

export async function deletePathologyPatient(id: number, userId: number) {
  return await prisma.$transaction(async (tx) => {
    const existingRecord = await tx.pathologyTest.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingRecord) {
      throw new Error("Pathology test record not found");
    }

    await tx.pathologyTest.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        description: `Deleted pathology test ${existingRecord.testNumber} for ${existingRecord.patient.fullName}`,
        entityType: "PathologyTest",
        entityId: id,
        timestamp: new Date(),
      },
    });
  });
}
