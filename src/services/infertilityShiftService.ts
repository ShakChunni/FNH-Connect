import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { shiftService } from "@/services/shiftService";

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

    if (linkedShift) {
      const metadataMatches =
        linkedShift.staffId === activeGeneralShift.staffId &&
        linkedShift.startTime.getTime() === activeGeneralShift.startTime.getTime() &&
        linkedShift.endTime?.getTime() === activeGeneralShift.endTime?.getTime() &&
        linkedShift.isActive === activeGeneralShift.isActive;

      if (metadataMatches) {
        return linkedShift;
      }

      return db.infertilityShift.update({
        where: { id: linkedShift.id },
        data: {
          staffId: activeGeneralShift.staffId,
          startTime: activeGeneralShift.startTime,
          endTime: activeGeneralShift.endTime,
          isActive: activeGeneralShift.isActive,
        },
      });
    }

    const reusableEmptyShift = await db.infertilityShift.findFirst({
      where: {
        staffId,
        isActive: true,
        sourceShiftId: null,
        payments: {
          none: {},
        },
        cashMovements: {
          none: {},
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    if (reusableEmptyShift) {
      return db.infertilityShift.update({
        where: { id: reusableEmptyShift.id },
        data: {
          staffId: activeGeneralShift.staffId,
          startTime: activeGeneralShift.startTime,
          endTime: activeGeneralShift.endTime,
          isActive: activeGeneralShift.isActive,
          sourceShiftId: activeGeneralShift.id,
          notes: reusableEmptyShift.notes
            ? `${reusableEmptyShift.notes}\n[Linked to general shift #${activeGeneralShift.id}]`
            : `[Linked to general shift #${activeGeneralShift.id}]`,
        },
      });
    }

    const newShift = await db.infertilityShift.create({
      data: {
        staffId: activeGeneralShift.staffId,
        startTime: activeGeneralShift.startTime,
        endTime: activeGeneralShift.endTime,
        isActive: activeGeneralShift.isActive,
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

    return newShift;
  },

  /**
   * Closes the active infertility shift for a staff member.
   */
  closeActiveShift: async (
    staffId: number,
    closingCash: number,
    notes?: string
  ) => {
    const activeShift = await prisma.infertilityShift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
    });

    if (!activeShift) {
      throw new Error("No active infertility shift found to close.");
    }

    const variance = closingCash - activeShift.systemCash.toNumber();

    return await prisma.infertilityShift.update({
      where: { id: activeShift.id },
      data: {
        isActive: false,
        endTime: new Date(),
        closingCash,
        variance,
        notes,
      },
    });
  },
};
