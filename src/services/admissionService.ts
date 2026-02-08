/**
 * Admission Service Layer
 * Business logic for patient admission management with payment tracking
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getDepartmentCode,
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

export interface AdmissionFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  departmentId?: number;
  doctorId?: number;
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
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

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
  if (filters.doctorId) {
    where.doctorId = filters.doctorId;
  }

  const [admissions, total] = await Promise.all([
    prisma.admission.findMany({
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
      skip,
      take: limit,
    }),
    prisma.admission.count({ where }),
  ]);

  return { admissions, total };
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
  shiftId: number | null,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get admission fee from config
    const admissionFeeConfig = await tx.hospitalConfig.findUnique({
      where: { key: "ADMISSION_FEE" },
    });
    const admissionFee = admissionFeeConfig
      ? parseFloat(admissionFeeConfig.value)
      : 300;

    // 2. Use default hospital ID 1 (FNH Hospital)
    const hospitalId = 1;

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

    // 4. Generate admission number (format: DEPT-YY-XXXXX, e.g., GYNE-25-00001)
    // Get department to determine the code
    const department = await tx.department.findUnique({
      where: { id: admissionData.departmentId },
    });
    if (!department) {
      throw new Error("Department not found");
    }

    const departmentCode = getDepartmentCode(department.name);
    const currentYear = getTwoDigitYear();
    const yearStart = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
    const yearEnd = new Date(new Date().getFullYear() + 1, 0, 1); // Jan 1 of next year

    // Count admissions for this department in the current year
    const countThisYear = await tx.admission.count({
      where: {
        departmentId: admissionData.departmentId,
        dateAdmitted: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    });

    const admissionNumber = formatRegistrationNumber(
      departmentCode,
      currentYear,
      countThisYear + 1,
    );

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
    // Always ensure a shift exists so payments are never silently lost
    const activeShift = shiftId
      ? { id: shiftId }
      : await shiftService.ensureActiveShift(staffId, tx);

    const paymentCount = await tx.payment.count();
    const receiptNumber = `RCP-${Date.now()}-${paymentCount + 1}`;

    const payment = await tx.payment.create({
      data: {
        patientAccountId: patientAccount.id,
        amount: new Prisma.Decimal(admissionFee),
        paymentMethod: "Cash",
        collectedById: staffId,
        shiftId: activeShift.id,
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
        shiftId: activeShift.id,
        amount: new Prisma.Decimal(admissionFee),
        movementType: "COLLECTION",
        description: `Admission Fee collection for ${admissionNumber}`,
        paymentId: payment.id,
      },
    });

    await tx.shift.update({
      where: { id: activeShift.id },
      data: {
        systemCash: { increment: admissionFee },
        totalCollected: { increment: admissionFee },
      },
    });

    // 8. Log activity with device info
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Created admission ${admissionNumber} for ${patient.fullName}. Admission Fee: BDT ${admissionFee}`,
        entityType: "Admission",
        entityId: admission.id,
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
  shiftId: number | null,
  activityLogContext?: ActivityLogContext,
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

    let discountAmount = isCanceling ? 0 : (updateData.discountAmount ?? 0);
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
          : (updateData.remarks ?? existingAdmission.remarks),
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
          : (updateData.discountType ?? existingAdmission.discountType),
        discountValue: isCanceling
          ? null
          : (updateData.discountValue ?? existingAdmission.discountValue),
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

    // Update ServiceCharge to reflect edited amounts
    await tx.serviceCharge.updateMany({
      where: { admissionId: id },
      data: {
        originalAmount: totalAmount,
        discountAmount: discountAmount,
        finalAmount: grandTotal,
      },
    });

    // Handle payment tracking if there's a payment difference
    if (paidAmountDiff !== 0) {
      // Always ensure a shift exists so payments are never silently lost
      const activeShift = shiftId
        ? { id: shiftId }
        : await shiftService.ensureActiveShift(staffId, tx);

      // Find the existing service charge for this admission to link payments
      const existingServiceCharge = await tx.serviceCharge.findFirst({
        where: { admissionId: id },
      });

      if (paidAmountDiff > 0) {
        // Additional collection
        // First, we need to get the correct patientAccountId (NOT patientId)
        const patientAccountForPayment = await tx.patientAccount.findUnique({
          where: { patientId: existingAdmission.patientId },
        });

        if (!patientAccountForPayment) {
          throw new Error("Patient account not found for payment recording");
        }

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
            shiftId: activeShift.id,
            amount: new Prisma.Decimal(paidAmountDiff),
            movementType: "COLLECTION",
            description: `Collection for ${existingAdmission.admissionNumber}`,
            paymentId: payment.id,
          },
        });

        await tx.shift.update({
          where: { id: activeShift.id },
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
            shiftId: activeShift.id,
            amount: new Prisma.Decimal(refundAmount),
            movementType: "REFUND",
            description: `Refund for ${existingAdmission.admissionNumber}`,
          },
        });

        await tx.shift.update({
          where: { id: activeShift.id },
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

    // Log activity with device info
    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated admission ${existingAdmission.admissionNumber} for ${existingAdmission.patient.fullName}`,
        entityType: "Admission",
        entityId: updatedAdmission.id,
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

    return updatedAdmission;
  });
}

export async function deleteAdmission(
  id: number,
  userId: number,
  activityLogContext?: ActivityLogContext,
) {
  return await prisma.$transaction(async (tx) => {
    const existingAdmission = await tx.admission.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingAdmission) {
      throw new Error("Admission record not found");
    }

    // ── Reverse financial records before deleting ──

    // 1. Find all ServiceCharges linked to this admission
    const serviceCharges = await tx.serviceCharge.findMany({
      where: { admissionId: id },
      select: { id: true, patientAccountId: true, finalAmount: true },
    });

    if (serviceCharges.length > 0) {
      const serviceChargeIds = serviceCharges.map((sc) => sc.id);

      // 2. Find all PaymentAllocations linked to these service charges
      const paymentAllocations = await tx.paymentAllocation.findMany({
        where: { serviceChargeId: { in: serviceChargeIds } },
        select: { id: true, paymentId: true, allocatedAmount: true },
      });

      // 3. Delete PaymentAllocations first (depends on both Payment and ServiceCharge)
      if (paymentAllocations.length > 0) {
        await tx.paymentAllocation.deleteMany({
          where: { serviceChargeId: { in: serviceChargeIds } },
        });
      }

      // 4. Find all unique Payment IDs that were linked to this admission
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
          // Reverse the shift totals (decrement what was collected)
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
      const totalPaidAmount = Number(existingAdmission.paidAmount);

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
        where: { admissionId: id },
      });
    }

    // 10. Also find and reverse any refund CashMovements for shifts
    //     (refunds are CashMovements without a paymentId, linked to shifts)
    //     These are already handled by the shift reversal above for collections.

    // 11. Delete the admission record
    await tx.admission.delete({
      where: { id },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "DELETE",
        description: `Deleted admission ${existingAdmission.admissionNumber} for ${existingAdmission.patient.fullName} (financials reversed)`,
        entityType: "Admission",
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

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function transformAdmissionForResponse(admission: any) {
  return {
    id: admission.id,
    admissionNumber: admission.admissionNumber,
    patientId: admission.patientId,
    patientFirstName: admission.patient.firstName,
    patientLastName: admission.patient.lastName || null,
    patientFullName: admission.patient.fullName,
    patientDateOfBirth: admission.patient.dateOfBirth?.toISOString() || null,
    patientAge: admission.patient.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(admission.patient.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
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
