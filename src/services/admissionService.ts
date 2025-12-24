/**
 * Admission Service Layer
 * Business logic for patient admission management with payment tracking
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface AdmissionFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  departmentId?: number;
}

export interface PatientData {
  id?: number | null;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  age: number | null;
  dateOfBirth: Date | null;
  address: string;
  phoneNumber: string;
  email: string;
  bloodGroup: string;
  guardianName: string;
  guardianPhone: string;
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

export interface AdmissionData {
  departmentId: number;
  doctorId: number;
  seatNumber?: string;
  ward?: string;
  diagnosis?: string;
  treatment?: string;
  otType?: string;
  remarks?: string;
  chiefComplaint?: string;
}

export interface FinancialData {
  admissionFee: number;
  serviceCharge: number;
  seatRent: number;
  otCharge: number;
  doctorCharge: number;
  surgeonCharge: number;
  anesthesiaFee: number;
  assistantDoctorFee: number;
  medicineCharge: number;
  otherCharges: number;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number;
  paidAmount: number;
}

// ═══════════════════════════════════════════════════════════════
// QUERY SERVICES
// ═══════════════════════════════════════════════════════════════

export async function getAdmissions(filters: AdmissionFilters) {
  const where: Prisma.AdmissionWhereInput = {};

  // Search filter
  if (filters.search) {
    where.OR = [
      { admissionNumber: { contains: filters.search, mode: "insensitive" } },
      {
        patient: {
          OR: [
            { fullName: { contains: filters.search, mode: "insensitive" } },
            { phoneNumber: { contains: filters.search } },
          ],
        },
      },
    ];
  }

  // Date range filter
  if (filters.startDate || filters.endDate) {
    where.dateAdmitted = {};
    if (filters.startDate) {
      where.dateAdmitted.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.dateAdmitted.lte = new Date(filters.endDate);
    }
  }

  // Status filter
  if (filters.status && filters.status !== "All") {
    where.status = filters.status;
  }

  // Department filter
  if (filters.departmentId) {
    where.departmentId = filters.departmentId;
  }

  return await prisma.admission.findMany({
    where,
    include: {
      patient: {
        include: {
          hospital: true,
        },
      },
      department: true,
      doctor: true,
    },
    orderBy: {
      dateAdmitted: "desc",
    },
  });
}

export async function getAdmissionById(id: number) {
  return await prisma.admission.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          hospital: true,
        },
      },
      department: true,
      doctor: true,
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// MUTATION SERVICES WITH PAYMENT TRACKING
// ═══════════════════════════════════════════════════════════════

export async function createAdmission(
  patientData: PatientData,
  hospitalData: HospitalData,
  admissionData: AdmissionData,
  staffId: number,
  userId: number,
  shiftId: number | null
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get admission fee from config
    const admissionFeeConfig = await tx.hospitalConfig.findUnique({
      where: { key: "ADMISSION_FEE" },
    });
    const admissionFee = admissionFeeConfig
      ? parseFloat(admissionFeeConfig.value)
      : 300;

    // 2. Handle Hospital
    let hospitalId: number | null = hospitalData.id || null;
    const cleanHospitalName = hospitalData.name?.trim();

    if (!hospitalId && cleanHospitalName) {
      // Try to find by name first
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
            address: hospitalData.address || null,
            phoneNumber: hospitalData.phoneNumber || null,
            email: hospitalData.email || null,
            website: hospitalData.website || null,
            type: hospitalData.type || null,
            isActive: true,
            createdBy: staffId,
          },
        });
        hospitalId = newHospital.id;
      }
    }

    // 3. Handle Patient
    let patient;
    if (patientData.id) {
      patient = await tx.patient.update({
        where: { id: patientData.id },
        data: {
          firstName: patientData.firstName,
          lastName: patientData.lastName || null,
          fullName: patientData.fullName,
          gender: patientData.gender,
          dateOfBirth: patientData.dateOfBirth,
          address: patientData.address || null,
          phoneNumber: patientData.phoneNumber || null,
          email: patientData.email || null,
          bloodGroup: patientData.bloodGroup || null,
          guardianName: patientData.guardianName || null,
          guardianPhone: patientData.guardianPhone || null,
          hospitalId,
        },
      });
    } else {
      patient = await tx.patient.create({
        data: {
          firstName: patientData.firstName,
          lastName: patientData.lastName || null,
          fullName: patientData.fullName,
          gender: patientData.gender,
          dateOfBirth: patientData.dateOfBirth,
          address: patientData.address || null,
          phoneNumber: patientData.phoneNumber || null,
          email: patientData.email || null,
          bloodGroup: patientData.bloodGroup || null,
          guardianName: patientData.guardianName || null,
          guardianPhone: patientData.guardianPhone || null,
          hospitalId,
          createdBy: staffId,
        },
      });
    }

    // 4. Generate admission number (format: ADM-YYYYMMDD-XXXX)
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, "");
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const countToday = await tx.admission.count({
      where: {
        dateAdmitted: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });
    const admissionNumber = `ADM-${datePrefix}-${String(
      countToday + 1
    ).padStart(4, "0")}`;

    // 5. Create admission record
    const admission = await tx.admission.create({
      data: {
        patientId: patient.id,
        departmentId: admissionData.departmentId,
        doctorId: admissionData.doctorId,
        admissionNumber,
        status: "Admitted",
        admissionFee,
        totalAmount: admissionFee,
        grandTotal: admissionFee,
        dueAmount: 0, // Assume paid by default as per user request
        paidAmount: admissionFee, // Set to 300 by default
        seatNumber: admissionData.seatNumber || null,
        ward: admissionData.ward || null,
        diagnosis: admissionData.diagnosis || null,
        treatment: admissionData.treatment || null,
        chiefComplaint: admissionData.chiefComplaint || null,
        otType: admissionData.otType || null,
        remarks: admissionData.remarks || null,
        createdBy: staffId,
        lastModifiedBy: staffId,
      },
      include: {
        patient: {
          include: {
            hospital: true,
          },
        },
        department: true,
        doctor: true,
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
          totalCharges: admissionFee,
          totalPaid: admissionFee,
          totalDue: 0,
        },
      });
    } else {
      patientAccount = await tx.patientAccount.update({
        where: { id: patientAccount.id },
        data: {
          totalCharges: { increment: admissionFee },
          totalPaid: { increment: admissionFee },
          totalDue: { increment: 0 },
        },
      });
    }

    // 6.5. Create service charge record FIRST (so we can link payment to it)
    const serviceCharge = await tx.serviceCharge.create({
      data: {
        patientAccountId: patientAccount.id,
        serviceType: "ADMISSION",
        serviceName: `Admission - ${admissionNumber}`,
        departmentId: admissionData.departmentId,
        originalAmount: admissionFee,
        discountAmount: 0,
        finalAmount: admissionFee,
        admissionId: admission.id,
        createdBy: staffId,
      },
    });

    // 7. Create Payment and Cash Movement for initial admission fee
    if (shiftId) {
      const paymentCount = await tx.payment.count();
      const receiptNumber = `RCP-${Date.now()}-${paymentCount + 1}`;

      const payment = await tx.payment.create({
        data: {
          patientAccountId: patientAccount.id,
          amount: new Prisma.Decimal(admissionFee),
          paymentMethod: "Cash",
          collectedById: staffId,
          shiftId,
          receiptNumber,
          notes: `Initial Admission Fee for ${admissionNumber}`,
          // Create PaymentAllocation to link payment to service charge for department tracking
          paymentAllocations: {
            create: {
              serviceChargeId: serviceCharge.id,
              allocatedAmount: new Prisma.Decimal(admissionFee),
            },
          },
        },
      });

      await tx.cashMovement.create({
        data: {
          shiftId,
          amount: new Prisma.Decimal(admissionFee),
          movementType: "COLLECTION",
          description: `Admission Fee collection for ${admissionNumber}`,
          paymentId: payment.id,
        },
      });

      await tx.shift.update({
        where: { id: shiftId },
        data: {
          systemCash: { increment: admissionFee },
          totalCollected: { increment: admissionFee },
        },
      });
    }

    // 8. Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Created admission ${admissionNumber} for ${patient.fullName}. Admission Fee: BDT ${admissionFee}`,
        entityType: "Admission",
        entityId: admission.id,
        timestamp: new Date(),
      },
    });

    return {
      admission,
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        isNew: !patientData.id,
      },
      hospital: hospitalId
        ? {
            id: hospitalId,
            name: hospitalData.name,
            isNew: !hospitalData.id,
          }
        : null,
      displayId: admissionNumber,
    };
  });
}

export async function updateAdmission(
  id: number,
  updateData: {
    status?: string;
    seatNumber?: string;
    ward?: string;
    diagnosis?: string;
    treatment?: string;
    otType?: string;
    remarks?: string;
    serviceCharge?: number;
    seatRent?: number;
    otCharge?: number;
    doctorCharge?: number;
    surgeonCharge?: number;
    anesthesiaFee?: number;
    assistantDoctorFee?: number;
    medicineCharge?: number;
    otherCharges?: number;
    discountType?: string | null;
    discountValue?: number | null;
    discountAmount?: number;
    paidAmount?: number;
    isDischarged?: boolean;
    dateDischarged?: Date | null;
    chiefComplaint?: string;
  },
  staffId: number,
  userId: number,
  shiftId: number | null
) {
  return await prisma.$transaction(async (tx) => {
    // Get existing record
    const existingAdmission = await tx.admission.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingAdmission) {
      throw new Error("Admission record not found");
    }

    // Check if this is a cancellation or restore from canceled
    const isCanceling = updateData.status === "Canceled";
    const isRestoring =
      existingAdmission.status === "Canceled" &&
      updateData.status !== "Canceled";

    // Calculate totals based on status
    let admissionFee: number;
    let serviceCharge: number;
    let seatRent: number;
    let otCharge: number;
    let doctorCharge: number;
    let surgeonCharge: number;
    let anesthesiaFee: number;
    let assistantDoctorFee: number;
    let medicineCharge: number;
    let otherCharges: number;
    let paidAmountNew: number;

    if (isCanceling) {
      // Cancellation: Zero out all charges, set paid to 0 (implies refund needed)
      admissionFee = 0;
      serviceCharge = 0;
      seatRent = 0;
      otCharge = 0;
      doctorCharge = 0;
      surgeonCharge = 0;
      anesthesiaFee = 0;
      assistantDoctorFee = 0;
      medicineCharge = 0;
      otherCharges = 0;
      paidAmountNew = 0; // Previous paid amount will need to be refunded manually
    } else if (isRestoring) {
      // Restore from canceled: Set admission fee to 300, other charges 0
      admissionFee = 300;
      serviceCharge = updateData.serviceCharge ?? 0;
      seatRent = updateData.seatRent ?? 0;
      otCharge = updateData.otCharge ?? 0;
      doctorCharge = updateData.doctorCharge ?? 0;
      surgeonCharge = updateData.surgeonCharge ?? 0;
      anesthesiaFee = updateData.anesthesiaFee ?? 0;
      assistantDoctorFee = updateData.assistantDoctorFee ?? 0;
      medicineCharge = updateData.medicineCharge ?? 0;
      otherCharges = updateData.otherCharges ?? 0;
      paidAmountNew = updateData.paidAmount ?? 0;
    } else {
      // Normal update: Use existing values or provided updates
      admissionFee = Number(existingAdmission.admissionFee);
      serviceCharge =
        updateData.serviceCharge ?? Number(existingAdmission.serviceCharge);
      seatRent = updateData.seatRent ?? Number(existingAdmission.seatRent);
      otCharge = updateData.otCharge ?? Number(existingAdmission.otCharge);
      doctorCharge =
        updateData.doctorCharge ?? Number(existingAdmission.doctorCharge);
      surgeonCharge =
        updateData.surgeonCharge ?? Number(existingAdmission.surgeonCharge);
      anesthesiaFee =
        updateData.anesthesiaFee ?? Number(existingAdmission.anesthesiaFee);
      assistantDoctorFee =
        updateData.assistantDoctorFee ??
        Number(existingAdmission.assistantDoctorFee);
      medicineCharge =
        updateData.medicineCharge ?? Number(existingAdmission.medicineCharge);
      otherCharges =
        updateData.otherCharges ?? Number(existingAdmission.otherCharges);
      paidAmountNew =
        updateData.paidAmount ?? Number(existingAdmission.paidAmount);
    }

    const totalAmount =
      admissionFee +
      serviceCharge +
      seatRent +
      otCharge +
      doctorCharge +
      surgeonCharge +
      anesthesiaFee +
      assistantDoctorFee +
      medicineCharge +
      otherCharges;

    let discountAmount = isCanceling ? 0 : updateData.discountAmount ?? 0;
    if (!isCanceling && updateData.discountType && updateData.discountValue) {
      if (updateData.discountType === "percentage") {
        discountAmount = (totalAmount * updateData.discountValue) / 100;
      } else {
        discountAmount = updateData.discountValue;
      }
    }
    discountAmount = Math.min(discountAmount, totalAmount);

    const grandTotal = totalAmount - discountAmount;
    const paidAmount = paidAmountNew;
    const dueAmount = grandTotal - paidAmount;

    // Calculate payment difference for tracking
    const oldPaidAmount = Number(existingAdmission.paidAmount);
    const paidAmountDiff = paidAmount - oldPaidAmount;

    // Update admission
    const updatedAdmission = await tx.admission.update({
      where: { id },
      data: {
        status: updateData.status ?? existingAdmission.status,
        seatNumber: updateData.seatNumber ?? existingAdmission.seatNumber,
        ward: updateData.ward ?? existingAdmission.ward,
        diagnosis: updateData.diagnosis ?? existingAdmission.diagnosis,
        treatment: updateData.treatment ?? existingAdmission.treatment,
        otType: updateData.otType ?? existingAdmission.otType,
        chiefComplaint:
          updateData.chiefComplaint ?? existingAdmission.chiefComplaint,
        remarks: isCanceling
          ? `[CANCELED] ${
              existingAdmission.remarks || ""
            } - Previous charges refunded`
          : updateData.remarks ?? existingAdmission.remarks,
        admissionFee, // Include admission fee for cancellation/restore
        serviceCharge,
        seatRent,
        otCharge,
        doctorCharge,
        surgeonCharge,
        anesthesiaFee,
        assistantDoctorFee,
        medicineCharge,
        otherCharges,
        totalAmount,
        discountType: isCanceling
          ? null
          : updateData.discountType ?? existingAdmission.discountType,
        discountValue: isCanceling
          ? null
          : updateData.discountValue ?? existingAdmission.discountValue,
        discountAmount,
        grandTotal,
        paidAmount,
        dueAmount,
        isDischarged: updateData.isDischarged ?? existingAdmission.isDischarged,
        dateDischarged: updateData.isDischarged
          ? updateData.dateDischarged || new Date()
          : null,
        lastModifiedBy: staffId,
      },
      include: {
        patient: {
          include: {
            hospital: true,
          },
        },
        department: true,
        doctor: true,
      },
    });

    // Handle payment tracking if there's a payment difference
    if (paidAmountDiff !== 0 && shiftId) {
      // Find the existing service charge for this admission to link payments
      const existingServiceCharge = await tx.serviceCharge.findFirst({
        where: { admissionId: id },
      });

      if (paidAmountDiff > 0) {
        // Additional collection
        const paymentCount = await tx.payment.count();
        const receiptNumber = `RCP-${Date.now()}-${paymentCount + 1}`;

        const payment = await tx.payment.create({
          data: {
            patientAccountId: existingAdmission.patientId,
            amount: new Prisma.Decimal(paidAmountDiff),
            paymentMethod: "Cash",
            collectedById: staffId,
            shiftId,
            receiptNumber,
            notes: `Payment for admission ${existingAdmission.admissionNumber}`,
            // Link payment to service charge for department tracking
            ...(existingServiceCharge && {
              paymentAllocations: {
                create: {
                  serviceChargeId: existingServiceCharge.id,
                  allocatedAmount: new Prisma.Decimal(paidAmountDiff),
                },
              },
            }),
          },
        });

        await tx.cashMovement.create({
          data: {
            shiftId,
            amount: new Prisma.Decimal(paidAmountDiff),
            movementType: "COLLECTION",
            description: `Collection for ${existingAdmission.admissionNumber}`,
            paymentId: payment.id,
          },
        });

        await tx.shift.update({
          where: { id: shiftId },
          data: {
            systemCash: { increment: paidAmountDiff },
            totalCollected: { increment: paidAmountDiff },
          },
        });
      } else {
        // Refund
        const refundAmount = Math.abs(paidAmountDiff);

        await tx.cashMovement.create({
          data: {
            shiftId,
            amount: new Prisma.Decimal(refundAmount),
            movementType: "REFUND",
            description: `Refund for ${existingAdmission.admissionNumber}`,
          },
        });

        await tx.shift.update({
          where: { id: shiftId },
          data: {
            systemCash: { decrement: refundAmount },
            totalRefunded: { increment: refundAmount },
          },
        });
      }
    }

    // Update patient account
    const patientAccount = await tx.patientAccount.findUnique({
      where: { patientId: existingAdmission.patientId },
    });

    if (patientAccount) {
      const oldGrandTotal = Number(existingAdmission.grandTotal);
      const grandTotalDiff = grandTotal - oldGrandTotal;
      const oldDueAmount = Number(existingAdmission.dueAmount);
      const dueAmountDiff = dueAmount - oldDueAmount;

      await tx.patientAccount.update({
        where: { id: patientAccount.id },
        data: {
          totalCharges: { increment: grandTotalDiff },
          totalPaid: { increment: paidAmountDiff },
          totalDue: { increment: dueAmountDiff },
        },
      });
    }

    // Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated admission ${existingAdmission.admissionNumber} for ${existingAdmission.patient.fullName}`,
        entityType: "Admission",
        entityId: updatedAdmission.id,
        timestamp: new Date(),
      },
    });

    return updatedAdmission;
  });
}

export async function deleteAdmission(id: number, userId: number) {
  return await prisma.$transaction(async (tx) => {
    const existingAdmission = await tx.admission.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingAdmission) {
      throw new Error("Admission record not found");
    }

    await tx.admission.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        description: `Deleted admission ${existingAdmission.admissionNumber} for ${existingAdmission.patient.fullName}`,
        entityType: "Admission",
        entityId: id,
        timestamp: new Date(),
      },
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function transformAdmissionForResponse(admission: any) {
  return {
    id: admission.id,
    admissionNumber: admission.admissionNumber,
    patientId: admission.patientId,
    patientFullName: admission.patient.fullName,
    patientDateOfBirth: admission.patient.dateOfBirth?.toISOString() || null,
    patientAge: admission.patient.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(admission.patient.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : null,
    patientGender: admission.patient.gender,
    patientPhone: admission.patient.phoneNumber || "",
    patientEmail: admission.patient.email || "",
    patientBloodGroup: admission.patient.bloodGroup || "",
    patientAddress: admission.patient.address || "",
    guardianName: admission.patient.guardianName || "",
    guardianPhone: admission.patient.guardianPhone || "",
    hospitalId: admission.patient.hospitalId,
    hospitalName: admission.patient.hospital?.name || "",
    hospitalAddress: admission.patient.hospital?.address || "",
    hospitalPhone: admission.patient.hospital?.phoneNumber || "",
    hospitalEmail: admission.patient.hospital?.email || "",
    hospitalWebsite: admission.patient.hospital?.website || "",
    hospitalType: admission.patient.hospital?.type || "",
    departmentId: admission.departmentId,
    departmentName: admission.department.name,
    doctorId: admission.doctorId,
    doctorName: admission.doctor.fullName,
    doctorSpecialization: admission.doctor.specialization || "",
    status: admission.status,
    dateAdmitted: admission.dateAdmitted.toISOString(),
    dateDischarged: admission.dateDischarged?.toISOString() || null,
    isDischarged: admission.isDischarged,
    seatNumber: admission.seatNumber,
    ward: admission.ward,
    diagnosis: admission.diagnosis,
    treatment: admission.treatment,
    otType: admission.otType,
    remarks: admission.remarks,
    chiefComplaint: admission.chiefComplaint || "",
    admissionFee: Number(admission.admissionFee),
    serviceCharge: Number(admission.serviceCharge),
    seatRent: Number(admission.seatRent),
    otCharge: Number(admission.otCharge),
    doctorCharge: Number(admission.doctorCharge),
    surgeonCharge: Number(admission.surgeonCharge),
    anesthesiaFee: Number(admission.anesthesiaFee),
    assistantDoctorFee: Number(admission.assistantDoctorFee),
    medicineCharge: Number(admission.medicineCharge),
    otherCharges: Number(admission.otherCharges),
    totalAmount: Number(admission.totalAmount),
    discountType: admission.discountType,
    discountValue: admission.discountValue
      ? Number(admission.discountValue)
      : null,
    discountAmount: Number(admission.discountAmount),
    grandTotal: Number(admission.grandTotal),
    paidAmount: Number(admission.paidAmount),
    dueAmount: Number(admission.dueAmount),
    createdAt: admission.createdAt.toISOString(),
    updatedAt: admission.updatedAt.toISOString(),
    createdBy: admission.createdBy,
    lastModifiedBy: admission.lastModifiedBy,
  };
}
