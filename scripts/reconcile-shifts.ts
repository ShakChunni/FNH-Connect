/**
 * Shift, cash-ledger, and financial-total audit/repair.
 *
 * Dry run (safe):
 *   npm run db:audit-shifts
 *
 * Apply the reported repairs:
 *   npm run db:repair-shifts
 *
 * The repair is deliberately conservative:
 * - denormalized shift totals are rebuilt from payment/cash ledgers;
 * - dueAmount is rebuilt from grandTotal - paidAmount;
 * - active shifts with no unexpired session are closed at their last activity;
 * - an active general shift gets an empty paired infertility shift when it is
 *   missing, but historical shifts containing cash are never retargeted.
 */

import { PrismaClient } from "@prisma/client";
import { GENERAL_TO_INFERTILITY_TRANSFER_MARKER } from "../src/lib/infertilityTransfer";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const EPSILON = 0.005;
const COLLECTION_MOVEMENT_TYPES = new Set(["COLLECTION", "PAYMENT_RECEIVED"]);

function amount(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function differs(left: number, right: number): boolean {
  return Math.abs(left - right) > EPSILON;
}

function isTransferred(value: string | null): boolean {
  return value?.includes(GENERAL_TO_INFERTILITY_TRANSFER_MARKER) ?? false;
}

interface LedgerTotals {
  totalCollected: number;
  totalRefunded: number;
  systemCash: number;
}

interface GeneralShiftRow {
  id: number;
  staffId: number;
  startTime: Date;
  endTime: Date | null;
  isActive: boolean;
  openingCash: unknown;
  totalCollected: unknown;
  totalRefunded: unknown;
  systemCash: unknown;
  closingCash: unknown;
  variance: unknown;
}

interface InfertilityShiftRow extends GeneralShiftRow {
  sourceShiftId: number | null;
}

function calculateGeneralLedger(
  shift: GeneralShiftRow,
  payments: Array<{ amount: unknown; notes: string | null }>,
  movements: Array<{
    amount: unknown;
    movementType: string;
    description: string | null;
    paymentId: number | null;
  }>,
): LedgerTotals {
  const paymentCollections = payments
    .filter((payment) => !isTransferred(payment.notes))
    .reduce((sum, payment) => sum + amount(payment.amount), 0);
  const fallbackCollections = movements
    .filter(
      (movement) =>
        movement.paymentId === null &&
        COLLECTION_MOVEMENT_TYPES.has(movement.movementType) &&
        !isTransferred(movement.description),
    )
    .reduce((sum, movement) => sum + amount(movement.amount), 0);
  const totalRefunded = movements
    .filter(
      (movement) =>
        movement.movementType === "REFUND" &&
        !isTransferred(movement.description),
    )
    .reduce((sum, movement) => sum + amount(movement.amount), 0);
  const cashFloat = movements
    .filter(
      (movement) =>
        movement.movementType === "CASH_FLOAT" &&
        !isTransferred(movement.description),
    )
    .reduce((sum, movement) => sum + amount(movement.amount), 0);
  const changeGiven = movements
    .filter(
      (movement) =>
        movement.movementType === "CHANGE_GIVEN" &&
        !isTransferred(movement.description),
    )
    .reduce((sum, movement) => sum + amount(movement.amount), 0);
  const totalCollected = paymentCollections + fallbackCollections;

  return {
    totalCollected,
    totalRefunded,
    systemCash:
      amount(shift.openingCash) +
      totalCollected +
      cashFloat -
      changeGiven -
      totalRefunded,
  };
}

function calculateInfertilityLedger(
  shift: InfertilityShiftRow,
  payments: Array<{ amount: unknown; isMigrationSuperseded: boolean }>,
  movements: Array<{
    amount: unknown;
    movementType: string;
    paymentId: number | null;
    isMigrationSuperseded: boolean;
  }>,
): LedgerTotals {
  const livePayments = payments.filter(
    (payment) => !payment.isMigrationSuperseded,
  );
  const paymentCollections = livePayments.reduce(
    (sum, payment) => sum + amount(payment.amount),
    0,
  );
  const fallbackCollections = movements
    .filter(
      (movement) =>
        !movement.isMigrationSuperseded &&
        movement.paymentId === null &&
        COLLECTION_MOVEMENT_TYPES.has(movement.movementType),
    )
    .reduce((sum, movement) => sum + amount(movement.amount), 0);
  const totalRefunded = movements
    .filter(
      (movement) =>
        !movement.isMigrationSuperseded && movement.movementType === "REFUND",
    )
    .reduce((sum, movement) => sum + amount(movement.amount), 0);
  const cashFloat = movements
    .filter(
      (movement) =>
        !movement.isMigrationSuperseded &&
        movement.movementType === "CASH_FLOAT",
    )
    .reduce((sum, movement) => sum + amount(movement.amount), 0);
  const changeGiven = movements
    .filter(
      (movement) =>
        !movement.isMigrationSuperseded &&
        movement.movementType === "CHANGE_GIVEN",
    )
    .reduce((sum, movement) => sum + amount(movement.amount), 0);
  const totalCollected = paymentCollections + fallbackCollections;

  return {
    totalCollected,
    totalRefunded,
    systemCash:
      amount(shift.openingCash) +
      totalCollected +
      cashFloat -
      changeGiven -
      totalRefunded,
  };
}

function lastActivity(
  startTime: Date,
  payments: Array<{ paymentDate: Date }>,
  movements: Array<{ timestamp: Date }>,
): Date {
  return [
    startTime,
    ...payments.map((payment) => payment.paymentDate),
    ...movements.map((movement) => movement.timestamp),
  ].reduce((latest, candidate) =>
    candidate.getTime() > latest.getTime() ? candidate : latest,
  );
}

async function main() {
  const now = new Date();
  console.log(`${APPLY ? "APPLY" : "AUDIT"} shift reconciliation`);
  console.log(`Cutoff UTC: ${now.toISOString()}`);

  const [generalShifts, infertilityShifts, sessions, admissions, pathology, infertilityTests] =
    await Promise.all([
      prisma.shift.findMany({ orderBy: { startTime: "asc" } }),
      prisma.infertilityShift.findMany({ orderBy: { startTime: "asc" } }),
      prisma.session.findMany({
        where: { expiresAt: { gte: now } },
        select: { user: { select: { staffId: true } } },
      }),
      prisma.admission.findMany({
        select: { id: true, grandTotal: true, paidAmount: true, dueAmount: true },
      }),
      prisma.pathologyTest.findMany({
        select: { id: true, grandTotal: true, paidAmount: true, dueAmount: true },
      }),
      prisma.infertilityTest.findMany({
        select: { id: true, grandTotal: true, paidAmount: true, dueAmount: true },
      }),
    ]);

  const [generalPayments, generalMovements, infertilityPayments, infertilityMovements] =
    await Promise.all([
      prisma.payment.findMany({
        select: { shiftId: true, amount: true, notes: true, paymentDate: true },
      }),
      prisma.cashMovement.findMany({
        select: {
          shiftId: true,
          amount: true,
          movementType: true,
          description: true,
          paymentId: true,
          timestamp: true,
        },
      }),
      prisma.infertilityPayment.findMany({
        select: {
          shiftId: true,
          amount: true,
          isMigrationSuperseded: true,
          paymentDate: true,
        },
      }),
      prisma.infertilityCashMovement.findMany({
        select: {
          shiftId: true,
          amount: true,
          movementType: true,
          paymentId: true,
          isMigrationSuperseded: true,
          timestamp: true,
        },
      }),
    ]);

  const generalPaymentsByShift = new Map<number, typeof generalPayments>();
  for (const payment of generalPayments) {
    const rows = generalPaymentsByShift.get(payment.shiftId) ?? [];
    rows.push(payment);
    generalPaymentsByShift.set(payment.shiftId, rows);
  }
  const generalMovementsByShift = new Map<number, typeof generalMovements>();
  for (const movement of generalMovements) {
    const rows = generalMovementsByShift.get(movement.shiftId) ?? [];
    rows.push(movement);
    generalMovementsByShift.set(movement.shiftId, rows);
  }
  const infertilityPaymentsByShift = new Map<number, typeof infertilityPayments>();
  for (const payment of infertilityPayments) {
    const rows = infertilityPaymentsByShift.get(payment.shiftId) ?? [];
    rows.push(payment);
    infertilityPaymentsByShift.set(payment.shiftId, rows);
  }
  const infertilityMovementsByShift = new Map<number, typeof infertilityMovements>();
  for (const movement of infertilityMovements) {
    const rows = infertilityMovementsByShift.get(movement.shiftId) ?? [];
    rows.push(movement);
    infertilityMovementsByShift.set(movement.shiftId, rows);
  }

  const activeStaffIds = new Set(sessions.map((session) => session.user.staffId));
  const activeGeneralByStaff = new Map<number, GeneralShiftRow[]>();
  const activeInfertilityByStaff = new Map<number, InfertilityShiftRow[]>();
  const generalRepairs: Array<{ shift: GeneralShiftRow; ledger: LedgerTotals }> = [];
  const infertilityRepairs: Array<{ shift: InfertilityShiftRow; ledger: LedgerTotals }> = [];

  for (const shift of generalShifts) {
    const ledger = calculateGeneralLedger(
      shift,
      generalPaymentsByShift.get(shift.id) ?? [],
      generalMovementsByShift.get(shift.id) ?? [],
    );
    if (
      differs(amount(shift.totalCollected), ledger.totalCollected) ||
      differs(amount(shift.totalRefunded), ledger.totalRefunded) ||
      differs(amount(shift.systemCash), ledger.systemCash)
    ) {
      generalRepairs.push({ shift, ledger });
    }
    if (shift.isActive) {
      const rows = activeGeneralByStaff.get(shift.staffId) ?? [];
      rows.push(shift);
      activeGeneralByStaff.set(shift.staffId, rows);
    }
  }

  for (const shift of infertilityShifts) {
    const ledger = calculateInfertilityLedger(
      shift,
      infertilityPaymentsByShift.get(shift.id) ?? [],
      infertilityMovementsByShift.get(shift.id) ?? [],
    );
    if (
      differs(amount(shift.totalCollected), ledger.totalCollected) ||
      differs(amount(shift.totalRefunded), ledger.totalRefunded) ||
      differs(amount(shift.systemCash), ledger.systemCash)
    ) {
      infertilityRepairs.push({ shift, ledger });
    }
    if (shift.isActive) {
      const rows = activeInfertilityByStaff.get(shift.staffId) ?? [];
      rows.push(shift);
      activeInfertilityByStaff.set(shift.staffId, rows);
    }
  }

  const dueRepairs = [
    ...admissions.map((row) => ({
      table: "Admission",
      id: row.id,
      current: amount(row.dueAmount),
      expected: Math.max(0, amount(row.grandTotal) - amount(row.paidAmount)),
    })),
    ...pathology.map((row) => ({
      table: "PathologyTest",
      id: row.id,
      current: amount(row.dueAmount),
      expected: Math.max(0, amount(row.grandTotal) - amount(row.paidAmount)),
    })),
    ...infertilityTests.map((row) => ({
      table: "InfertilityTest",
      id: row.id,
      current: amount(row.dueAmount),
      expected: Math.max(0, amount(row.grandTotal) - amount(row.paidAmount)),
    })),
  ].filter((row) => differs(row.current, row.expected));

  const missingPairs = generalShifts.filter(
    (shift) =>
      shift.isActive &&
      !infertilityShifts.some(
        (infertilityShift) => infertilityShift.sourceShiftId === shift.id,
      ),
  );
  const orphanInfertility = infertilityShifts.filter(
    (shift) =>
      shift.isActive &&
      (shift.sourceShiftId === null ||
        !generalShifts.some((generalShift) => generalShift.id === shift.sourceShiftId)),
  );
  const duplicateActiveStaff = Array.from(activeGeneralByStaff.entries()).filter(
    ([, shiftsForStaff]) => shiftsForStaff.length > 1,
  );
  const staleActiveStaffIds = Array.from(
    new Set(
      [...activeGeneralByStaff.keys(), ...activeInfertilityByStaff.keys()].filter(
        (staffId) => !activeStaffIds.has(staffId),
      ),
    ),
  );

  console.log(`General shifts: ${generalShifts.length}`);
  console.log(`Infertility shifts: ${infertilityShifts.length}`);
  console.log(`Shift ledger repairs: ${generalRepairs.length} general, ${infertilityRepairs.length} infertility`);
  console.log(`Due repairs: ${dueRepairs.length}`);
  console.log(`Missing active pairs: ${missingPairs.length}`);
  console.log(`Orphan active infertility shifts: ${orphanInfertility.length}`);
  console.log(`Staff with duplicate active general shifts: ${duplicateActiveStaff.length}`);
  console.log(`Staff with active shifts but no unexpired session: ${staleActiveStaffIds.length}`);

  if (generalRepairs.length > 0) {
    console.log("General ledger differences:", generalRepairs.map(({ shift, ledger }) => ({
      id: shift.id,
      staffId: shift.staffId,
      stored: {
        collected: amount(shift.totalCollected),
        refunded: amount(shift.totalRefunded),
        systemCash: amount(shift.systemCash),
      },
      expected: ledger,
    })));
  }
  if (infertilityRepairs.length > 0) {
    console.log("Infertility ledger differences:", infertilityRepairs.map(({ shift, ledger }) => ({
      id: shift.id,
      staffId: shift.staffId,
      sourceShiftId: shift.sourceShiftId,
      stored: {
        collected: amount(shift.totalCollected),
        refunded: amount(shift.totalRefunded),
        systemCash: amount(shift.systemCash),
      },
      expected: ledger,
    })));
  }
  if (dueRepairs.length > 0) console.log("Due differences:", dueRepairs);
  if (missingPairs.length > 0) {
    console.log(
      "Missing pair details:",
      missingPairs.map((shift) => ({ id: shift.id, staffId: shift.staffId })),
    );
  }
  if (orphanInfertility.length > 0) {
    console.log(
      "Orphan infertility details:",
      orphanInfertility.map((shift) => ({
        id: shift.id,
        staffId: shift.staffId,
        sourceShiftId: shift.sourceShiftId,
      })),
    );
  }
  if (staleActiveStaffIds.length > 0) {
    console.log("Stale active staff IDs:", staleActiveStaffIds);
  }

  if (!APPLY) return;

  await prisma.$transaction(async (tx) => {
    for (const { shift, ledger } of generalRepairs) {
      await tx.shift.update({
        where: { id: shift.id },
        data: {
          totalCollected: ledger.totalCollected,
          totalRefunded: ledger.totalRefunded,
          systemCash: ledger.systemCash,
          ...(shift.isActive
            ? {}
            : {
                closingCash: amount(shift.closingCash) === 0
                  ? ledger.systemCash
                  : amount(shift.closingCash),
                variance: amount(shift.closingCash) === 0
                  ? 0
                  : amount(shift.closingCash) - ledger.systemCash,
              }),
        },
      });
    }
    for (const { shift, ledger } of infertilityRepairs) {
      await tx.infertilityShift.update({
        where: { id: shift.id },
        data: {
          totalCollected: ledger.totalCollected,
          totalRefunded: ledger.totalRefunded,
          systemCash: ledger.systemCash,
          ...(shift.isActive
            ? {}
            : {
                closingCash: amount(shift.closingCash) === 0
                  ? ledger.systemCash
                  : amount(shift.closingCash),
                variance: amount(shift.closingCash) === 0
                  ? 0
                  : amount(shift.closingCash) - ledger.systemCash,
              }),
        },
      });
    }

    for (const row of dueRepairs) {
      if (row.table === "Admission") {
        await tx.admission.update({ where: { id: row.id }, data: { dueAmount: row.expected } });
      } else if (row.table === "PathologyTest") {
        await tx.pathologyTest.update({ where: { id: row.id }, data: { dueAmount: row.expected } });
      } else {
        await tx.infertilityTest.update({ where: { id: row.id }, data: { dueAmount: row.expected } });
      }
    }

    for (const staffId of staleActiveStaffIds) {
      const [generalRows, infertilityRows] = await Promise.all([
        tx.shift.findMany({ where: { staffId, isActive: true }, include: { payments: { select: { paymentDate: true } }, cashMovements: { select: { timestamp: true } } } }),
        tx.infertilityShift.findMany({ where: { staffId, isActive: true }, include: { payments: { select: { paymentDate: true } }, cashMovements: { select: { timestamp: true } } } }),
      ]);
      for (const shift of generalRows) {
        const endedAt = lastActivity(shift.startTime, shift.payments, shift.cashMovements);
        const ledger = calculateGeneralLedger(
          shift,
          generalPaymentsByShift.get(shift.id) ?? [],
          generalMovementsByShift.get(shift.id) ?? [],
        );
        await tx.shift.update({
          where: { id: shift.id },
          data: {
            isActive: false,
            endTime: endedAt,
            totalCollected: ledger.totalCollected,
            totalRefunded: ledger.totalRefunded,
            systemCash: ledger.systemCash,
            closingCash: ledger.systemCash,
            variance: 0,
            notes: `${shift.notes ? `${shift.notes}\n` : ""}[Historical reconciliation: closed without an unexpired session]`,
          },
        });
      }
      for (const shift of infertilityRows) {
        const endedAt = lastActivity(shift.startTime, shift.payments, shift.cashMovements);
        const ledger = calculateInfertilityLedger(
          shift,
          infertilityPaymentsByShift.get(shift.id) ?? [],
          infertilityMovementsByShift.get(shift.id) ?? [],
        );
        await tx.infertilityShift.update({
          where: { id: shift.id },
          data: {
            isActive: false,
            endTime: endedAt,
            totalCollected: ledger.totalCollected,
            totalRefunded: ledger.totalRefunded,
            systemCash: ledger.systemCash,
            closingCash: ledger.systemCash,
            variance: 0,
            notes: `${shift.notes ? `${shift.notes}\n` : ""}[Historical reconciliation: closed without an unexpired session]`,
          },
        });
      }
    }

    // Create only empty pairs. Existing infertility rows with transactions
    // remain immutable historical records and are reported as orphans.
    for (const generalShift of missingPairs) {
      if (!activeStaffIds.has(generalShift.staffId)) continue;
      const emptyOrphan = await tx.infertilityShift.findFirst({
        where: {
          staffId: generalShift.staffId,
          isActive: true,
          sourceShiftId: null,
          payments: { none: {} },
          cashMovements: { none: {} },
        },
        orderBy: { startTime: "desc" },
      });
      if (emptyOrphan) {
        await tx.infertilityShift.update({
          where: { id: emptyOrphan.id },
          data: { sourceShiftId: generalShift.id, startTime: generalShift.startTime, notes: `[Linked to general shift #${generalShift.id}]` },
        });
      } else {
        await tx.infertilityShift.create({
          data: {
            staffId: generalShift.staffId,
            startTime: generalShift.startTime,
            sourceShiftId: generalShift.id,
            openingCash: 0,
            closingCash: 0,
            systemCash: 0,
            variance: 0,
            totalCollected: 0,
            totalRefunded: 0,
            notes: `[Linked to general shift #${generalShift.id}]`,
          },
        });
      }
    }
  });

  console.log("Historical reconciliation applied successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
