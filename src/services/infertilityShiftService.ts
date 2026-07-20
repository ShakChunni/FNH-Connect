import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { shiftService } from "@/services/shiftService";
import { closeActiveStaffCashShifts } from "@/services/staffShiftClosureService";

export const infertilityShiftService = {
  /**
   * Ensures that a staff member has an active infertility shift.
   * The infertility shift is linked to the active general shift via sourceShiftId
   * so both portals share the same work-session boundary while keeping HSI cash
   * collections in the dedicated infertility cash tables.
   */
  ensureActiveShift: async (staffId: number, tx?: Prisma.TransactionClient) => {
    const db = tx || prisma;
    const activeGeneralShift = await shiftService.ensureActiveShift(staffId, tx);

    const linkedShift = await db.infertilityShift.findUnique({
      where: {
        sourceShiftId: activeGeneralShift.id,
      },
    });

    // shiftService creates and maintains the paired row for every active
    // general shift. This fallback is only for a legacy row created during a
    // partially completed migration.
    if (linkedShift) return linkedShift;

    return db.infertilityShift.create({
      data: {
        staffId,
        startTime: activeGeneralShift.startTime,
        isActive: true,
        sourceShiftId: activeGeneralShift.id,
        openingCash: 0,
        systemCash: 0,
        totalCollected: 0,
        totalRefunded: 0,
        closingCash: 0,
        variance: 0,
        notes: `[Linked to general shift #${activeGeneralShift.id}]`,
      },
    });
  },

  /**
   * Closes the active infertility shift for a staff member.
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

      if (!closed.infertilityShiftId) {
        throw new Error("No active infertility shift found to close.");
      }

      const infertilityShift = await tx.infertilityShift.findUniqueOrThrow({
        where: { id: closed.infertilityShiftId },
        select: { systemCash: true },
      });

      const variance = closingCash - infertilityShift.systemCash.toNumber();
      return tx.infertilityShift.update({
        where: { id: closed.infertilityShiftId },
        data: { closingCash, variance, notes },
      });
    });
  },
};
