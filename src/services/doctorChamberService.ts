import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DOCTOR_CHAMBER_CONFIG,
  DOCTOR_CHAMBER_TESTS,
  getDoctorChamberTest,
  isDoctorChamberTestCode,
  type DoctorChamberQuerySchema,
  type DoctorChamberTestCode,
  type DoctorChamberVisitSchema,
  type DoctorChamberVisitRecord,
} from "@/lib/doctorChamber";
import { serializeDateOfBirth } from "@/lib/dateOfBirth";
import {
  formatRegistrationNumber,
  getTwoDigitYear,
  parseRegistrationNumber,
} from "@/lib/registrationNumber";
import type { SessionDeviceInfo } from "@/types/auth";

export interface DoctorChamberActivityContext {
  sessionId?: string;
  deviceInfo?: SessionDeviceInfo;
}

const chamberVisitSelect = Prisma.validator<Prisma.DoctorChamberVisitSelect>()({
  id: true,
  visitNumber: true,
  visitDate: true,
  doctorId: true,
  patientId: true,
  ultrasoundCharge: true,
  visitingCharge: true,
  subtotal: true,
  discountType: true,
  discountValue: true,
  discountAmount: true,
  totalAmount: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  lastModifiedBy: true,
  doctor: {
    select: {
      fullName: true,
    },
  },
  department: {
    select: {
      name: true,
    },
  },
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      gender: true,
      dateOfBirth: true,
      address: true,
      phoneNumber: true,
      email: true,
      bloodGroup: true,
      guardianName: true,
      guardianGender: true,
      guardianPhone: true,
      guardianAddress: true,
      guardianEmail: true,
    },
  },
  fees: {
    select: {
      id: true,
      feeName: true,
      amount: true,
      feeType: true,
      testCode: true,
    },
    orderBy: {
      id: "asc",
    },
  },
});

type ChamberVisitWithDetails = Prisma.DoctorChamberVisitGetPayload<{
  select: typeof chamberVisitSelect;
}>;

function getDoctorWhere(): Prisma.StaffWhereInput {
  return {
    role: {
      equals: "Doctor",
      mode: "insensitive",
    },
    AND: [
      {
        fullName: {
          contains: DOCTOR_CHAMBER_CONFIG.doctorSearchFirstName,
          mode: "insensitive",
        },
      },
      {
        fullName: {
          contains: DOCTOR_CHAMBER_CONFIG.doctorSearchLastName,
          mode: "insensitive",
        },
      },
    ],
  };
}

async function findConfiguredDoctor(
  client: Prisma.TransactionClient | typeof prisma,
) {
  const doctor = await client.staff.findFirst({
    where: getDoctorWhere(),
    select: {
      id: true,
      fullName: true,
      specialization: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (!doctor) {
    throw new Error(
      `Configured doctor ${DOCTOR_CHAMBER_CONFIG.doctorDisplayName} was not found`,
    );
  }

  return doctor;
}

async function getOrCreateDepartment(tx: Prisma.TransactionClient) {
  const existing = await tx.department.findUnique({
    where: { name: DOCTOR_CHAMBER_CONFIG.departmentName },
    select: { id: true, name: true },
  });

  if (existing) {
    return existing;
  }

  return tx.department.create({
    data: {
      name: DOCTOR_CHAMBER_CONFIG.departmentName,
      description: "Private chamber visits for Dr Sufia Khatun",
      isActive: true,
    },
    select: { id: true, name: true },
  });
}

async function getNextVisitNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = getTwoDigitYear();
  const prefix = `${DOCTOR_CHAMBER_CONFIG.visitNumberPrefix}-${year}-`;
  const latest = await tx.doctorChamberVisit.findFirst({
    where: {
      visitNumber: {
        startsWith: prefix,
      },
    },
    select: {
      visitNumber: true,
    },
    orderBy: {
      visitNumber: "desc",
    },
  });

  const sequence = latest
    ? parseRegistrationNumber(latest.visitNumber)?.sequence ?? 0
    : 0;

  return formatRegistrationNumber(
    DOCTOR_CHAMBER_CONFIG.visitNumberPrefix,
    year,
    sequence + 1,
  );
}

function getFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getSelectedTestDefinitions(input: DoctorChamberVisitSchema) {
  return input.selectedTests.map((code) => getDoctorChamberTest(code));
}

function getBillingAmounts(input: DoctorChamberVisitSchema) {
  const selectedTests = getSelectedTestDefinitions(input);
  const legacyUltrasoundCharge = input.includeUltrasound && selectedTests.length === 0
    ? DOCTOR_CHAMBER_CONFIG.ultrasoundCharge
    : 0;
  const visitingCharge = DOCTOR_CHAMBER_CONFIG.visitingCharge;
  const subtotal = roundCurrency(
    selectedTests.reduce((sum, test) => sum + test.amount, 0) +
      legacyUltrasoundCharge +
      visitingCharge +
      input.fees.reduce((sum, fee) => sum + fee.amount, 0),
  );
  const discountValue = input.discountValue ?? 0;
  const rawDiscountAmount =
    input.discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;
  const discountAmount = roundCurrency(Math.min(rawDiscountAmount, subtotal));

  return {
    selectedTests,
    legacyUltrasoundCharge,
    visitingCharge,
    subtotal,
    discountType: input.discountValue === null ? null : input.discountType,
    discountValue: input.discountValue,
    discountAmount,
    totalAmount: roundCurrency(subtotal - discountAmount),
  };
}

function getChargeDescription(
  input: DoctorChamberVisitSchema,
  billing: ReturnType<typeof getBillingAmounts>,
): string {
  const extraCharges = input.fees.map(
    (fee) => `${fee.feeName.trim()}: BDT ${fee.amount.toFixed(2)}`,
  );

  const chargeLines = [
    ...billing.selectedTests.map(
      (test) => `${test.name}: BDT ${test.amount.toFixed(2)}`,
    ),
    `Visit charge: BDT ${billing.visitingCharge.toFixed(2)}`,
    ...extraCharges,
  ];

  if (billing.legacyUltrasoundCharge > 0) {
    chargeLines.unshift(
      `${DOCTOR_CHAMBER_CONFIG.ultrasoundName}: BDT ${billing.legacyUltrasoundCharge.toFixed(2)}`,
    );
  }

  if (billing.discountAmount > 0) {
    chargeLines.push(
      `Discount: BDT ${billing.discountAmount.toFixed(2)}`,
    );
  }

  return chargeLines.join("; ");
}

function getPersistedFees(
  input: DoctorChamberVisitSchema,
  billing: ReturnType<typeof getBillingAmounts>,
  staffId: number,
) {
  return [
    ...billing.selectedTests.map((test) => ({
      feeName: test.name,
      amount: test.amount,
      feeType: "TEST",
      testCode: test.code,
      createdBy: staffId,
      lastModifiedBy: staffId,
    })),
    ...input.fees.map((fee) => ({
      feeName: fee.feeName.trim(),
      amount: fee.amount,
      feeType: "EXTRA",
      testCode: null,
      createdBy: staffId,
      lastModifiedBy: staffId,
    })),
  ];
}

async function upsertPatient(
  tx: Prisma.TransactionClient,
  patientInput: DoctorChamberVisitSchema["patient"],
  staffId: number,
  existingPatientId?: number,
) {
  const fullName = getFullName(patientInput.firstName, patientInput.lastName);
  const data = {
    firstName: patientInput.firstName.trim(),
    lastName: patientInput.lastName.trim() || null,
    fullName,
    gender: patientInput.gender.trim(),
    dateOfBirth: patientInput.dateOfBirth,
    address: patientInput.address.trim() || null,
    phoneNumber: patientInput.phoneNumber.trim() || null,
    email: patientInput.email.trim() || null,
    bloodGroup: patientInput.bloodGroup.trim() || null,
    guardianName: patientInput.guardianName.trim() || null,
    guardianGender: patientInput.guardianGender.trim() || null,
    guardianPhone: patientInput.guardianPhone.trim() || null,
    guardianAddress: patientInput.guardianAddress.trim() || null,
    guardianEmail: patientInput.guardianEmail.trim() || null,
  };

  if (existingPatientId) {
    return tx.patient.update({
      where: { id: existingPatientId },
      data,
      select: {
        id: true,
        fullName: true,
      },
    });
  }

  return tx.patient.create({
    data: {
      ...data,
      createdBy: staffId,
    },
    select: {
      id: true,
      fullName: true,
    },
  });
}

async function ensurePatientAccount(
  tx: Prisma.TransactionClient,
  patientId: number,
) {
  return tx.patientAccount.upsert({
    where: { patientId },
    create: {
      patientId,
      totalCharges: 0,
      totalPaid: 0,
      totalDue: 0,
    },
    update: {},
    select: {
      id: true,
    },
  });
}

function toNumber(value: Prisma.Decimal | number): number {
  return Number(value);
}

function serializeVisit(
  visit: ChamberVisitWithDetails,
  staffNames: Map<number, string>,
): DoctorChamberVisitRecord {
  return {
    id: visit.id,
    visitNumber: visit.visitNumber,
    visitDate: visit.visitDate.toISOString(),
    doctorId: visit.doctorId,
    doctorName: visit.doctor.fullName,
    departmentName: visit.department.name,
    patientId: visit.patient.id,
    patientFirstName: visit.patient.firstName,
    patientLastName: visit.patient.lastName,
    patientFullName: visit.patient.fullName,
    patientGender: visit.patient.gender,
    patientDateOfBirth: serializeDateOfBirth(visit.patient.dateOfBirth),
    patientAddress: visit.patient.address,
    patientPhoneNumber: visit.patient.phoneNumber,
    patientEmail: visit.patient.email,
    patientBloodGroup: visit.patient.bloodGroup,
    guardianName: visit.patient.guardianName,
    guardianGender: visit.patient.guardianGender,
    guardianPhone: visit.patient.guardianPhone,
    guardianAddress: visit.patient.guardianAddress,
    guardianEmail: visit.patient.guardianEmail,
    tests: visit.fees
      .filter((fee) => fee.feeType === "TEST" && isDoctorChamberTestCode(fee.testCode))
      .map((fee) => ({
        id: fee.id,
        code: fee.testCode as DoctorChamberTestCode,
        name: fee.feeName,
        amount: toNumber(fee.amount),
      })),
    ultrasoundCode: DOCTOR_CHAMBER_CONFIG.ultrasoundCode,
    ultrasoundName: DOCTOR_CHAMBER_CONFIG.ultrasoundName,
    ultrasoundCharge: toNumber(visit.ultrasoundCharge),
    visitingCharge: toNumber(visit.visitingCharge),
    subtotal: toNumber(visit.subtotal),
    discountType:
      visit.discountType === "percentage" || visit.discountType === "value"
        ? visit.discountType
        : null,
    discountValue:
      visit.discountValue === null ? null : toNumber(visit.discountValue),
    discountAmount: toNumber(visit.discountAmount),
    fees: visit.fees
      .filter((fee) => fee.feeType !== "TEST")
      .map((fee) => ({
        id: fee.id,
        feeName: fee.feeName,
        amount: toNumber(fee.amount),
      })),
    totalAmount: toNumber(visit.totalAmount),
    notes: visit.notes,
    createdAt: visit.createdAt.toISOString(),
    updatedAt: visit.updatedAt.toISOString(),
    createdBy: visit.createdBy,
    createdByName: staffNames.get(visit.createdBy) ?? null,
    lastModifiedBy: visit.lastModifiedBy,
    lastModifiedByName: staffNames.get(visit.lastModifiedBy) ?? null,
  };
}

async function serializeVisits(
  visits: ChamberVisitWithDetails[],
): Promise<DoctorChamberVisitRecord[]> {
  const staffIds = Array.from(
    new Set(visits.flatMap((visit) => [visit.createdBy, visit.lastModifiedBy])),
  );
  const staff = staffIds.length
    ? await prisma.staff.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const staffNames = new Map(staff.map((member) => [member.id, member.fullName]));

  return visits.map((visit) => serializeVisit(visit, staffNames));
}

function buildWhere(
  doctorId: number,
  filters: DoctorChamberQuerySchema,
): Prisma.DoctorChamberVisitWhereInput {
  const where: Prisma.DoctorChamberVisitWhereInput = {
    doctorId,
  };

  if (filters.search) {
    where.OR = [
      {
        visitNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        patient: {
          OR: [
            { fullName: { contains: filters.search, mode: "insensitive" } },
            { phoneNumber: { contains: filters.search } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  if (filters.startDate || filters.endDate) {
    where.visitDate = {};
    if (filters.startDate) {
      where.visitDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.visitDate.lt = new Date(filters.endDate);
    }
  }

  return where;
}

export async function getDoctorChamberConfig() {
  const doctor = await findConfiguredDoctor(prisma);
  return {
    doctorId: doctor.id,
    doctorName: doctor.fullName,
    specialization: doctor.specialization,
    departmentName: DOCTOR_CHAMBER_CONFIG.departmentName,
    visitingCharge: DOCTOR_CHAMBER_CONFIG.visitingCharge,
    tests: [...DOCTOR_CHAMBER_TESTS],
    ultrasoundCode: DOCTOR_CHAMBER_CONFIG.ultrasoundCode,
    ultrasoundName: DOCTOR_CHAMBER_CONFIG.ultrasoundName,
    ultrasoundCharge: DOCTOR_CHAMBER_CONFIG.ultrasoundCharge,
  };
}

export async function getDoctorChamberVisits(
  filters: DoctorChamberQuerySchema,
  fetchAll = false,
) {
  const doctor = await findConfiguredDoctor(prisma);
  const where = buildWhere(doctor.id, filters);
  const page = filters.page;
  const limit = filters.limit;

  const [total, visits] = await Promise.all([
    prisma.doctorChamberVisit.count({ where }),
    prisma.doctorChamberVisit.findMany({
      where,
      select: chamberVisitSelect,
      orderBy: {
        visitDate: "desc",
      },
      ...(fetchAll ? {} : { skip: (page - 1) * limit, take: limit }),
    }),
  ]);

  const data = await serializeVisits(visits);
  const totalAmount = data.reduce((sum, visit) => sum + visit.totalAmount, 0);

  return {
    data,
    total,
    page,
    limit,
    totalPages: fetchAll ? 1 : Math.ceil(total / limit),
    summary: {
      visits: total,
      totalTestCharges: data.reduce(
        (sum, visit) =>
          sum +
          visit.tests.reduce((testSum, test) => testSum + test.amount, 0),
        0,
      ),
      totalUltrasoundCharges: data.reduce(
        (sum, visit) => sum + visit.ultrasoundCharge,
        0,
      ),
      totalVisitingCharges: data.reduce(
        (sum, visit) => sum + visit.visitingCharge,
        0,
      ),
      totalAmount,
    },
    doctor: {
      id: doctor.id,
      name: doctor.fullName,
      specialization: doctor.specialization,
    },
  };
}

export async function getDoctorChamberVisitById(id: number) {
  const doctor = await findConfiguredDoctor(prisma);
  const visit = await prisma.doctorChamberVisit.findFirst({
    where: {
      id,
      doctorId: doctor.id,
    },
    select: chamberVisitSelect,
  });

  if (!visit) {
    return null;
  }

  const [serialized] = await serializeVisits([visit]);
  return serialized;
}

export async function createDoctorChamberVisit(
  input: DoctorChamberVisitSchema,
  staffId: number,
  userId: number,
  activityLogContext?: DoctorChamberActivityContext,
) {
  return prisma.$transaction(async (tx) => {
    const doctor = await findConfiguredDoctor(tx);
    const department = await getOrCreateDepartment(tx);
    const patient = await upsertPatient(tx, input.patient, staffId);
    const visitNumber = await getNextVisitNumber(tx);
    const billing = getBillingAmounts(input);

    const visit = await tx.doctorChamberVisit.create({
      data: {
        patientId: patient.id,
        departmentId: department.id,
        doctorId: doctor.id,
        visitNumber,
        ultrasoundCharge: billing.legacyUltrasoundCharge,
        visitingCharge: billing.visitingCharge,
        subtotal: billing.subtotal,
        discountType: billing.discountType,
        discountValue: billing.discountValue,
        discountAmount: billing.discountAmount,
        totalAmount: billing.totalAmount,
        notes: input.notes.trim() || null,
        createdBy: staffId,
        lastModifiedBy: staffId,
        fees: {
          create: getPersistedFees(input, billing, staffId),
        },
      },
      select: { id: true },
    });

    const patientAccount = await ensurePatientAccount(tx, patient.id);
    await tx.patientAccount.update({
      where: { id: patientAccount.id },
      data: {
        totalCharges: { increment: billing.totalAmount },
        totalDue: { increment: billing.totalAmount },
      },
    });

    await tx.serviceCharge.create({
      data: {
        patientAccountId: patientAccount.id,
        serviceType: "DOCTOR_CHAMBER_VISIT",
        serviceName: `Dr Sufia Khatun Chamber - ${visitNumber}`,
        departmentId: department.id,
        originalAmount: billing.subtotal,
        discountAmount: billing.discountAmount,
        finalAmount: billing.totalAmount,
        description: getChargeDescription(input, billing),
        doctorChamberVisitId: visit.id,
        createdBy: staffId,
      },
    });

    await tx.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        description: `Created Dr Sufia Khatun chamber visit ${visitNumber} for ${patient.fullName}. Total: BDT ${billing.totalAmount.toFixed(2)}`,
        entityType: "DoctorChamberVisit",
        entityId: visit.id,
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
      id: visit.id,
      visitNumber,
    };
  });
}

export async function updateDoctorChamberVisit(
  id: number,
  input: DoctorChamberVisitSchema,
  staffId: number,
  userId: number,
  activityLogContext?: DoctorChamberActivityContext,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.doctorChamberVisit.findUnique({
      where: { id },
      select: {
        id: true,
        patientId: true,
        totalAmount: true,
        visitNumber: true,
        doctorId: true,
      },
    });

    if (!existing) {
      throw new Error("Doctor chamber visit not found");
    }

    const doctor = await findConfiguredDoctor(tx);
    if (existing.doctorId !== doctor.id) {
      throw new Error("This visit does not belong to the configured doctor");
    }

    if (input.patient.id !== null && input.patient.id !== existing.patientId) {
      throw new Error("The patient cannot be changed while editing a visit");
    }

    const department = await getOrCreateDepartment(tx);
    await upsertPatient(tx, input.patient, staffId, existing.patientId);
    const billing = getBillingAmounts(input);
    const totalDifference = billing.totalAmount - Number(existing.totalAmount);

    const updatedVisit = await tx.doctorChamberVisit.update({
      where: { id },
      data: {
        departmentId: department.id,
        ultrasoundCharge: billing.legacyUltrasoundCharge,
        visitingCharge: billing.visitingCharge,
        subtotal: billing.subtotal,
        discountType: billing.discountType,
        discountValue: billing.discountValue,
        discountAmount: billing.discountAmount,
        totalAmount: billing.totalAmount,
        notes: input.notes.trim() || null,
        lastModifiedBy: staffId,
        fees: {
          deleteMany: {},
          create: getPersistedFees(input, billing, staffId),
        },
      },
      select: { id: true },
    });

    if (totalDifference !== 0) {
      const patientAccount = await ensurePatientAccount(tx, existing.patientId);
      await tx.patientAccount.update({
        where: { id: patientAccount.id },
        data: {
          totalCharges: { increment: totalDifference },
          totalDue: { increment: totalDifference },
        },
      });
    }

    await tx.serviceCharge.updateMany({
      where: { doctorChamberVisitId: id },
      data: {
        departmentId: department.id,
        originalAmount: billing.subtotal,
        discountAmount: billing.discountAmount,
        finalAmount: billing.totalAmount,
        description: getChargeDescription(input, billing),
      },
    });

    const serviceCharge = await tx.serviceCharge.findFirst({
      where: { doctorChamberVisitId: id },
      select: { id: true },
    });

    if (!serviceCharge) {
      const patientAccount = await ensurePatientAccount(tx, existing.patientId);
      await tx.serviceCharge.create({
        data: {
          patientAccountId: patientAccount.id,
          serviceType: "DOCTOR_CHAMBER_VISIT",
          serviceName: `Dr Sufia Khatun Chamber - ${existing.visitNumber}`,
          departmentId: department.id,
          originalAmount: billing.subtotal,
          discountAmount: billing.discountAmount,
          finalAmount: billing.totalAmount,
          description: getChargeDescription(input, billing),
          doctorChamberVisitId: id,
          createdBy: staffId,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        userId,
        action: "UPDATE",
        description: `Updated Dr Sufia Khatun chamber visit ${existing.visitNumber}. Total: BDT ${billing.totalAmount.toFixed(2)}`,
        entityType: "DoctorChamberVisit",
        entityId: updatedVisit.id,
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
      id: updatedVisit.id,
      visitNumber: existing.visitNumber,
    };
  });
}
