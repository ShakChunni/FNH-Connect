import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const shiftService = {
  /**
   * Ensures that a staff member has an active shift.
   * If an active shift exists, it returns it.
   * If not, it creates a new one.
   *
   * This is designed to support multi-device logins where the user
   * should ideally remain on the same "logical" shift until they explicitly close it.
   */
  ensureActiveShift: async (staffId: number, tx?: any) => {
    const db = tx || prisma;

    // 1. Check for an existing active shift
    const activeShift = await db.shift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
    });

    if (activeShift) {
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
    const activeShift = await prisma.shift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
    });

    if (!activeShift) {
      throw new Error("No active shift found to close.");
    }

    // Calculate variance
    // System cash should ideally match (Opening + Collected - Refunded)
    // But we trust the persisted systemCash field which we should be maintaining accurately on every transaction.
    const variance = closingCash - activeShift.systemCash.toNumber();

    return await prisma.shift.update({
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
