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
import {
  getAgeInYearsFromDateOfBirth,
  serializeDateOfBirth,
} from "@/lib/dateOfBirth";
import { SessionDeviceInfo } from "@/types/auth";
import { shiftService } from "@/services/shiftService";
import {
  createSaleWithTx,
  reverseAdmissionMedicineSales,
} from "@/services/medicineInventoryService";
import { DEFAULT_ADMISSION_MEDICINE_BILLING_ENABLED } from "@/lib/admissionMedicineBilling";

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
  hasDue?: boolean;
  hasDiscount?: boolean;
  isDischarged?: boolean;
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
  status?: string;
  seatNumber?: string;
  ward?: string;
  diagnosis?: string;
  treatment?: string;
  otType?: string;
  remarks?: string;
  chiefComplaint?: string;
  serviceCharge?: number;
  seatRent?: number;
  otCharge?: number;
  doctorCharge?: number;
  surgeonCharge?: number;
  anesthesiaFee?: number;
  assistantDoctorFee?: number;
  /**
   * `medicineCharge` is intentionally NOT in this contract. The server
   * derives the effective billed medicine charge from the stored
   * `Admission.medicineBillingEnabled` flag, the new
   * `DEFAULT_ADMISSION_MEDICINE_BILLING_ENABLED` constant, and the
   * submitted `medicineChargeItems` rows. The client never controls
   * this value.
   */
  otherCharges?: number;
  discountType?: string | null;
  discountValue?: number | null;
  discountAmount?: number;
  paidAmount?: number;
  medicineChargeItems?: AdmissionMedicineChargeItemInput[];
}

export interface AdmissionMedicineChargeItemInput {
  id?: number;
  medicineId: number | null;
  packageCode?: string | null;
  operationName: string;
  requestedMedicineName?: string | null;
  medicineName: string;
  genericName?: string | null;
  groupName?: string | null;
  companyName?: string | null;
  quantity: number;
  /**
   * `unitPrice` is optional in the input contract because the
   * inventory-only mode hides the price field. The server enforces
   * positivity only when the admission is in legacy billable mode.
   */
  unitPrice?: number;
  totalAmount?: number;
  currentStock?: number;
  defaultSalePrice?: number;
  isMatched?: boolean;
}

interface NormalizedAdmissionMedicineChargeItem {
  medicineId: number;
  packageCode: string | null;
  operationName: string;
  requestedMedicineName: string | null;
  medicineName: string;
  genericName: string | null;
  groupName: string | null;
  companyName: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export class AdmissionMedicineValidationError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "AdmissionMedicineValidationError";
  }
}

/**
 * Resolve an unmatched admission medicine row that may carry
 * `defaultSalePrice` / `currentStock` snapshot from the client. The actual
 * authoritative values are re-fetched from the `Medicine` table — the
 * client snapshot is only used as a UX hint.
 *
 * `medicineBillingEnabled` controls whether unit price must be positive:
 *  - when true (legacy billable admission), a positive unit price is
 *    required and the snapshot value feeds the billable total.
 *  - when false (inventory-only admission), zero or positive unit price
 *    is accepted and the live `Medicine.defaultSalePrice` is used as the
 *    authoritative inventory snapshot. The resulting total is still saved
 *    for pharmacy reporting but never feeds the admission bill.
 */
async function normalizeAdmissionMedicineChargeItems(
  items: AdmissionMedicineChargeItemInput[] | undefined,
  tx: Prisma.TransactionClient,
  context: { isUpdating: boolean; medicineBillingEnabled: boolean },
): Promise<NormalizedAdmissionMedicineChargeItem[]> {
  if (!items?.length) return [];

  const normalized: NormalizedAdmissionMedicineChargeItem[] = [];
  const fieldErrors: Record<string, string[]> = {};

  items.forEach((item, index) => {
    const path = `medicineChargeItems.${index}`;

    if (item.medicineId === null || item.medicineId === undefined) {
      if (context.isUpdating) {
        fieldErrors[`${path}.medicineId`] = [
          "Select a pharmacy medicine or remove this row before saving.",
        ];
      } else {
        fieldErrors[`${path}.medicineId`] = [
          "Pharmacy medicine is required for medicine charge items.",
        ];
      }
    }
  });

  const requestedQuantityByMedicineId = new Map<number, number>();
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item.medicineId === null || item.medicineId === undefined) continue;
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      fieldErrors[`medicineChargeItems.${index}.quantity`] = [
        "Quantity must be a positive whole number.",
      ];
      continue;
    }
    requestedQuantityByMedicineId.set(
      item.medicineId,
      (requestedQuantityByMedicineId.get(item.medicineId) ?? 0) +
        item.quantity,
    );
  }

  const medicines = await tx.medicine.findMany({
    where: {
      id: { in: [...requestedQuantityByMedicineId.keys()] },
    },
    select: {
      id: true,
      genericName: true,
      brandName: true,
      isActive: true,
      currentStock: true,
      defaultSalePrice: true,
      group: { select: { id: true, name: true } },
      purchases: {
        where: { remainingQty: { gt: 0 } },
        orderBy: { purchaseDate: "asc" },
        take: 1,
        select: {
          company: { select: { name: true } },
        },
      },
    },
  });
  const medicineById = new Map(
    medicines.map((medicine) => [medicine.id, medicine]),
  );

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.medicineId === null || item.medicineId === undefined) {
      continue;
    }

    const path = `medicineChargeItems.${i}`;
    const medicineId = item.medicineId;
    const medicine = medicineById.get(medicineId);

    if (!medicine || !medicine.isActive) {
      fieldErrors[`${path}.medicineId`] = [
        "Selected pharmacy medicine is not available.",
      ];
      continue;
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      continue;
    }
    const quantity = item.quantity;
    const submittedUnitPrice =
      item.unitPrice === undefined || item.unitPrice === null
        ? Number.NaN
        : Number(item.unitPrice);

    const totalRequested =
      requestedQuantityByMedicineId.get(medicine.id) ?? quantity;
    if (medicine.currentStock < totalRequested) {
      fieldErrors[`${path}.quantity`] = [
        `Insufficient stock. Available: ${medicine.currentStock}, Requested: ${totalRequested}`,
      ];
    }

    let unitPrice: number;
    if (context.medicineBillingEnabled) {
      if (!Number.isFinite(submittedUnitPrice) || submittedUnitPrice <= 0) {
        fieldErrors[`${path}.unitPrice`] = [
          "Medicine price must be greater than 0.",
        ];
        continue;
      }
      unitPrice = submittedUnitPrice;
    } else {
      // Inventory-only admission: trust the live `defaultSalePrice` as
      // the authoritative inventory snapshot. The client's submitted
      // value (if any) is ignored for the snapshot but still tolerated
      // because the UI no longer renders a price field — a stray
      // non-finite value must not block admission creation.
      const livePrice = Number(medicine.defaultSalePrice);
      unitPrice = Number.isFinite(livePrice) && livePrice > 0 ? livePrice : 0;
    }

    const displayName = medicine.brandName?.trim() || medicine.genericName;

    normalized.push({
      medicineId: medicine.id,
      packageCode: item.packageCode?.trim() || null,
      operationName: item.operationName.trim(),
      requestedMedicineName: item.requestedMedicineName?.trim() || null,
      medicineName: displayName,
      genericName: medicine.genericName,
      groupName: medicine.group.name,
      companyName: medicine.purchases[0]?.company.name ?? null,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
    });
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AdmissionMedicineValidationError(
      "Admission medicine items have validation errors.",
      fieldErrors,
    );
  }

  return normalized;
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
      where.dateAdmitted.lt = new Date(filters.endDate);
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

  if (filters.hasDue !== undefined) {
    where.dueAmount = filters.hasDue ? { gt: 0 } : { lte: 0 };
  }

  if (filters.hasDiscount !== undefined) {
    where.discountAmount = filters.hasDiscount ? { gt: 0 } : { lte: 0 };
  }

  if (filters.isDischarged !== undefined) {
    where.isDischarged = filters.isDischarged;
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
        medicineChargeItems: {
          orderBy: { id: "asc" },
        },
      },
      orderBy: {
        dateAdmitted: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.admission.count({ where }),
  ]);

  // The `medicineBillingEnabled` column is automatically included by the
  // findMany select without explicit `include` because it is a top-level
  // scalar column. We just need to ensure the typed return matches.

  const staffIds = Array.from(
    new Set(
      admissions
        .flatMap((admission) => [admission.createdBy, admission.lastModifiedBy])
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

  const enrichedAdmissions = admissions.map((admission) => ({
    ...admission,
    createdByName: staffNameMap.get(admission.createdBy) || null,
    lastModifiedByName: staffNameMap.get(admission.lastModifiedBy) || null,
  }));

  return { admissions: enrichedAdmissions, total };
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
      medicineChargeItems: {
        orderBy: { id: "asc" },
      },
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
    const configuredAdmissionFee = admissionFeeConfig
      ? parseFloat(admissionFeeConfig.value)
      : 300;
    const isCreatingCanceled = admissionData.status === "Canceled";
    const admissionFee = isCreatingCanceled ? 0 : configuredAdmissionFee;

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

    // 4. Generate admission number
    const department = await tx.department.findUnique({
      where: { id: admissionData.departmentId },
    });
    if (!department) {
      throw new Error("Department not found");
    }

    const departmentCode = getDepartmentCode(department.name);
    const currentYear = getTwoDigitYear();
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const yearEnd = new Date(new Date().getFullYear() + 1, 0, 1);

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

    // 5. Normalize medicine charge items
    //
    // The server owns the medicine-billing mode. It always uses
    // `DEFAULT_ADMISSION_MEDICINE_BILLING_ENABLED` for new admissions;
    // legacy billable admissions are only created by an explicit
    // backfill or by a future server-side override. The client never
    // controls this flag.
    const medicineBillingEnabled = !isCreatingCanceled
      ? DEFAULT_ADMISSION_MEDICINE_BILLING_ENABLED
      : false;

    const medicineItems = isCreatingCanceled
      ? []
      : await normalizeAdmissionMedicineChargeItems(
          admissionData.medicineChargeItems,
          tx,
          { isUpdating: false, medicineBillingEnabled },
        );

    // 6. Calculate financial fields
    const serviceCharge = isCreatingCanceled
      ? 0
      : (admissionData.serviceCharge ?? 0);
    const seatRent = isCreatingCanceled ? 0 : (admissionData.seatRent ?? 0);
    const otCharge = isCreatingCanceled ? 0 : (admissionData.otCharge ?? 0);
    const doctorCharge = isCreatingCanceled
      ? 0
      : (admissionData.doctorCharge ?? 0);
    const surgeonCharge = isCreatingCanceled
      ? 0
      : (admissionData.surgeonCharge ?? 0);
    const anesthesiaFee = isCreatingCanceled
      ? 0
      : (admissionData.anesthesiaFee ?? 0);
    const assistantDoctorFee = isCreatingCanceled
      ? 0
      : (admissionData.assistantDoctorFee ?? 0);
    const otherCharges = isCreatingCanceled
      ? 0
      : (admissionData.otherCharges ?? 0);

    // Effective billed medicine charge: zero in inventory-only mode,
    // sum of row totals in legacy billable mode.
    const inventoryMedicineValue =
      medicineItems.length > 0
        ? medicineItems.reduce((sum, item) => sum + item.totalAmount, 0)
        : 0;
    const billedMedicineCharge = isCreatingCanceled
      ? 0
      : medicineBillingEnabled
        ? inventoryMedicineValue
        : 0;
    const medicineCharge = billedMedicineCharge;

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

    let discountAmount = 0;
    const discountType = isCreatingCanceled
      ? null
      : (admissionData.discountType ?? null);
    const discountValue = isCreatingCanceled
      ? null
      : (admissionData.discountValue ?? null);
    if (discountType && discountValue) {
      if (discountType === "percentage") {
        discountAmount = (totalAmount * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
    }
    discountAmount = Math.min(discountAmount, totalAmount);

    const grandTotal = totalAmount - discountAmount;

    const submittedPaidAmount = admissionData.paidAmount;
    let paidAmount: number;
    if (isCreatingCanceled) {
      paidAmount = 0;
    } else if (submittedPaidAmount !== undefined) {
      paidAmount = Math.max(0, Math.min(submittedPaidAmount, grandTotal));
    } else {
      paidAmount = admissionFee;
      paidAmount = Math.min(paidAmount, grandTotal);
    }

    const dueAmount = grandTotal - paidAmount;
    const status = admissionData.status ?? "Admitted";

    // 7. Create admission record
    const admission = await tx.admission.create({
      data: {
        patientId: patient.id,
        departmentId: admissionData.departmentId,
        doctorId: admissionData.doctorId,
        admissionNumber,
        status,
        admissionFee,
        serviceCharge,
        seatRent,
        otCharge,
        doctorCharge,
        surgeonCharge,
        anesthesiaFee,
        assistantDoctorFee,
        medicineCharge,
        medicineBillingEnabled,
        otherCharges,
        totalAmount,
        discountType,
        discountValue: discountValue !== null ? discountValue : undefined,
        discountAmount,
        grandTotal,
        paidAmount,
        dueAmount,
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
        medicineChargeItems: true,
      },
    });

    // 8. Create medicine charge items and linked pharmacy sales
    const createdChargeRows: Array<{
      id: number;
      medicineId: number | null;
      quantity: number;
      unitPrice: number | Prisma.Decimal;
    }> = [];
    if (medicineItems.length > 0) {
      for (const item of medicineItems) {
        const charge = await tx.admissionMedicineCharge.create({
          data: {
            admissionId: admission.id,
            medicineId: item.medicineId,
            packageCode: item.packageCode,
            operationName: item.operationName,
            requestedMedicineName: item.requestedMedicineName,
            medicineName: item.medicineName,
            genericName: item.genericName,
            groupName: item.groupName,
            companyName: item.companyName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
            createdBy: staffId,
            lastModifiedBy: staffId,
          },
          select: {
            id: true,
            medicineId: true,
            quantity: true,
            unitPrice: true,
          },
        });
        createdChargeRows.push(charge);
      }
    }

    // 8b. Create linked FIFO medicine sales for each charge row
    for (const charge of createdChargeRows) {
      if (charge.medicineId === null) continue;
      await createSaleWithTx(
        tx,
        {
          patientId: patient.id,
          medicineId: charge.medicineId,
          quantity: charge.quantity,
          unitPrice: Number(charge.unitPrice),
          saleDate: admission.dateAdmitted,
        },
        staffId,
        userId,
        activityLogContext,
        {
          admissionId: admission.id,
          admissionMedicineChargeId: charge.id,
        },
      );
    }

    // 9. Create patient account if doesn't exist
    let patientAccount = await tx.patientAccount.findUnique({
      where: { patientId: patient.id },
    });

    if (!patientAccount) {
      patientAccount = await tx.patientAccount.create({
        data: {
          patientId: patient.id,
          totalCharges: grandTotal,
          totalPaid: paidAmount,
          totalDue: dueAmount,
        },
      });
    } else {
      patientAccount = await tx.patientAccount.update({
        where: { id: patientAccount.id },
        data: {
          totalCharges: { increment: grandTotal },
          totalPaid: { increment: paidAmount },
          totalDue: { increment: dueAmount },
        },
      });
    }

    // 10. Create service charge record
    const serviceChargeRecord = await tx.serviceCharge.create({
      data: {
        patientAccountId: patientAccount.id,
        serviceType: "ADMISSION",
        serviceName: `Admission - ${admissionNumber}`,
        departmentId: admissionData.departmentId,
        originalAmount: totalAmount,
        discountAmount: discountAmount,
        finalAmount: grandTotal,
        admissionId: admission.id,
        createdBy: staffId,
      },
    });

    // 11. Create Payment and Cash Movement if paidAmount > 0
    if (paidAmount > 0) {
      const activeShift = shiftId
        ? { id: shiftId }
        : await shiftService.ensureActiveShift(staffId, tx);

      const paymentCount = await tx.payment.count();
      const receiptNumber = `RCP-${Date.now()}-${paymentCount + 1}`;

      const payment = await tx.payment.create({
        data: {
          patientAccountId: patientAccount.id,
          amount: new Prisma.Decimal(paidAmount),
          paymentMethod: "Cash",
          collectedById: staffId,
          shiftId: activeShift.id,
          receiptNumber,
          notes: `Initial payment for ${admissionNumber}`,
          paymentAllocations: {
            create: {
              serviceChargeId: serviceChargeRecord.id,
              allocatedAmount: new Prisma.Decimal(paidAmount),
            },
          },
        },
      });

      await tx.cashMovement.create({
        data: {
          shiftId: activeShift.id,
          amount: new Prisma.Decimal(paidAmount),
          movementType: "COLLECTION",
          description: `Payment collection for ${admissionNumber}`,
          paymentId: payment.id,
        },
      });

      await tx.shift.update({
        where: { id: activeShift.id },
        data: {
          systemCash: { increment: paidAmount },
          totalCollected: { increment: paidAmount },
        },
      });
    }

    // 12. Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Created admission ${admissionNumber} for ${patient.fullName}. Grand Total: BDT ${grandTotal}, Paid: BDT ${paidAmount}`,
        entityType: "Admission",
        entityId: admission.id,
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

    // 13. Refetch admission with medicine items
    const admissionWithItems = await tx.admission.findUnique({
      where: { id: admission.id },
      include: {
        patient: {
          include: {
            hospital: true,
          },
        },
        department: true,
        doctor: true,
        medicineChargeItems: {
          orderBy: { id: "asc" },
        },
      },
    });

    return {
      admission: admissionWithItems ?? admission,
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
    patient?: PatientData;
    doctorId?: number;
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
    medicineChargeItems?: AdmissionMedicineChargeItemInput[];
  },
  staffId: number,
  userId: number,
  shiftId: number | null,
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

    if (
      updateData.patient &&
      updateData.patient.id !== null &&
      updateData.patient.id !== undefined &&
      updateData.patient.id !== existingAdmission.patientId
    ) {
      throw new Error(
        "Cannot change the patient linked to an existing admission.",
      );
    }

    if (updateData.patient) {
      await tx.patient.update({
        where: { id: existingAdmission.patientId },
        data: {
          firstName: updateData.patient.firstName,
          lastName: updateData.patient.lastName || null,
          fullName: updateData.patient.fullName,
          gender: updateData.patient.gender,
          dateOfBirth: updateData.patient.dateOfBirth,
          address: updateData.patient.address || null,
          phoneNumber: updateData.patient.phoneNumber || null,
          email: updateData.patient.email || null,
          bloodGroup: updateData.patient.bloodGroup || null,
          guardianName: updateData.patient.guardianName || null,
          guardianPhone: updateData.patient.guardianPhone || null,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "UPDATE",
          description: `Updated patient details for admission ${existingAdmission.admissionNumber}`,
          entityType: "Patient",
          entityId: existingAdmission.patientId,
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
    }

    const isCanceling = updateData.status === "Canceled";
    const isRestoring =
      existingAdmission.status === "Canceled" &&
      updateData.status !== "Canceled";

    // Handle medicine charge items + linked pharmacy sales
    const recreatedChargeRows: Array<{
      id: number;
      medicineId: number | null;
      quantity: number;
      unitPrice: number | Prisma.Decimal;
    }> = [];

    if (isCanceling) {
      // Always reverse linked pharmacy stock first, then drop charge rows
      await reverseAdmissionMedicineSales(tx, id);
      await tx.admissionMedicineCharge.deleteMany({
        where: { admissionId: id },
      });
    } else if (updateData.medicineChargeItems !== undefined) {
      // Reverse any previously linked sales (stock + rows), then rebuild
      await reverseAdmissionMedicineSales(tx, id);
      await tx.admissionMedicineCharge.deleteMany({
        where: { admissionId: id },
      });

      const medicineItems = await normalizeAdmissionMedicineChargeItems(
        updateData.medicineChargeItems,
        tx,
        {
          isUpdating: true,
          medicineBillingEnabled: existingAdmission.medicineBillingEnabled,
        },
      );

      for (const item of medicineItems) {
        const charge = await tx.admissionMedicineCharge.create({
          data: {
            admissionId: id,
            medicineId: item.medicineId,
            packageCode: item.packageCode,
            operationName: item.operationName,
            requestedMedicineName: item.requestedMedicineName,
            medicineName: item.medicineName,
            genericName: item.genericName,
            groupName: item.groupName,
            companyName: item.companyName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
            createdBy: staffId,
            lastModifiedBy: staffId,
          },
          select: {
            id: true,
            medicineId: true,
            quantity: true,
            unitPrice: true,
          },
        });
        recreatedChargeRows.push(charge);
      }

      for (const charge of recreatedChargeRows) {
        if (charge.medicineId === null) continue;
        await createSaleWithTx(
          tx,
          {
            patientId: existingAdmission.patientId,
            medicineId: charge.medicineId,
            quantity: charge.quantity,
            unitPrice: Number(charge.unitPrice),
            saleDate: existingAdmission.dateAdmitted,
          },
          staffId,
          userId,
          activityLogContext,
          {
            admissionId: id,
            admissionMedicineChargeId: charge.id,
          },
        );
      }
    }

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
      paidAmountNew = 0;
    } else if (isRestoring) {
      admissionFee = 300;
      serviceCharge = updateData.serviceCharge ?? 0;
      seatRent = updateData.seatRent ?? 0;
      otCharge = updateData.otCharge ?? 0;
      doctorCharge = updateData.doctorCharge ?? 0;
      surgeonCharge = updateData.surgeonCharge ?? 0;
      anesthesiaFee = updateData.anesthesiaFee ?? 0;
      assistantDoctorFee = updateData.assistantDoctorFee ?? 0;
      otherCharges = updateData.otherCharges ?? 0;
      paidAmountNew = updateData.paidAmount ?? 0;

      if (existingAdmission.medicineBillingEnabled) {
        if (
          updateData.medicineChargeItems !== undefined &&
          updateData.medicineChargeItems.length > 0
        ) {
          // The actual normalization/validation has already happened
          // above where the charge rows are recreated. Here we only need
          // the total for the financial summary.
          const existingCharges = await tx.admissionMedicineCharge.findMany({
            where: { admissionId: id },
            select: { totalAmount: true },
          });
          medicineCharge = existingCharges.reduce(
            (sum, item) => sum + Number(item.totalAmount),
            0,
          );
        } else {
          medicineCharge = updateData.medicineCharge ?? 0;
        }
      } else {
        // Inventory-only restore: medicines are still dispensed (stock is
        // re-deducted), but they never enter the admission bill.
        medicineCharge = 0;
      }
    } else {
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
      otherCharges =
        updateData.otherCharges ?? Number(existingAdmission.otherCharges);
      paidAmountNew =
        updateData.paidAmount ?? Number(existingAdmission.paidAmount);

      if (existingAdmission.medicineBillingEnabled) {
        if (
          updateData.medicineChargeItems !== undefined &&
          updateData.medicineChargeItems.length > 0
        ) {
          // Same as above — re-read totals from the freshly inserted rows
          const existingCharges = await tx.admissionMedicineCharge.findMany({
            where: { admissionId: id },
            select: { totalAmount: true },
          });
          medicineCharge = existingCharges.reduce(
            (sum, item) => sum + Number(item.totalAmount),
            0,
          );
        } else {
          medicineCharge =
            updateData.medicineCharge ??
            Number(existingAdmission.medicineCharge);
        }
      } else {
        // Inventory-only: the effective billed charge is always zero
        // regardless of what the rows snapshot. The submitted value
        // (if any) is ignored.
        medicineCharge = 0;
      }
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

    const oldPaidAmount = Number(existingAdmission.paidAmount);
    const paidAmountDiff = paidAmount - oldPaidAmount;

    const updatedAdmission = await tx.admission.update({
      where: { id },
      data: {
        doctorId: updateData.doctorId ?? existingAdmission.doctorId,
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
        admissionFee,
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
        medicineChargeItems: {
          orderBy: { id: "asc" },
        },
      },
    });

    await tx.serviceCharge.updateMany({
      where: { admissionId: id },
      data: {
        originalAmount: totalAmount,
        discountAmount: discountAmount,
        finalAmount: grandTotal,
      },
    });

    if (paidAmountDiff !== 0) {
      const activeShift = shiftId
        ? { id: shiftId }
        : await shiftService.ensureActiveShift(staffId, tx);

      const existingServiceCharge = await tx.serviceCharge.findFirst({
        where: { admissionId: id },
      });

      if (paidAmountDiff > 0) {
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
            patientAccountId: patientAccountForPayment.id,
            amount: new Prisma.Decimal(paidAmountDiff),
            paymentMethod: "Cash",
            collectedById: staffId,
            shiftId: activeShift.id,
            receiptNumber,
            notes: `Payment for admission ${existingAdmission.admissionNumber}`,
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
        const refundAmount = Math.abs(paidAmountDiff);

        let originalPaymentId: number | undefined;
        if (existingServiceCharge) {
          const originalPayment = await tx.payment.findFirst({
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

        await tx.cashMovement.create({
          data: {
            shiftId: activeShift.id,
            amount: new Prisma.Decimal(refundAmount),
            movementType: "REFUND",
            description: `Refund for ${existingAdmission.admissionNumber}`,
            ...(originalPaymentId && { paymentId: originalPaymentId }),
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

    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated admission ${existingAdmission.admissionNumber} for ${existingAdmission.patient.fullName}`,
        entityType: "Admission",
        entityId: updatedAdmission.id,
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

    // 0. Reverse any pharmacy sales linked to this admission so we don't
    //    leave phantom stock deductions behind.
    await reverseAdmissionMedicineSales(tx, id);

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

type AdmissionWithRelations = Prisma.AdmissionGetPayload<{
  include: {
    patient: {
      include: {
        hospital: true;
      };
    };
    department: true;
    doctor: true;
    medicineChargeItems: true;
  };
}> & {
  medicineBillingEnabled: boolean;
  createdByName?: string | null;
  lastModifiedByName?: string | null;
};

export function transformAdmissionForResponse(admission: AdmissionWithRelations) {
  return {
    id: admission.id,
    admissionNumber: admission.admissionNumber,
    patientId: admission.patientId,
    patientFirstName: admission.patient.firstName,
    patientLastName: admission.patient.lastName || null,
    patientFullName: admission.patient.fullName,
    patientDateOfBirth: serializeDateOfBirth(admission.patient.dateOfBirth),
    patientAge: getAgeInYearsFromDateOfBirth(admission.patient.dateOfBirth),
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
    medicineBillingEnabled: admission.medicineBillingEnabled,
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
    createdByName: admission.createdByName || null,
    lastModifiedByName: admission.lastModifiedByName || null,
    medicineChargeItems: (admission.medicineChargeItems ?? []).map((item) => ({
      id: item.id,
      medicineId: item.medicineId,
      packageCode: item.packageCode,
      operationName: item.operationName,
      requestedMedicineName: item.requestedMedicineName,
      medicineName: item.medicineName,
      genericName: item.genericName,
      groupName: item.groupName,
      companyName: item.companyName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalAmount: Number(item.totalAmount),
    })),
  };
}
