import { Prisma } from "@prisma/client";

export interface ClosedStaffCashShifts {
  generalShiftId: number | null;
  infertilityShiftId: number | null;
  closedCount: number;
}

interface CloseActiveStaffCashShiftsInput {
  tx: Prisma.TransactionClient;
  staffId: number;
  endedAt: Date;
  generalNotes: string;
  infertilityNotes: string;
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
  const [activeGeneralShift, activeInfertilityShift] = await Promise.all([
    tx.shift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
      select: {
        id: true,
        systemCash: true,
      },
    }),
    tx.infertilityShift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
      select: {
        id: true,
        systemCash: true,
      },
    }),
  ]);

  if (activeGeneralShift) {
    await tx.shift.update({
      where: { id: activeGeneralShift.id },
      data: {
        isActive: false,
        endTime: endedAt,
        closingCash: activeGeneralShift.systemCash,
        variance: 0,
        notes: generalNotes,
      },
    });
  }

  if (activeInfertilityShift) {
    await tx.infertilityShift.update({
      where: { id: activeInfertilityShift.id },
      data: {
        isActive: false,
        endTime: endedAt,
        closingCash: activeInfertilityShift.systemCash,
        variance: 0,
        notes: infertilityNotes,
      },
    });
  }

  const generalShiftId = activeGeneralShift?.id ?? null;
  const infertilityShiftId = activeInfertilityShift?.id ?? null;

  return {
    generalShiftId,
    infertilityShiftId,
    closedCount:
      Number(generalShiftId !== null) + Number(infertilityShiftId !== null),
  };
}
