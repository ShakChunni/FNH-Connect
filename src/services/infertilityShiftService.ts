import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const infertilityShiftService = {
  /**
   * Ensures that a staff member has an active infertility shift.
   * If an active shift exists, it returns it.
   * If not, it creates a new one.
   */
  ensureActiveShift: async (staffId: number, tx?: Prisma.TransactionClient) => {
    const db = tx || prisma;

    const activeShift = await db.infertilityShift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
    });

    if (activeShift) {
      return activeShift;
    }

    const newShift = await db.infertilityShift.create({
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
