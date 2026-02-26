/**
 * Pathology Service Layer
 * Business logic for pathology patient management with payment tracking
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  formatRegistrationNumber,
  getTwoDigitYear,
} from "@/lib/registrationNumber";
import { SessionDeviceInfo } from "@/types/auth";
import { shiftService } from "@/services/shiftService";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

// Context for activity logging with device info
export interface ActivityLogContext {
  sessionId?: string;
  deviceInfo?: SessionDeviceInfo;
}

export interface PathologyFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
  testCategory?: string;
  testCategories?: string[]; // Multi-select categories
  testNames?: string[]; // Multi-select test names
  orderedById?: number; // Filter by ordering doctor
  doneById?: number; // Filter by performing staff
  page?: number;
  limit?: number;
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
  discountType: string | null;
  discountValue: number | null;
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
    if (!where.AND) where.AND = [];
    (where.AND as Prisma.PathologyTestWhereInput[]).push({
      OR: [
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
      ],
    });
  }

  // Test names filter (JSON check)
  if (filters.testNames && filters.testNames.length > 0) {
    if (!where.AND) where.AND = [];
    (where.AND as Prisma.PathologyTestWhereInput[]).push({
      OR: filters.testNames.map((name) => ({
        testResults: {
          path: ["tests"],
          array_contains: [name],
        },
      })),
    });
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

  // Test category filters (multi-select takes priority)
  if (filters.testCategories && filters.testCategories.length > 0) {
    where.testCategory = { in: filters.testCategories };
  } else if (filters.testCategory) {
    where.testCategory = filters.testCategory;
  }

  // Doctor/Staff filters
  if (filters.orderedById) {
    where.orderedById = filters.orderedById;
  }

  if (filters.doneById) {
    where.doneById = filters.doneById;
  }

  // Pagination defaults
  const page = filters.page || 1;
  const limit = filters.limit || 15;
  const skip = (page - 1) * limit;

  // Get total count for pagination
  const total = await prisma.pathologyTest.count({ where });

  const data = await prisma.pathologyTest.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
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
    skip,
    take: limit,
  });

  const staffIds = Array.from(
    new Set(
      data
        .flatMap((row) => [row.createdBy, row.lastModifiedBy])
        .filter(Boolean),
    ),
  );

  const staffList = staffIds.length
    ? await prisma.staff.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, fullName: true },
      })
    : [];

  const staffNameMap = new Map(
    staffList.map((staff) => [staff.id, staff.fullName]),
  );

  const enrichedData = data.map((row) => ({
    ...row,
    createdByName: staffNameMap.get(row.createdBy) || null,
    lastModifiedByName: staffNameMap.get(row.lastModifiedBy) || null,
  }));

  return {
    data: enrichedData,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
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
  shiftId: number | null, // Current active shift for cash tracking
  activityLogContext?: ActivityLogContext, // Session device info for activity logging
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

    // 2.5 Use default hospital ID 1 (FNH Hospital)
    const hospitalId = 1;

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

    // 3. Generate unique test number (format: PATH-YY-XXXXX, e.g., PATH-25-00001)
    const currentYear = getTwoDigitYear();
    const yearStart = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
    const yearEnd = new Date(new Date().getFullYear() + 1, 0, 1); // Jan 1 of next year

    // Count pathology tests in the current year
    const countThisYear = await tx.pathologyTest.count({
      where: {
        testDate: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    });

    const testNumber = formatRegistrationNumber(
      "PATH",
      currentYear,
      countThisYear + 1,
    );

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

        discountType: pathologyData.discountType,
        discountValue: pathologyData.discountValue,
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
    if (pathologyData.paidAmount > 0) {
      // Always ensure a shift exists so payments are never silently lost
      const activeShift = shiftId
        ? { id: shiftId }
        : await shiftService.ensureActiveShift(staffId, tx);

      // Generate unique receipt number
      const paymentCount = await tx.payment.count();
      const receiptNumber = `RCP-${Date.now()}-${paymentCount + 1}`;

      const payment = await tx.payment.create({
        data: {
          patientAccountId: patientAccount.id,
          amount: pathologyData.paidAmount,
          paymentMethod: "Cash", // Default to cash
          collectedById: staffId,
          shiftId: activeShift.id,
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
          shiftId: activeShift.id,
          amount: pathologyData.paidAmount,
          movementType: "COLLECTION",
          description: `Pathology test payment - ${testNumber}`,
          paymentId: payment.id,
        },
      });

      // Update shift totals
      await tx.shift.update({
        where: { id: activeShift.id },
        data: {
          systemCash: { increment: pathologyData.paidAmount },
          totalCollected: { increment: pathologyData.paidAmount },
        },
      });
    }

    // 9. Log activity for audit trail with device info
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Created pathology test ${testNumber} for ${patient.fullName}. Total: BDT ${pathologyData.grandTotal}, Paid: BDT ${pathologyData.paidAmount}, Due: BDT ${pathologyData.dueAmount}`,
        entityType: "PathologyTest",
        entityId: pathologyTest.id,
        timestamp: new Date(),
        // Device info from session for accountability
        sessionId: activityLogContext?.sessionId,
        ipAddress: activityLogContext?.deviceInfo?.ipAddress,
        deviceFingerprint: activityLogContext?.deviceInfo?.deviceFingerprint,
        readableFingerprint:
          activityLogContext?.deviceInfo?.readableFingerprint,
        deviceType: activityLogContext?.deviceInfo?.deviceType,
        browserName: activityLogContext?.deviceInfo?.browserName,
        browserVersion: activityLogContext?.deviceInfo?.browserVersion,
        osType: activityLogContext?.deviceInfo?.osType,
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
  userId: number,
  shiftId: number | null,
  activityLogContext?: ActivityLogContext,
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

        discountType: pathologyData.discountType,
        discountValue: pathologyData.discountValue,
        discountAmount: pathologyData.discountAmount,
        grandTotal: pathologyData.grandTotal,
        paidAmount: pathologyData.paidAmount,
        dueAmount: pathologyData.dueAmount,
        orderedById: finalOrderedById,
        doneById: pathologyData.doneById ?? undefined,
        lastModifiedBy: staffId,
      },
    });

    // Update ServiceCharge to reflect edited amounts
    await tx.serviceCharge.updateMany({
      where: { pathologyTestId: id },
      data: {
        originalAmount: pathologyData.testCharge,
        discountAmount: pathologyData.discountAmount,
        finalAmount: pathologyData.grandTotal,
      },
    });

    // 4.5 Handle financial updates (Payments & Refunds)
    if (paidAmountDiff !== 0) {
      // Always ensure a shift exists so payments are never silently lost
      const activeShift = shiftId
        ? { id: shiftId }
        : await shiftService.ensureActiveShift(staffId, tx);

      // Find the existing service charge for this pathology test
      const existingServiceCharge = await tx.serviceCharge.findFirst({
        where: { pathologyTestId: id },
      });

      if (paidAmountDiff > 0) {
        // ADDITIONAL COLLECTION
        // First, we need to get the correct patientAccountId (NOT patientId)
        const patientAccountForPayment = await tx.patientAccount.findUnique({
          where: { patientId: existingRecord.patientId },
        });

        if (!patientAccountForPayment) {
          throw new Error("Patient account not found for payment recording");
        }

        // Generate receipt number
        const paymentCount = await tx.payment.count();
        const receiptNumber = `RCP-${Date.now()}-${paymentCount + 1}`;

        const payment = await tx.payment.create({
          data: {
            patientAccountId: patientAccountForPayment.id, // Use the correct PatientAccount ID
            amount: new Prisma.Decimal(paidAmountDiff),
            paymentMethod: "Cash",
            collectedById: staffId,
            shiftId: activeShift.id,
            receiptNumber,
            notes: `Additional payment for pathology test ${existingRecord.testNumber}`,
          },
        });

        // Create PaymentAllocation to link payment to service charge for department tracking
        if (existingServiceCharge) {
          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              serviceChargeId: existingServiceCharge.id,
              allocatedAmount: new Prisma.Decimal(paidAmountDiff),
            },
          });
        }

        // Track cash movement
        await tx.cashMovement.create({
          data: {
            shiftId: activeShift.id,
            amount: new Prisma.Decimal(paidAmountDiff),
            movementType: "COLLECTION",
            description: `Additional collection for ${existingRecord.testNumber}`,
            paymentId: payment.id,
          },
        });

        // Update shift
        await tx.shift.update({
          where: { id: activeShift.id },
          data: {
            systemCash: { increment: paidAmountDiff },
            totalCollected: { increment: paidAmountDiff },
          },
        });
      } else {
        // REFUND / CORRECTION (Negative diff)
        const refundAmount = Math.abs(paidAmountDiff);

        // Track cash movement (Refund)
        await tx.cashMovement.create({
          data: {
            shiftId: activeShift.id,
            amount: new Prisma.Decimal(refundAmount),
            movementType: "REFUND",
            description: `Refund/Correction for ${existingRecord.testNumber}`,
          },
        });

        // Update shift
        await tx.shift.update({
          where: { id: activeShift.id },
          data: {
            systemCash: { decrement: refundAmount },
            totalRefunded: { increment: refundAmount },
          },
        });
      }
    }

    // 5. Update patient account totals

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

    // 6. Log activity with device info
    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated pathology test ${existingRecord.testNumber} for ${updatedPatient.fullName}`,
        entityType: "PathologyTest",
        entityId: updatedRecord.id,
        timestamp: new Date(),
        // Device info from session for accountability
        sessionId: activityLogContext?.sessionId,
        ipAddress: activityLogContext?.deviceInfo?.ipAddress,
        deviceFingerprint: activityLogContext?.deviceInfo?.deviceFingerprint,
        readableFingerprint:
          activityLogContext?.deviceInfo?.readableFingerprint,
        deviceType: activityLogContext?.deviceInfo?.deviceType,
        browserName: activityLogContext?.deviceInfo?.browserName,
        browserVersion: activityLogContext?.deviceInfo?.browserVersion,
        osType: activityLogContext?.deviceInfo?.osType,
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

export async function deletePathologyPatient(
  id: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    const existingRecord = await tx.pathologyTest.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingRecord) {
      throw new Error("Pathology test record not found");
    }

    // ── Reverse financial records before deleting ──

    // 1. Find all ServiceCharges linked to this pathology test
    const serviceCharges = await tx.serviceCharge.findMany({
      where: { pathologyTestId: id },
      select: { id: true, patientAccountId: true, finalAmount: true },
    });

    if (serviceCharges.length > 0) {
      const serviceChargeIds = serviceCharges.map((sc) => sc.id);

      // 2. Find all PaymentAllocations linked to these service charges
      const paymentAllocations = await tx.paymentAllocation.findMany({
        where: { serviceChargeId: { in: serviceChargeIds } },
        select: { id: true, paymentId: true, allocatedAmount: true },
      });

      // 3. Delete PaymentAllocations first
      if (paymentAllocations.length > 0) {
        await tx.paymentAllocation.deleteMany({
          where: { serviceChargeId: { in: serviceChargeIds } },
        });
      }

      // 4. Find all unique Payment IDs that were linked to this pathology test
      const paymentIds = [
        ...new Set(paymentAllocations.map((pa) => pa.paymentId)),
      ];

      if (paymentIds.length > 0) {
        // 5. For each payment, reverse the shift cash tracking
        const payments = await tx.payment.findMany({
          where: { id: { in: paymentIds } },
          select: { id: true, shiftId: true, amount: true },
        });

        for (const payment of payments) {
          await tx.shift.update({
            where: { id: payment.shiftId },
            data: {
              systemCash: { decrement: payment.amount },
              totalCollected: { decrement: payment.amount },
            },
          });
        }

        // 6. Delete CashMovements linked to these payments
        await tx.cashMovement.deleteMany({
          where: { paymentId: { in: paymentIds } },
        });

        // 7. Delete the Payments themselves
        await tx.payment.deleteMany({
          where: { id: { in: paymentIds } },
        });
      }

      // 8. Update PatientAccount totals
      const patientAccountId = serviceCharges[0].patientAccountId;
      const totalChargeAmount = serviceCharges.reduce(
        (sum, sc) => sum + Number(sc.finalAmount),
        0,
      );
      const totalPaidAmount = Number(existingRecord.paidAmount);

      await tx.patientAccount.update({
        where: { id: patientAccountId },
        data: {
          totalCharges: { decrement: totalChargeAmount },
          totalPaid: { decrement: totalPaidAmount },
          totalDue: { decrement: totalChargeAmount - totalPaidAmount },
        },
      });

      // 9. Delete ServiceCharges
      await tx.serviceCharge.deleteMany({
        where: { pathologyTestId: id },
      });
    }

    // 10. Delete the pathology test record
    await tx.pathologyTest.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        description: `Deleted pathology test ${existingRecord.testNumber} for ${existingRecord.patient.fullName} (financials reversed)`,
        entityType: "PathologyTest",
        entityId: id,
        timestamp: new Date(),
        sessionId: activityLogContext?.sessionId,
        ipAddress: activityLogContext?.deviceInfo?.ipAddress,
        deviceFingerprint: activityLogContext?.deviceInfo?.deviceFingerprint,
        readableFingerprint:
          activityLogContext?.deviceInfo?.readableFingerprint,
        deviceType: activityLogContext?.deviceInfo?.deviceType,
        browserName: activityLogContext?.deviceInfo?.browserName,
        browserVersion: activityLogContext?.deviceInfo?.browserVersion,
        osType: activityLogContext?.deviceInfo?.osType,
      },
    });
  });
}
