/**
 * Infertility Patient Service Layer
 * Business logic for infertility patient management
 */

import { prisma } from "@/lib/prisma";
import {
  InvestigationSubjectType,
  type Prisma,
} from "@prisma/client";
import {
  formatRegistrationNumber,
  getTwoDigitYear,
  parseRegistrationNumber,
} from "@/lib/registrationNumber";
import { SessionDeviceInfo } from "@/types/auth";
import { infertilityShiftService } from "@/services/infertilityShiftService";


// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

// Context for activity logging with device info
export interface ActivityLogContext {
  sessionId?: string;
  deviceInfo?: SessionDeviceInfo;
}

function normalizeIdentity(value: string | null | undefined): string {
  return (
    value
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(mr|mrs|ms|miss|md)\b/g, "")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function normalizePhone(value: string | null | undefined): string {
  return value?.replace(/\D/g, "") ?? "";
}

async function findPotentialSpouseCase(
  tx: Prisma.TransactionClient,
  hospitalId: number,
  patientData: PatientData,
) {
  const incomingName = normalizeIdentity(patientData.fullName);
  const incomingPhone = normalizePhone(patientData.phoneNumber);
  const incomingAddress = normalizeIdentity(patientData.address);
  const incomingGender = normalizeIdentity(patientData.gender);

  if (!incomingName || (incomingGender !== "male" && !incomingPhone)) {
    return null;
  }

  const existingCases = await tx.infertilityPatient.findMany({
    where: {
      hospitalId,
      mergedIntoId: null,
      patient: {
        gender: {
          equals: "Female",
          mode: "insensitive",
        },
      },
    },
    select: {
      id: true,
      caseNumber: true,
      patient: {
        select: {
          fullName: true,
          guardianName: true,
          guardianPhone: true,
          phoneNumber: true,
          address: true,
        },
      },
    },
  });

  return (
    existingCases.find((existingCase) => {
      const guardianNameMatches =
        normalizeIdentity(existingCase.patient.guardianName) === incomingName;
      const sameAddress =
        incomingAddress.length > 0 &&
        normalizeIdentity(existingCase.patient.address) === incomingAddress;
      const samePhone =
        incomingPhone.length > 0 &&
        (normalizePhone(existingCase.patient.guardianPhone) === incomingPhone ||
          normalizePhone(existingCase.patient.phoneNumber) === incomingPhone);

      return guardianNameMatches || (incomingGender === "male" && sameAddress && samePhone);
    }) ?? null
  );
}

async function getNextInfertilityCaseNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const currentYear = getTwoDigitYear();
  const sequenceRows = await tx.$queryRaw<{ lastSequence: number }[]>`
    INSERT INTO "InfertilityCaseNumberSequence" ("year", "lastSequence")
    VALUES (${Number(currentYear)}, 1)
    ON CONFLICT ("year") DO UPDATE
      SET "lastSequence" =
        "InfertilityCaseNumberSequence"."lastSequence" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "lastSequence"
  `;

  const nextSequence = Number(sequenceRows[0]?.lastSequence);

  if (!Number.isInteger(nextSequence) || nextSequence < 1) {
    throw new Error("Failed to allocate an infertility case number");
  }

  return formatRegistrationNumber(
    "INF",
    currentYear,
    nextSequence,
  );
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
  const where: Prisma.InfertilityPatientWhereInput = {
    mergedIntoId: null,
  };

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
  const [total, rows] = await Promise.all([
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
        _count: {
          select: {
            tests: {
              where: {
                isMigrationSuperseded: false,
              },
            },
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

  const data = rows.map((row) => ({
    ...row,
    createdByName: row.createdByStaff?.fullName ?? null,
    lastModifiedByName: row.modifiedByStaff?.fullName ?? null,
  }));

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
    where: { id, mergedIntoId: null },
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

    const potentialSpouseCase = await findPotentialSpouseCase(
      tx,
      hospital.id,
      patientData,
    );

    if (potentialSpouseCase) {
      throw new Error(
        `This person appears to be the spouse of the existing infertility patient in case ${potentialSpouseCase.caseNumber}. Edit that case and order a spouse investigation instead of creating another patient row.`,
      );
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

    // 3. Check if a record already exists for this patient at this hospital
    // before allocating a new case number.
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

    // 4. Generate a gap-safe, concurrency-safe case number.
    const caseNumber = await getNextInfertilityCaseNumber(tx);

    // 5. Create infertility record
    const infertilityRecord = await tx.infertilityPatient.create({
      data: {
        caseNumber, // Generated case number: INF-YY-XXXXX
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
        // A newly created case was also last touched by the creating staff
        // member. Keeping this populated makes the "last edited by" display
        // consistent with Pathology and General Admission.
        lastModifiedBy: staffId,
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

    if (existingRecord.mergedIntoId !== null) {
      throw new Error(
        "This HSI Center patient record has already been merged into another case.",
      );
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

    if (existingRecord.mergedIntoId !== null) {
      throw new Error(
        "This HSI Center patient record has already been merged into another case.",
      );
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

    if (existingRecord.mergedIntoId !== null) {
      throw new Error(
        "This HSI Center patient record has already been merged into another case.",
      );
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

type EditableInvestigationSubjectType = "PATIENT" | "SPOUSE";

export interface InfertilityTestData {
  infertilityPatientId: number;
  subjectType: EditableInvestigationSubjectType;
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
  remarks?: string | null;
  testDate?: string;
  isCompleted?: boolean;
  subjectNameSnapshot?: string | null;
}

export type InfertilityTestUpdateData = Partial<
  Omit<InfertilityTestData, "infertilityPatientId">
>;

interface SerializedTestResults {
  tests: string[];
}

async function getNextInfertilityTestNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const currentYear = getTwoDigitYear();
  const prefix = `INFT-${currentYear}-`;

  const latestTest = await tx.infertilityTest.findFirst({
    where: {
      testNumber: {
        startsWith: prefix,
      },
    },
    select: {
      testNumber: true,
    },
    orderBy: {
      testNumber: "desc",
    },
  });

  const latestSequence = latestTest
    ? parseRegistrationNumber(latestTest.testNumber)?.sequence ?? 0
    : 0;

  return formatRegistrationNumber("INFT", currentYear, latestSequence + 1);
}

interface FlattenedInfertilityTestRecord {
  id: number;
  infertilityPatientId: number;
  testNumber: string;
  caseNumber: string;
  patientFullName: string;
  patientGender: string;
  patientDOB: string | null;
  patientAge: number | null;
  patientFirstName: string | null;
  patientLastName: string | null;
  mobileNumber: string | null;
  email: string | null;
  address: string | null;
  bloodGroup: string | null;
  guardianName: string | null;
  guardianDOB: string | null;
  guardianGender: string | null;
  guardianAge: number | null;
  subjectType: InvestigationSubjectType;
  subjectLabel: string;
  subjectName: string | null;
  subjectNameSnapshot: string | null;
  hospitalName: string | null;
  hospitalType: string | null;
  hospitalAddress: string | null;
  hospitalPhone: string | null;
  hospitalWebsite: string | null;
  hospitalEmail: string | null;
  testDate: string;
  reportDate: string | null;
  testCategory: string;
  selectedTests: string[];
  testResults: SerializedTestResults;
  remarks: string | null;
  isCompleted: boolean;
  testCharge: number;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  orderedById: number;
  orderedBy: string | null;
  doneById: number | null;
  doneBy: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  createdByName: string | null;
  lastModifiedBy: number;
  lastModifiedByName: string | null;
  sourcePathologyTestId: number | null;
}

function parseSelectedTests(
  testResults: Prisma.JsonValue | null,
): string[] {
  if (
    !testResults ||
    typeof testResults !== "object" ||
    Array.isArray(testResults)
  ) {
    return [];
  }

  const maybeTests = testResults as { tests?: unknown; testNames?: unknown };

  if (Array.isArray(maybeTests.tests)) {
    return maybeTests.tests.filter(
      (value): value is string => typeof value === "string",
    );
  }

  if (Array.isArray(maybeTests.testNames)) {
    return maybeTests.testNames.filter(
      (value): value is string => typeof value === "string",
    );
  }

  return [];
}

function getAgeFromDateOfBirth(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function formatNullableDate(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function getSubjectName(
  subjectType: InvestigationSubjectType,
  patient: {
    fullName: string;
    guardianName: string | null;
  },
  subjectNameSnapshot: string | null,
): string | null {
  if (subjectType === InvestigationSubjectType.PATIENT) {
    return patient.fullName;
  }

  if (subjectType === InvestigationSubjectType.SPOUSE) {
    return subjectNameSnapshot || patient.guardianName;
  }

  return subjectNameSnapshot || patient.guardianName || patient.fullName;
}

function getSubjectLabel(subjectType: InvestigationSubjectType): string {
  switch (subjectType) {
    case InvestigationSubjectType.PATIENT:
      return "Patient";
    case InvestigationSubjectType.SPOUSE:
      return "Spouse";
    case InvestigationSubjectType.UNKNOWN:
      return "Invalid Legacy Subject";
    default:
      return "Patient";
  }
}

type InfertilityTestQueryRow = Prisma.InfertilityTestGetPayload<{
  include: {
    infertilityPatient: {
      include: {
        patient: true;
        hospital: true;
      };
    };
    orderedBy: {
      select: {
        id: true;
        fullName: true;
      };
    };
    doneBy: {
      select: {
        id: true;
        fullName: true;
      };
    };
  };
}>;

async function buildStaffNameMap(
  testRows: Array<{
    createdBy: number;
    lastModifiedBy: number;
  }>,
) {
  const staffIds = Array.from(
    new Set(
      testRows.flatMap((row) => [row.createdBy, row.lastModifiedBy]),
    ),
  );

  if (staffIds.length === 0) {
    return new Map<number, string>();
  }

  const staffList = await prisma.staff.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, fullName: true },
  });

  return new Map(staffList.map((staff) => [staff.id, staff.fullName]));
}

function serializeInfertilityTestRow(
  row: InfertilityTestQueryRow,
  staffNameMap: Map<number, string>,
): FlattenedInfertilityTestRecord {
  const { patient, hospital } = row.infertilityPatient;
  const selectedTests = parseSelectedTests(row.testResults);
  const subjectName = getSubjectName(
    row.subjectType,
    patient,
    row.subjectNameSnapshot,
  );

  return {
    id: row.id,
    infertilityPatientId: row.infertilityPatientId,
    testNumber: row.testNumber,
    caseNumber: row.infertilityPatient.caseNumber,
    patientFullName: patient.fullName,
    patientGender: patient.gender,
    patientDOB: formatNullableDate(patient.dateOfBirth),
    patientAge: getAgeFromDateOfBirth(patient.dateOfBirth),
    patientFirstName: patient.firstName,
    patientLastName: patient.lastName,
    mobileNumber: patient.phoneNumber,
    email: patient.email,
    address: patient.address,
    bloodGroup: patient.bloodGroup,
    guardianName: patient.guardianName,
    guardianDOB: formatNullableDate(patient.guardianDOB),
    guardianGender: patient.guardianGender,
    guardianAge: getAgeFromDateOfBirth(patient.guardianDOB),
    subjectType: row.subjectType,
    subjectLabel: getSubjectLabel(row.subjectType),
    subjectName,
    subjectNameSnapshot: row.subjectNameSnapshot,
    hospitalName: hospital.name,
    hospitalType: hospital.type,
    hospitalAddress: hospital.address,
    hospitalPhone: hospital.phoneNumber,
    hospitalWebsite: hospital.website,
    hospitalEmail: hospital.email,
    testDate: row.testDate.toISOString(),
    reportDate: formatNullableDate(row.reportDate),
    testCategory: row.testCategory,
    selectedTests,
    testResults: { tests: selectedTests },
    remarks: row.remarks,
    isCompleted: row.isCompleted,
    testCharge: Number(row.testCharge),
    discountType: row.discountType,
    discountValue: row.discountValue ? Number(row.discountValue) : null,
    discountAmount: row.discountAmount ? Number(row.discountAmount) : null,
    grandTotal: Number(row.grandTotal),
    paidAmount: Number(row.paidAmount),
    dueAmount: Number(row.dueAmount),
    orderedById: row.orderedById,
    orderedBy: row.orderedBy.fullName,
    doneById: row.doneById,
    doneBy: row.doneBy?.fullName || null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
    createdByName: staffNameMap.get(row.createdBy) || null,
    lastModifiedBy: row.lastModifiedBy,
    lastModifiedByName: staffNameMap.get(row.lastModifiedBy) || null,
    sourcePathologyTestId: row.sourcePathologyTestId,
  };
}

export async function getInfertilityTests(filters: InfertilityTestFilters) {
  const where: Prisma.InfertilityTestWhereInput = {
    isMigrationSuperseded: false,
    infertilityPatient: {
      mergedIntoId: null,
    },
  };

  if (filters.infertilityPatientId) {
    where.infertilityPatientId = filters.infertilityPatientId;
  }

  // Search filter
  if (filters.search) {
    if (!where.AND) where.AND = [];
    (where.AND as Prisma.InfertilityTestWhereInput[]).push({
      OR: [
        {
          infertilityPatient: {
            patient: {
              OR: [
                {
                  fullName: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
                { phoneNumber: { contains: filters.search } },
                {
                  guardianName: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
        {
          infertilityPatient: {
            caseNumber: {
              contains: filters.search,
              mode: "insensitive",
            },
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
        infertilityPatient: {
          include: {
            patient: true,
            hospital: true,
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

  const staffNameMap = await buildStaffNameMap(data);
  const serializedData = data.map((row) =>
    serializeInfertilityTestRow(row, staffNameMap),
  );

  const totalPages = Math.ceil(total / limit);

  return {
    data: serializedData,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getInfertilityTestById(id: number) {
  const row = await prisma.infertilityTest.findFirst({
    where: {
      id,
      isMigrationSuperseded: false,
      infertilityPatient: {
        mergedIntoId: null,
      },
    },
    include: {
      infertilityPatient: {
        include: {
          patient: true,
          hospital: true,
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

  if (!row) {
    return null;
  }

  const staffNameMap = await buildStaffNameMap([row]);
  return serializeInfertilityTestRow(row, staffNameMap);
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

    // 2. Generate test number from the highest existing unique number.
    const testNumber = await getNextInfertilityTestNumber(tx);

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
        testNumber,
        subjectType: testData.subjectType,
        subjectNameSnapshot:
          testData.subjectType === InvestigationSubjectType.PATIENT
            ? null
            : testData.subjectNameSnapshot ||
              infertilityPatient.patient.guardianName ||
              null,
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
        : await infertilityShiftService.ensureActiveShift(staffId, tx);

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
  testData: InfertilityTestUpdateData,
  staffId: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    const existingTest = await tx.infertilityTest.findUnique({
      where: { id },
      include: {
        infertilityPatient: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!existingTest || existingTest.isMigrationSuperseded) {
      throw new Error("HSI Center test not found");
    }

    const currentSelectedTests = parseSelectedTests(existingTest.testResults);
    const nextSelectedTests = testData.selectedTests ?? currentSelectedTests;
    const nextTestCharge = testData.testCharge ?? Number(existingTest.testCharge);
    const nextDiscountAmount =
      testData.discountAmount ?? Number(existingTest.discountAmount ?? 0);
    const nextGrandTotal = testData.grandTotal ?? Number(existingTest.grandTotal);
    const nextPaidAmount = testData.paidAmount ?? Number(existingTest.paidAmount);
    const nextDueAmount = testData.dueAmount ?? Number(existingTest.dueAmount);
    const paidAmountDiff = nextPaidAmount - Number(existingTest.paidAmount);
    const grandTotalDiff = nextGrandTotal - Number(existingTest.grandTotal);
    const dueAmountDiff = nextDueAmount - Number(existingTest.dueAmount);

    const dataToUpdate: Prisma.InfertilityTestUncheckedUpdateInput = {
      lastModifiedBy: staffId,
    };

    if (testData.selectedTests) {
      dataToUpdate.testResults = { tests: nextSelectedTests };
    }
    if (testData.remarks !== undefined) {
      dataToUpdate.remarks = testData.remarks;
    }
    if (testData.isCompleted !== undefined) {
      dataToUpdate.isCompleted = testData.isCompleted;
    }
    if (testData.orderedById !== undefined) {
      dataToUpdate.orderedById = testData.orderedById;
    }
    if (testData.doneById !== undefined) {
      dataToUpdate.doneById = testData.doneById;
    }
    if (testData.subjectType !== undefined) {
      dataToUpdate.subjectType = testData.subjectType;
      dataToUpdate.subjectNameSnapshot =
        testData.subjectType === InvestigationSubjectType.PATIENT
          ? null
          : testData.subjectNameSnapshot ||
            existingTest.infertilityPatient.patient.guardianName ||
            existingTest.subjectNameSnapshot;
    } else if (testData.subjectNameSnapshot !== undefined) {
      dataToUpdate.subjectNameSnapshot = testData.subjectNameSnapshot;
    }
    if (testData.testDate !== undefined) {
      dataToUpdate.testDate = new Date(testData.testDate);
    }
    if (testData.testCharge !== undefined) {
      dataToUpdate.testCharge = testData.testCharge;
    }
    if (testData.discountType !== undefined) {
      dataToUpdate.discountType = testData.discountType;
    }
    if (testData.discountValue !== undefined) {
      dataToUpdate.discountValue = testData.discountValue;
    }
    if (testData.discountAmount !== undefined) {
      dataToUpdate.discountAmount = testData.discountAmount;
    }
    if (testData.grandTotal !== undefined) {
      dataToUpdate.grandTotal = testData.grandTotal;
    }
    if (testData.paidAmount !== undefined) {
      dataToUpdate.paidAmount = testData.paidAmount;
    }
    if (testData.dueAmount !== undefined) {
      dataToUpdate.dueAmount = testData.dueAmount;
    }

    const updatedTest = await tx.infertilityTest.update({
      where: { id },
      data: dataToUpdate,
    });

    await tx.infertilityServiceCharge.updateMany({
      where: { infertilityTestId: id },
      data: {
        serviceName: `HSI Center Investigation - ${existingTest.testNumber}`,
        originalAmount: nextTestCharge,
        discountAmount: nextDiscountAmount,
        finalAmount: nextGrandTotal,
        description:
          nextSelectedTests.length > 0
            ? `Investigations: ${nextSelectedTests.join(", ")}`
            : undefined,
      },
    });

    if (paidAmountDiff !== 0) {
      const activeShift = await infertilityShiftService.ensureActiveShift(
        staffId,
        tx,
      );

      const existingServiceCharge = await tx.infertilityServiceCharge.findFirst({
        where: { infertilityTestId: id },
      });

      if (paidAmountDiff > 0) {
        const patientAccountForPayment =
          await tx.infertilityPatientAccount.findUnique({
            where: {
              patientId: existingTest.infertilityPatient.patientId,
            },
          });

        if (!patientAccountForPayment) {
          throw new Error("Patient account not found for payment recording");
        }

        const paymentCount = await tx.infertilityPayment.count();
        const receiptNumber = `RCP-INF-${Date.now()}-${paymentCount + 1}`;

        const payment = await tx.infertilityPayment.create({
          data: {
            patientAccountId: patientAccountForPayment.id,
            amount: paidAmountDiff,
            paymentMethod: "Cash",
            collectedById: staffId,
            shiftId: activeShift.id,
            receiptNumber,
            notes: `Additional payment for HSI Center test ${existingTest.testNumber}`,
          },
        });

        if (existingServiceCharge) {
          await tx.infertilityPaymentAllocation.create({
            data: {
              paymentId: payment.id,
              serviceChargeId: existingServiceCharge.id,
              allocatedAmount: paidAmountDiff,
            },
          });
        }

        await tx.infertilityCashMovement.create({
          data: {
            shiftId: activeShift.id,
            amount: paidAmountDiff,
            movementType: "PAYMENT_RECEIVED",
            description: `Additional collection for ${existingTest.testNumber}`,
            paymentId: payment.id,
          },
        });

        await tx.infertilityShift.update({
          where: { id: activeShift.id },
          data: {
            systemCash: { increment: paidAmountDiff },
            totalCollected: { increment: paidAmountDiff },
          },
        });
      } else {
        const refundAmount = Math.abs(paidAmountDiff);

        let originalPaymentId: number | undefined;
        if (existingServiceCharge) {
          const originalPayment = await tx.infertilityPayment.findFirst({
            where: {
              paymentAllocations: {
                some: {
                  serviceChargeId: existingServiceCharge.id,
                },
              },
            },
            orderBy: { paymentDate: "desc" },
            select: { id: true },
          });
          originalPaymentId = originalPayment?.id;
        }

        await tx.infertilityCashMovement.create({
          data: {
            shiftId: activeShift.id,
            amount: refundAmount,
            movementType: "REFUND",
            description: `Refund/Correction for ${existingTest.testNumber}`,
            paymentId: originalPaymentId,
          },
        });

        await tx.infertilityShift.update({
          where: { id: activeShift.id },
          data: {
            systemCash: { decrement: refundAmount },
            totalRefunded: { increment: refundAmount },
          },
        });
      }
    }

    const patientAccount = await tx.infertilityPatientAccount.findUnique({
      where: {
        patientId: existingTest.infertilityPatient.patientId,
      },
    });

    if (patientAccount) {
      await tx.infertilityPatientAccount.update({
        where: { id: patientAccount.id },
        data: {
          totalCharges: { increment: grandTotalDiff },
          totalPaid: { increment: paidAmountDiff },
          totalDue: { increment: dueAmountDiff },
        },
      });
    }

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
        deviceFingerprint: activityLogContext?.deviceInfo?.deviceFingerprint,
        readableFingerprint:
          activityLogContext?.deviceInfo?.readableFingerprint,
        deviceType: activityLogContext?.deviceInfo?.deviceType,
        browserName: activityLogContext?.deviceInfo?.browserName,
        browserVersion: activityLogContext?.deviceInfo?.browserVersion,
        osType: activityLogContext?.deviceInfo?.osType,
      },
    });

    const refreshedTest = await tx.infertilityTest.findFirst({
      where: {
        id: updatedTest.id,
        isMigrationSuperseded: false,
      },
      include: {
        infertilityPatient: {
          include: {
            patient: true,
            hospital: true,
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

    if (!refreshedTest) {
      throw new Error("Failed to load updated HSI Center test");
    }

    const refreshedStaffIds = Array.from(
      new Set([refreshedTest.createdBy, refreshedTest.lastModifiedBy]),
    );
    const refreshedStaff = await tx.staff.findMany({
      where: { id: { in: refreshedStaffIds } },
      select: { id: true, fullName: true },
    });
    const refreshedStaffMap = new Map(
      refreshedStaff.map((staff) => [staff.id, staff.fullName]),
    );

    return serializeInfertilityTestRow(refreshedTest, refreshedStaffMap);
  });
}

export async function getInfertilityTestsForReport(
  filters: Omit<InfertilityTestFilters, "page" | "limit">
) {
  // Same as getInfertilityTests but without pagination
  const result = await getInfertilityTests({ ...filters, page: 1, limit: 10000 });
  return result.data;
}
