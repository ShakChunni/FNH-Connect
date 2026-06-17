import { prisma } from "@/lib/prisma";

export interface InfertilityCashTrackingFilters {
  staffId?: number;
  startDate?: string;
  endDate?: string;
  status?: "Active" | "Closed" | "All";
  search?: string;
}

export interface InfertilityCashTrackingStaffOption {
  id: number;
  fullName: string;
  role: string;
}

/**
 * Get infertility shifts from the dedicated InfertilityShift table
 */
export async function getInfertilityCashTrackingShifts(
  filters: InfertilityCashTrackingFilters
) {
  const where: Record<string, unknown> = {};

  if (filters.staffId) {
    where.staffId = filters.staffId;
  }

  if (filters.startDate || filters.endDate) {
    where.startTime = {};
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

    if (filters.startDate) {
      const [year, month, day] = filters.startDate.split("-").map(Number);
      const startBDT = new Date(
        Date.UTC(year, month - 1, day) - BDT_OFFSET_MS
      );
      (where.startTime as Record<string, Date>).gte = startBDT;
    }
    if (filters.endDate) {
      const [year, month, day] = filters.endDate.split("-").map(Number);
      const endBDT = new Date(
        Date.UTC(year, month - 1, day + 1) - BDT_OFFSET_MS
      );
      (where.startTime as Record<string, Date>).lte = endBDT;
    }
  }

  if (filters.status && filters.status !== "All") {
    where.isActive = filters.status === "Active";
  }

  if (filters.search) {
    where.staff = {
      fullName: { contains: filters.search, mode: "insensitive" },
    };
  }

  const shifts = await prisma.infertilityShift.findMany({
    where,
    select: {
      id: true,
      staffId: true,
      startTime: true,
      endTime: true,
      isActive: true,
      openingCash: true,
      closingCash: true,
      systemCash: true,
      variance: true,
      totalCollected: true,
      totalRefunded: true,
      notes: true,
      staff: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
      _count: {
        select: {
          payments: true,
          cashMovements: true,
        },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });

  return shifts.map((shift) => ({
    ...shift,
    openingCash: Number(shift.openingCash),
    closingCash: Number(shift.closingCash),
    systemCash: Number(shift.systemCash),
    variance: Number(shift.variance),
    totalCollected: Number(shift.totalCollected),
    totalRefunded: Number(shift.totalRefunded),
    paymentsCount: shift._count.payments,
    cashMovementsCount: shift._count.cashMovements,
  }));
}

export async function getInfertilityCashTrackingStaff() {
  const shifts = await prisma.infertilityShift.findMany({
    distinct: ["staffId"],
    select: {
      staff: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
    orderBy: {
      staff: {
        fullName: "asc",
      },
    },
  });

  const uniqueStaff = new Map<number, InfertilityCashTrackingStaffOption>();
  for (const shift of shifts) {
    if (!uniqueStaff.has(shift.staff.id)) {
      uniqueStaff.set(shift.staff.id, {
        id: shift.staff.id,
        fullName: shift.staff.fullName,
        role: shift.staff.role,
      });
    }
  }

  return Array.from(uniqueStaff.values());
}

/**
 * Get detailed infertility-specific movements for a shift
 */
export async function getInfertilityCashTrackingShiftDetails(id: number) {
  const shift = await prisma.infertilityShift.findUnique({
    where: { id },
    select: {
      id: true,
      staffId: true,
      startTime: true,
      endTime: true,
      isActive: true,
      openingCash: true,
      closingCash: true,
      systemCash: true,
      variance: true,
      totalCollected: true,
      totalRefunded: true,
      notes: true,
      staff: {
        select: {
          id: true,
          fullName: true,
          role: true,
          phoneNumber: true,
        },
      },
      cashMovements: {
        orderBy: {
          timestamp: "desc",
        },
        select: {
          id: true,
          amount: true,
          movementType: true,
          description: true,
          timestamp: true,
          payment: {
            select: {
              id: true,
              amount: true,
              receiptNumber: true,
              patientAccount: {
                select: {
                  patient: {
                    select: {
                      id: true,
                      fullName: true,
                      phoneNumber: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          receiptNumber: true,
          paymentDate: true,
          patientAccount: {
            select: {
              patient: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          paymentAllocations: {
            select: {
              allocatedAmount: true,
              serviceCharge: {
                select: {
                  serviceName: true,
                  serviceType: true,
                },
              },
            },
          },
        },
        orderBy: {
          paymentDate: "desc",
        },
      },
    },
  });

  if (!shift) return null;

  return {
    ...shift,
    openingCash: Number(shift.openingCash),
    closingCash: Number(shift.closingCash),
    systemCash: Number(shift.systemCash),
    variance: Number(shift.variance),
    totalCollected: Number(shift.totalCollected),
    totalRefunded: Number(shift.totalRefunded),
  };
}

/**
 * Summary stats for Infertility cash tracking dashboard
 */
export async function getInfertilityCashTrackingSummary(
  filters?: InfertilityCashTrackingFilters
) {
  const where: Record<string, unknown> = {};

  if (filters?.staffId) {
    where.staffId = filters.staffId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.startTime = {};
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

    if (filters.startDate) {
      const [year, month, day] = filters.startDate.split("-").map(Number);
      const startBDT = new Date(
        Date.UTC(year, month - 1, day) - BDT_OFFSET_MS
      );
      (where.startTime as Record<string, Date>).gte = startBDT;
    }
    if (filters.endDate) {
      const [year, month, day] = filters.endDate.split("-").map(Number);
      const endBDT = new Date(
        Date.UTC(year, month - 1, day + 1) - BDT_OFFSET_MS
      );
      (where.startTime as Record<string, Date>).lte = endBDT;
    }
  }

  if (filters?.status && filters.status !== "All") {
    where.isActive = filters.status === "Active";
  }

  if (filters?.search) {
    where.staff = {
      fullName: { contains: filters.search, mode: "insensitive" },
    };
  }

  const aggregate = await prisma.infertilityShift.aggregate({
    where,
    _sum: {
      totalCollected: true,
      totalRefunded: true,
    },
  });

  const activeShiftsCount = await prisma.infertilityShift.count({
    where: {
      ...where,
      isActive: true,
    },
  });

  return {
    totalCollected: Number(aggregate._sum.totalCollected || 0),
    totalRefunded: Number(aggregate._sum.totalRefunded || 0),
    activeShiftsCount,
  };
}
