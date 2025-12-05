/**
 * Infertility Patient Service Layer
 * Business logic for infertility patient management
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface InfertilityFilters {
  status?: string;
  hospitalId?: number;
  infertilityType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
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

export interface SpouseData {
  name: string;
  age: number | null;
  dateOfBirth: Date | null;
  gender: string;
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
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  return await prisma.infertilityPatient.findMany({
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
          address: true,
          bloodGroup: true,
          spouseDOB: true,
          spouseGender: true,
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
  });
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
  userId: number
) {
  return await prisma.$transaction(async (tx) => {
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
          guardianName: patientData.guardianName,
          address: patientData.address,
          phoneNumber: patientData.phoneNumber,
          email: patientData.email,
          bloodGroup: patientData.bloodGroup,
          spouseDOB: spouseData.dateOfBirth,
          spouseGender: spouseData.gender,
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
          spouseDOB: spouseData.dateOfBirth,
          spouseGender: spouseData.gender,
          createdBy: staffId,
        },
      });
    }

    // 2. Create or get hospital
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

    // 3. Create infertility record
    const infertilityRecord = await tx.infertilityPatient.create({
      data: {
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

    // 4. Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Created infertility patient record for ${patient.fullName} at ${hospital.name}`,
        entityType: "InfertilityPatient",
        entityId: infertilityRecord.id,
        timestamp: new Date(),
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
      },
      displayId: `INF-${infertilityRecord.id}`,
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
  userId: number
) {
  return await prisma.$transaction(async (tx) => {
    // Check if record exists
    const existingRecord = await tx.infertilityPatient.findUnique({
      where: { id },
      include: { patient: true, hospital: true },
    });

    if (!existingRecord) {
      throw new Error("Infertility patient record not found");
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
        guardianName: patientData.guardianName,
        address: patientData.address,
        phoneNumber: patientData.phoneNumber,
        email: patientData.email,
        bloodGroup: patientData.bloodGroup,
        spouseDOB: spouseData.dateOfBirth,
        spouseGender: spouseData.gender,
      },
    });

    // 2. Update or create hospital
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

    // 4. Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated infertility patient record for ${updatedPatient.fullName} at ${hospital.name}`,
        entityType: "InfertilityPatient",
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
      displayId: `INF-${updatedRecord.id}`,
    };
  });
}

export async function deleteInfertilityPatient(id: number, userId: number) {
  return await prisma.$transaction(async (tx) => {
    const existingRecord = await tx.infertilityPatient.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingRecord) {
      throw new Error("Infertility patient record not found");
    }

    await tx.infertilityPatient.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        description: `Deleted infertility patient record for ${existingRecord.patient.fullName}`,
        entityType: "InfertilityPatient",
        entityId: id,
        timestamp: new Date(),
      },
    });
  });
}
