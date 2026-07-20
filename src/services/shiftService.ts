import { Prisma, Shift } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { closeActiveStaffCashShifts } from "@/services/staffShiftClosureService";

async function ensureLinkedInfertilityShift(
  db: Prisma.TransactionClient | typeof prisma,
  generalShift: {
    id: number;
    staffId: number;
    startTime: Date;
    endTime: Date | null;
    isActive: boolean;
  },
) {
  const linkedShift = await db.infertilityShift.findUnique({
    where: { sourceShiftId: generalShift.id },
  });

  if (linkedShift?.isActive) {
    return linkedShift;
  }

  // Reuse only an untouched legacy shift. A shift with transactions is a
  // historical cash record and must never be retargeted to a new shift.
  const reusableEmptyShift = await db.infertilityShift.findFirst({
    where: {
      staffId: generalShift.staffId,
      isActive: true,
      sourceShiftId: null,
      payments: { none: {} },
      cashMovements: { none: {} },
    },
    orderBy: { startTime: "desc" },
  });

  if (reusableEmptyShift) {
    return db.infertilityShift.update({
      where: { id: reusableEmptyShift.id },
      data: {
        startTime: generalShift.startTime,
        endTime: generalShift.endTime,
        isActive: generalShift.isActive,
        sourceShiftId: generalShift.id,
        notes: reusableEmptyShift.notes
          ? `${reusableEmptyShift.notes}\n[Linked to general shift #${generalShift.id}]`
          : `[Linked to general shift #${generalShift.id}]`,
      },
    });
  }

  return db.infertilityShift.create({
    data: {
      staffId: generalShift.staffId,
      startTime: generalShift.startTime,
      endTime: generalShift.endTime,
      isActive: generalShift.isActive,
      sourceShiftId: generalShift.id,
      openingCash: 0,
      systemCash: 0,
      totalCollected: 0,
      totalRefunded: 0,
      closingCash: 0,
      variance: 0,
      notes: `[Linked to general shift #${generalShift.id}]`,
    },
  });
}

export const shiftService = {
  /**
   * Ensures that a staff member has an active shift.
   * If an active shift exists, it returns it.
   * If not, it creates a new one.
   *
   * This is designed to support multi-device logins where the user
   * should ideally remain on the same "logical" shift until they explicitly close it.
   */
  ensureActiveShift: async (
    staffId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Shift> => {
    if (!tx) {
      return prisma.$transaction((transaction) =>
        shiftService.ensureActiveShift(staffId, transaction),
      );
    }

    const db = tx || prisma;

    // Serialize shift creation for one staff member. The schema intentionally
    // allows historical duplicates, so this lock is the runtime guard that
    // prevents concurrent payments from opening two current shifts.
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(${staffId})`);

    // 1. Check for an existing active shift
    const activeShift = await db.shift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
      orderBy: { startTime: "desc" },
    });

    if (activeShift) {
      await ensureLinkedInfertilityShift(db, activeShift);
      return activeShift;
    }

    // 2. If no active shift, create one
    // We default openingCash to 0 or we could potentially carry over from previous?
    // For now, 0 or we might want to prompt the user later.
    // Given this is an automatic login action, 0 is the safe default until they do an "Opening Balance" action (if implemented).
    const newShift = await db.shift.create({
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

    await ensureLinkedInfertilityShift(db, newShift);

    return newShift;
  },

  /**
   * Closes the active shift for a staff member.
   */
  closeActiveShift: async (
    staffId: number,
    closingCash: number,
    notes?: string
  ) => {
    return prisma.$transaction(async (tx) => {
      const closed = await closeActiveStaffCashShifts({
        tx,
        staffId,
        endedAt: new Date(),
        generalNotes: notes ?? "Shift ended",
        infertilityNotes: notes ?? "HSI Center shift ended",
      });

      if (!closed.generalShiftId) {
        throw new Error("No active shift found to close.");
      }

      const generalShift = await tx.shift.findUniqueOrThrow({
        where: { id: closed.generalShiftId },
        select: { systemCash: true },
      });

      const variance = closingCash - generalShift.systemCash.toNumber();
      return tx.shift.update({
        where: { id: closed.generalShiftId },
        data: { closingCash, variance, notes },
      });
    });
  },
};
