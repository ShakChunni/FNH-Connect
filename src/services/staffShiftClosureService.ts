import { Prisma } from "@prisma/client";
import {
  reconcileGeneralShiftLedger,
  reconcileInfertilityShiftLedger,
} from "@/services/shiftLedgerService";

export interface ClosedStaffCashShifts {
  generalShiftId: number | null;
  infertilityShiftId: number | null;
  generalShiftIds: number[];
  infertilityShiftIds: number[];
  closedCount: number;
}

interface CloseActiveStaffCashShiftsInput {
  tx: Prisma.TransactionClient;
  staffId: number;
  endedAt: Date;
  generalNotes: string;
  infertilityNotes: string;
}

export async function hasUnexpiredStaffSession(
  tx: Prisma.TransactionClient,
  staffId: number,
  now: Date,
  excludedSessionId?: string,
): Promise<boolean> {
  const count = await tx.session.count({
    where: {
      user: { staffId },
      expiresAt: { gte: now },
      ...(excludedSessionId ? { id: { not: excludedSessionId } } : {}),
    },
  });

  return count > 0;
}

export async function closeActiveStaffCashShiftsIfNoUnexpiredSession({
  tx,
  staffId,
  endedAt,
  generalNotes,
  infertilityNotes,
  excludedSessionId,
}: CloseActiveStaffCashShiftsInput & {
  excludedSessionId?: string;
}): Promise<ClosedStaffCashShifts | null> {
  await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(${staffId})`);

  if (await hasUnexpiredStaffSession(tx, staffId, endedAt, excludedSessionId)) {
    return null;
  }

  return closeActiveStaffCashShifts({
    tx,
    staffId,
    endedAt,
    generalNotes,
    infertilityNotes,
  });
}

/**
 * A staff member can have separate cash shifts in the general and HSI portals.
 * Ending work from either portal must close both active shifts for the staff member.
 */
export async function closeActiveStaffCashShifts({
  tx,
  staffId,
  endedAt,
  generalNotes,
  infertilityNotes,
}: CloseActiveStaffCashShiftsInput): Promise<ClosedStaffCashShifts> {
  await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(${staffId})`);

  const [activeGeneralShifts, activeInfertilityShifts] = await Promise.all([
    tx.shift.findMany({
      where: {
        staffId,
        isActive: true,
      },
      orderBy: { startTime: "desc" },
    }),
    tx.infertilityShift.findMany({
      where: {
        staffId,
        isActive: true,
      },
      orderBy: { startTime: "desc" },
    }),
  ]);

  for (const activeGeneralShift of activeGeneralShifts) {
    const ledger = await reconcileGeneralShiftLedger(
      tx,
      activeGeneralShift.id,
      activeGeneralShift.openingCash,
    );

    await tx.shift.update({
      where: { id: activeGeneralShift.id },
      data: {
        isActive: false,
        endTime: endedAt,
        totalCollected: ledger.totalCollected,
        totalRefunded: ledger.totalRefunded,
        systemCash: ledger.systemCash,
        closingCash: ledger.systemCash,
        variance: 0,
        notes: generalNotes,
      },
    });
  }

  for (const activeInfertilityShift of activeInfertilityShifts) {
    const ledger = await reconcileInfertilityShiftLedger(
      tx,
      activeInfertilityShift.id,
      activeInfertilityShift.openingCash,
    );

    await tx.infertilityShift.update({
      where: { id: activeInfertilityShift.id },
      data: {
        isActive: false,
        endTime: endedAt,
        totalCollected: ledger.totalCollected,
        totalRefunded: ledger.totalRefunded,
        systemCash: ledger.systemCash,
        closingCash: ledger.systemCash,
        variance: 0,
        notes: infertilityNotes,
      },
    });
  }

  const generalShiftIds = activeGeneralShifts.map((shift) => shift.id);
  const infertilityShiftIds = activeInfertilityShifts.map((shift) => shift.id);
  const generalShiftId = generalShiftIds[0] ?? null;
  const infertilityShiftId = infertilityShiftIds[0] ?? null;

  return {
    generalShiftId,
    infertilityShiftId,
    generalShiftIds,
    infertilityShiftIds,
    closedCount: generalShiftIds.length + infertilityShiftIds.length,
  };
}
