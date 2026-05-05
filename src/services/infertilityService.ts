/**
 * Infertility Patient Service Layer
 * Business logic for infertility patient management
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  formatRegistrationNumber,
  getTwoDigitYear,
} from "@/lib/registrationNumber";
import { SessionDeviceInfo } from "@/types/auth";


// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

// Context for activity logging with device info
export interface ActivityLogContext {
  sessionId?: string;
  deviceInfo?: SessionDeviceInfo;
}

export interface InfertilityFilters {
  status?: string;
  hospitalId?: number;
  infertilityType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  // Pagination params
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
  occupation: string; // Patient's occupation
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

export interface SpouseData {
  name: string;
  age: number | null;
  dateOfBirth: Date | null;
  gender: string;
  occupation: string; // Spouse occupation
  phoneNumber?: string;
  email?: string;
}

export interface MedicalData {
  yearsMarried: number | null;
  yearsTrying: number | null;
  infertilityType: string;
  para: string;
  gravida: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodPressure: string;
  medicalHistory: string;
  surgicalHistory: string;
  menstrualHistory: string;
  contraceptiveHistory: string;
  referralSource: string;
  chiefComplaint: string;
  treatmentPlan: string;
  medications: string;
  nextAppointment: Date | null;
  status: string;
  notes: string;
}

// ═══════════════════════════════════════════════════════════════
// QUERY SERVICES
// ═══════════════════════════════════════════════════════════════

export async function getInfertilityPatients(filters: InfertilityFilters) {
  const where: Prisma.InfertilityPatientWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.hospitalId) {
    where.hospitalId = filters.hospitalId;
  }

  if (filters.infertilityType) {
    where.infertilityType = filters.infertilityType;
  }

  // Search filter - search by patient name or phone number
  if (filters.search) {
    where.patient = {
      OR: [
        { fullName: { contains: filters.search, mode: "insensitive" } },
        { phoneNumber: { contains: filters.search } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ],
    };
  }

  // Date range filter - filter by createdAt
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lt = new Date(filters.endDate);
    }
  }

  // Pagination defaults
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 15;
  const skip = (page - 1) * limit;

  // Execute count and data queries in parallel
  const [total, data] = await Promise.all([
    prisma.infertilityPatient.count({ where }),
    prisma.infertilityPatient.findMany({
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
            guardianOccupation: true,
            guardianPhone: true,
            guardianEmail: true,
            address: true,
            bloodGroup: true,
            occupation: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            phoneNumber: true,
            email: true,
            website: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getInfertilityPatientById(id: number) {
  return await prisma.infertilityPatient.findUnique({
    where: { id },
    include: {
      patient: true,
      hospital: true,
      createdByStaff: {
        select: {
          fullName: true,
        },
      },
      modifiedByStaff: {
        select: {
          fullName: true,
        },
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// MUTATION SERVICES
// ═══════════════════════════════════════════════════════════════

export async function createInfertilityPatient(
  patientData: PatientData,
  hospitalData: HospitalData,
  spouseData: SpouseData,
  medicalData: MedicalData,
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create or get hospital (moved to start to link with patient)
    let hospital;
    if (hospitalData.id) {
      hospital = await tx.hospital.findUnique({
        where: { id: hospitalData.id },
      });
      if (!hospital) throw new Error("Hospital not found");
    } else {
      hospital = await tx.hospital.findUnique({
        where: { name: hospitalData.name },
      });

      if (!hospital) {
        hospital = await tx.hospital.create({
          data: {
            name: hospitalData.name,
            address: hospitalData.address,
            phoneNumber: hospitalData.phoneNumber,
            email: hospitalData.email,
            website: hospitalData.website,
            type: hospitalData.type,
            createdBy: staffId,
          },
        });
      }
    }

    // 2. Create or update patient
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
          guardianName: patientData.guardianName,
          address: patientData.address,
          phoneNumber: patientData.phoneNumber,
          email: patientData.email,
          bloodGroup: patientData.bloodGroup,
          occupation: patientData.occupation,
          guardianDOB: spouseData.dateOfBirth, // For infertility, guardian = spouse
          guardianGender: spouseData.gender,
          guardianOccupation: spouseData.occupation,
          guardianPhone: spouseData.phoneNumber,
          guardianEmail: spouseData.email,
          guardianAddress: patientData.address,
          hospitalId: hospital.id, // Update hospital link
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
          guardianName: patientData.guardianName,
          address: patientData.address,
          phoneNumber: patientData.phoneNumber,
          email: patientData.email,
          bloodGroup: patientData.bloodGroup,
          occupation: patientData.occupation,
          guardianDOB: spouseData.dateOfBirth, // For infertility, guardian = spouse
          guardianGender: spouseData.gender,
          guardianOccupation: spouseData.occupation,
          guardianPhone: spouseData.phoneNumber,
          guardianEmail: spouseData.email,
          guardianAddress: patientData.address,
          hospitalId: hospital.id, // Link hospital
          createdBy: staffId,
        },
      });
    }

    // 3. Generate unique case number (format: INF-YY-XXXXX, e.g., INF-25-00001)
    const currentYear = getTwoDigitYear();
    const yearStart = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
    const yearEnd = new Date(new Date().getFullYear() + 1, 0, 1); // Jan 1 of next year

    // Count infertility cases in the current year
    const countThisYear = await tx.infertilityPatient.count({
      where: {
        createdAt: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    });

    const caseNumber = formatRegistrationNumber(
      "INF",
      currentYear,
      countThisYear + 1,
    );

    // 4. Create infertility record
    // First, check if a record already exists for this patient at this hospital
    const existingInfertilityRecord = await tx.infertilityPatient.findUnique({
      where: {
        patientId_hospitalId: {
          patientId: patient.id,
          hospitalId: hospital.id,
        },
      },
    });

    if (existingInfertilityRecord) {
      throw new Error(
        `This patient already has an active HSI Center record at ${hospital.name}. Please edit the existing record instead of creating a new one.`,
      );
    }

    const infertilityRecord = await tx.infertilityPatient.create({
      data: {
        caseNumber, // Generated case number: INF-YYMMDD-XXXX
        patientId: patient.id,
        hospitalId: hospital.id,
        yearsMarried: medicalData.yearsMarried,
        yearsTrying: medicalData.yearsTrying,
        infertilityType: medicalData.infertilityType,
        para: medicalData.para,
        gravida: medicalData.gravida,
        weight: medicalData.weight,
        height: medicalData.height,
        bmi: medicalData.bmi,
        bloodPressure: medicalData.bloodPressure,
        bloodGroup: patientData.bloodGroup,
        medicalHistory: medicalData.medicalHistory,
        surgicalHistory: medicalData.surgicalHistory,
        menstrualHistory: medicalData.menstrualHistory,
        contraceptiveHistory: medicalData.contraceptiveHistory,
        referralSource: medicalData.referralSource,
        chiefComplaint: medicalData.chiefComplaint,
        treatmentPlan: medicalData.treatmentPlan,
        medications: medicalData.medications,
        nextAppointment: medicalData.nextAppointment,
        status: medicalData.status,
        notes: medicalData.notes,
        createdBy: staffId,
      },
    });

    // 5. Log activity with device info
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Created HSI Center patient record ${caseNumber} for ${patient.fullName} at ${hospital.name}`,
        entityType: "InfertilityPatient",
        entityId: infertilityRecord.id,
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
      hospital: {
        id: hospital.id,
        name: hospital.name,
        isNew: !hospitalData.id,
      },
      infertilityRecord: {
        id: infertilityRecord.id,
        caseNumber: infertilityRecord.caseNumber,
      },
      displayId: caseNumber,
    };
  });
}

export async function updateInfertilityPatient(
  id: number,
  patientData: PatientData,
  hospitalData: HospitalData,
  spouseData: SpouseData,
  medicalData: MedicalData,
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    // Check if record exists
    const existingRecord = await tx.infertilityPatient.findUnique({
      where: { id },
      include: { patient: true, hospital: true },
    });

    if (!existingRecord) {
      throw new Error("HSI Center patient record not found");
    }

    // 1. Update or create hospital (moved to start)
    let hospital;
    if (hospitalData.id && hospitalData.id === existingRecord.hospitalId) {
      hospital = await tx.hospital.update({
        where: { id: hospitalData.id },
        data: {
          name: hospitalData.name,
          address: hospitalData.address,
          phoneNumber: hospitalData.phoneNumber,
          email: hospitalData.email,
          website: hospitalData.website,
          type: hospitalData.type,
        },
      });
    } else {
      hospital = await tx.hospital.findUnique({
        where: { name: hospitalData.name },
      });

      if (!hospital) {
        hospital = await tx.hospital.create({
          data: {
            name: hospitalData.name,
            address: hospitalData.address,
            phoneNumber: hospitalData.phoneNumber,
            email: hospitalData.email,
            website: hospitalData.website,
            type: hospitalData.type,
            createdBy: staffId,
          },
        });
      }
    }

    // 1.5. If hospital changed, check for record collision at the new hospital
    if (hospital.id !== existingRecord.hospitalId) {
      const collisionRecord = await tx.infertilityPatient.findUnique({
        where: {
          patientId_hospitalId: {
            patientId: existingRecord.patientId,
            hospitalId: hospital.id,
          },
        },
      });

      if (collisionRecord) {
        throw new Error(
          `This patient already has an HSI Center record at ${hospital.name}. You cannot move this record to that hospital.`,
        );
      }
    }

    // 2. Update patient
    const updatedPatient = await tx.patient.update({
      where: { id: existingRecord.patientId },
      data: {
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        fullName: patientData.fullName,
        gender: patientData.gender,
        dateOfBirth: patientData.dateOfBirth,
        guardianName: patientData.guardianName,
        address: patientData.address,
        phoneNumber: patientData.phoneNumber,
        email: patientData.email,
        bloodGroup: patientData.bloodGroup,
        occupation: patientData.occupation,
        guardianDOB: spouseData.dateOfBirth,
        guardianGender: spouseData.gender,
        guardianOccupation: spouseData.occupation,
        guardianPhone: spouseData.phoneNumber,
        guardianEmail: spouseData.email,
        guardianAddress: patientData.address,
        hospitalId: hospital.id, // Update hospital link
      },
    });

    // 3. Update infertility record
    const updatedRecord = await tx.infertilityPatient.update({
      where: { id },
      data: {
        hospitalId: hospital.id,
        yearsMarried: medicalData.yearsMarried,
        yearsTrying: medicalData.yearsTrying,
        infertilityType: medicalData.infertilityType,
        para: medicalData.para,
        gravida: medicalData.gravida,
        weight: medicalData.weight,
        height: medicalData.height,
        bmi: medicalData.bmi,
        bloodPressure: medicalData.bloodPressure,
        bloodGroup: patientData.bloodGroup,
        medicalHistory: medicalData.medicalHistory,
        surgicalHistory: medicalData.surgicalHistory,
        menstrualHistory: medicalData.menstrualHistory,
        contraceptiveHistory: medicalData.contraceptiveHistory,
        referralSource: medicalData.referralSource,
        chiefComplaint: medicalData.chiefComplaint,
        treatmentPlan: medicalData.treatmentPlan,
        medications: medicalData.medications,
        nextAppointment: medicalData.nextAppointment,
        status: medicalData.status,
        notes: medicalData.notes,
        lastModifiedBy: staffId,
      },
    });

    // 4. Log activity with device info
    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated HSI Center patient record for ${updatedPatient.fullName} at ${hospital.name}`,
        entityType: "InfertilityPatient",
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
      displayId: updatedRecord.caseNumber,
    };
  });
}

export async function deleteInfertilityPatient(
  id: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    const existingRecord = await tx.infertilityPatient.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingRecord) {
      throw new Error("HSI Center patient record not found");
    }

    await tx.infertilityPatient.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        description: `Deleted HSI Center patient record for ${existingRecord.patient.fullName}`,
        entityType: "InfertilityPatient",
        entityId: id,
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
  });
}

export async function updateInfertilityPatientStatus(
  id: number,
  status: string,
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    const existingRecord = await tx.infertilityPatient.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingRecord) {
      throw new Error("HSI Center patient record not found");
    }

    const updatedRecord = await tx.infertilityPatient.update({
      where: { id },
      data: {
        status,
        lastModifiedBy: staffId,
      },
      select: {
        id: true,
        caseNumber: true,
        status: true,
      },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated HSI Center patient ${existingRecord.caseNumber} (${existingRecord.patient.fullName}) status from "${existingRecord.status || "Unknown"}" to "${status}"`,
        entityType: "InfertilityPatient",
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

    return updatedRecord;
  });
}


// ═══════════════════════════════════════════════════════════════
// INFERTILITY TEST SERVICES
// ═══════════════════════════════════════════════════════════════

export interface InfertilityTestFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: "Completed" | "Pending" | "All";
  orderedById?: number;
  doneById?: number;
  testNames?: string[];
  infertilityPatientId?: number;
  page?: number;
  limit?: number;
}

export interface InfertilityTestData {
  infertilityPatientId: number;
  selectedTests: string[];
  testCharge: number;
  discountType?: "percentage" | "value" | null;
  discountValue?: number | null;
  discountAmount?: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  orderedById: number;
  doneById?: number | null;
  remarks?: string;
  testDate?: string;
  isCompleted?: boolean;
}

export async function getInfertilityTests(filters: InfertilityTestFilters) {
  const where: Prisma.InfertilityTestWhereInput = {};

  if (filters.infertilityPatientId) {
    where.infertilityPatientId = filters.infertilityPatientId;
  }

  // Search filter
  if (filters.search) {
    if (!where.AND) where.AND = [];
    (where.AND as Prisma.InfertilityTestWhereInput[]).push({
      OR: [
        {
          patient: {
            OR: [
              { fullName: { contains: filters.search, mode: "insensitive" } },
              { phoneNumber: { contains: filters.search } },
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
    (where.AND as Prisma.InfertilityTestWhereInput[]).push({
      OR: filters.testNames.map((name) => ({
        testResults: {
          path: ["tests"],
          array_contains: [name],
        },
      })),
    });
  }

  // Date range filter
  if (filters.startDate || filters.endDate) {
    where.testDate = {};
    if (filters.startDate) {
      where.testDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.testDate.lt = new Date(filters.endDate);
    }
  }

  // Completion status filter
  if (filters.status && filters.status !== "All") {
    where.isCompleted = filters.status === "Completed";
  }

  // Doctor/Staff filters
  if (filters.orderedById) {
    where.orderedById = filters.orderedById;
  }
  if (filters.doneById) {
    where.doneById = filters.doneById;
  }

  // Pagination defaults
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 15;
  const skip = (page - 1) * limit;

  // Execute count and data queries in parallel
  const [total, data] = await Promise.all([
    prisma.infertilityTest.count({ where }),
    prisma.infertilityTest.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            dateOfBirth: true,
            phoneNumber: true,
          },
        },
        infertilityPatient: {
          select: {
            id: true,
            caseNumber: true,
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
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getInfertilityTestById(id: number) {
  return await prisma.infertilityTest.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          gender: true,
          dateOfBirth: true,
          phoneNumber: true,
        },
      },
      infertilityPatient: {
        select: {
          id: true,
          caseNumber: true,
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
  });
}

export async function createInfertilityTest(
  testData: InfertilityTestData,
  staffId: number,
  userId: number,
  shiftId: number | null,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify infertility patient exists
    const infertilityPatient = await tx.infertilityPatient.findUnique({
      where: { id: testData.infertilityPatientId },
      include: { patient: true },
    });

    if (!infertilityPatient) {
      throw new Error("HSI Center patient record not found");
    }

    // 2. Generate test number: INFT-YY-XXXXX
    const currentYear = getTwoDigitYear();
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const yearEnd = new Date(new Date().getFullYear() + 1, 0, 1);

    const countThisYear = await tx.infertilityTest.count({
      where: {
        testDate: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    });

    const testNumber = formatRegistrationNumber(
      "INFT",
      currentYear,
      countThisYear + 1,
    );

    // Get Infertility Department ID (fallback to 1 if not explicitly created yet, or find by name)
    let department = await tx.department.findFirst({
      where: { OR: [{ name: "HSI Center" }, { name: "Gynecology" }] },
    });
    if (!department) {
      department = await tx.department.findFirst({
        where: { name: "Pathology" },
      }); // fallback
    }

    // 3. Create InfertilityTest record
    const infertilityTest = await tx.infertilityTest.create({
      data: {
        infertilityPatientId: infertilityPatient.id,
        patientId: infertilityPatient.patientId,
        testNumber,
        testDate: testData.testDate ? new Date(testData.testDate) : new Date(),
        testCategory: "Multiple Tests",
        testResults: {
          tests: testData.selectedTests,
        },
        remarks: testData.remarks,
        isCompleted: testData.isCompleted || false,
        testCharge: testData.testCharge,
        discountType: testData.discountType,
        discountValue: testData.discountValue,
        discountAmount: testData.discountAmount,
        grandTotal: testData.grandTotal,
        paidAmount: testData.paidAmount,
        dueAmount: testData.dueAmount,
        orderedById: testData.orderedById,
        doneById: testData.doneById,
        createdBy: staffId,
        lastModifiedBy: staffId,
      },
    });

    // 4. Update or create infertility-specific patient account
    let patientAccount = await tx.infertilityPatientAccount.findUnique({
      where: { patientId: infertilityPatient.patientId },
    });

    if (!patientAccount) {
      patientAccount = await tx.infertilityPatientAccount.create({
        data: {
          patientId: infertilityPatient.patientId,
          totalCharges: testData.grandTotal,
          totalPaid: testData.paidAmount,
          totalDue: testData.dueAmount,
        },
      });
    } else {
      patientAccount = await tx.infertilityPatientAccount.update({
        where: { id: patientAccount.id },
        data: {
          totalCharges: { increment: testData.grandTotal },
          totalPaid: { increment: testData.paidAmount },
          totalDue: { increment: testData.dueAmount },
        },
      });
    }

    // 5. Create InfertilityServiceCharge
    const serviceCharge = await tx.infertilityServiceCharge.create({
      data: {
        patientAccountId: patientAccount.id,
        serviceType: "INFERTILITY_TEST",
        serviceName: `HSI Center Investigation - ${testNumber}`,
        departmentId: department ? department.id : 1, // Fallback
        originalAmount: testData.testCharge,
        discountAmount: testData.discountAmount || 0,
        finalAmount: testData.grandTotal,
        infertilityTestId: infertilityTest.id,
        createdBy: staffId,
      },
    });

    // 6. Handle payments and shadow cash via infertility-only tables
    if (testData.paidAmount > 0) {
      const activeShift = shiftId
        ? { id: shiftId }
        : await tx.infertilityShift.findFirst({
            where: { staffId, isActive: true },
          }) ||
          await tx.infertilityShift.create({
            data: {
              staffId,
              startTime: new Date(),
              isActive: true,
              openingCash: 0,
              systemCash: 0,
              totalCollected: 0,
              totalRefunded: 0,
              closingCash: 0,
              variance: 0,
            },
          });

      const paymentCount = await tx.infertilityPayment.count();
      const receiptNumber = `RCP-INF-${Date.now()}-${paymentCount + 1}`;

      const payment = await tx.infertilityPayment.create({
        data: {
          patientAccountId: patientAccount.id,
          amount: testData.paidAmount,
          paymentMethod: "Cash",
          collectedById: staffId,
          shiftId: activeShift.id,
          receiptNumber,
          notes: `Payment for HSI Center test ${testNumber}`,
        },
      });

      await tx.infertilityPaymentAllocation.create({
        data: {
          paymentId: payment.id,
          serviceChargeId: serviceCharge.id,
          allocatedAmount: testData.paidAmount,
        },
      });

      await tx.infertilityCashMovement.create({
        data: {
          shiftId: activeShift.id,
          amount: testData.paidAmount,
          movementType: "PAYMENT_RECEIVED",
          description: `Infertility test payment - ${testNumber}`,
          paymentId: payment.id,
        },
      });

      await tx.infertilityShift.update({
        where: { id: activeShift.id },
        data: {
          systemCash: { increment: testData.paidAmount },
          totalCollected: { increment: testData.paidAmount },
        },
      });
    }

    // 7. Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Created infertility test ${testNumber} for ${infertilityPatient.patient.fullName}`,
        entityType: "InfertilityTest",
        entityId: infertilityTest.id,
        timestamp: new Date(),
        sessionId: activityLogContext?.sessionId,
        ipAddress: activityLogContext?.deviceInfo?.ipAddress,
        deviceFingerprint: activityLogContext?.deviceInfo?.deviceFingerprint,
        readableFingerprint: activityLogContext?.deviceInfo?.readableFingerprint,
        deviceType: activityLogContext?.deviceInfo?.deviceType,
        browserName: activityLogContext?.deviceInfo?.browserName,
        browserVersion: activityLogContext?.deviceInfo?.browserVersion,
        osType: activityLogContext?.deviceInfo?.osType,
      },
    });

    return {
      infertilityTest: {
        id: infertilityTest.id,
        testNumber: infertilityTest.testNumber,
      },
      displayId: testNumber,
    };
  });
}

export async function updateInfertilityTest(
  id: number,
  testData: Partial<InfertilityTestData>,
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    const existingTest = await tx.infertilityTest.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingTest) {
      throw new Error("HSI Center test not found");
    }

    const dataToUpdate: any = {
      lastModifiedBy: staffId,
    };

    if (testData.selectedTests) {
      dataToUpdate.testResults = { tests: testData.selectedTests };
    }
    if (testData.remarks !== undefined) dataToUpdate.remarks = testData.remarks;
    if (testData.isCompleted !== undefined) dataToUpdate.isCompleted = testData.isCompleted;
    if (testData.orderedById !== undefined) dataToUpdate.orderedById = testData.orderedById;
    if (testData.doneById !== undefined) dataToUpdate.doneById = testData.doneById;
    
    // For simplicity, we assume financial updates (changing tests after payment) are handled
    // through a separate process or this just updates the test details.
    
    const updatedTest = await tx.infertilityTest.update({
      where: { id },
      data: dataToUpdate,
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated infertility test ${existingTest.testNumber}`,
        entityType: "InfertilityTest",
        entityId: id,
        timestamp: new Date(),
        sessionId: activityLogContext?.sessionId,
        ipAddress: activityLogContext?.deviceInfo?.ipAddress,
      },
    });

    return updatedTest;
  });
}

export async function getInfertilityTestsForReport(
  filters: Omit<InfertilityTestFilters, "page" | "limit">
) {
  // Same as getInfertilityTests but without pagination
  const result = await getInfertilityTests({ ...filters, page: 1, limit: 10000 });
  return result.data;
}
