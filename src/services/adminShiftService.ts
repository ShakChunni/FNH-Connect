import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface ShiftFilters {
  staffId?: number;
  startDate?: string;
  endDate?: string;
  status?: "Active" | "Closed";
  search?: string;
  excludeSystemAdmin?: boolean;
}

export async function getAdminShifts(filters: ShiftFilters) {
  const where: any = {};

  if (filters.staffId) {
    where.staffId = filters.staffId;
  }

  if (filters.startDate || filters.endDate) {
    where.startTime = {};
    if (filters.startDate) where.startTime.gte = new Date(filters.startDate);
    if (filters.endDate) where.startTime.lte = new Date(filters.endDate);
  }

  if (filters.status) {
    where.isActive = filters.status === "Active";
  }

  if (filters.search) {
    where.staff = {
      fullName: { contains: filters.search, mode: "insensitive" },
    };
  }

  // Exclude system-admin shifts if requested
  if (filters.excludeSystemAdmin) {
    where.staff = {
      ...where.staff,
      user: {
        role: {
          not: "system-admin",
        },
      },
    };
  }

  const shifts = await prisma.shift.findMany({
    where,
    include: {
      staff: {
        select: {
          id: true,
          fullName: true,
          role: true,
          user: {
            select: {
              role: true,
            },
          },
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

  return shifts;
}

export async function getShiftDetails(id: number) {
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
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
        include: {
          payment: {
            include: {
              patientAccount: {
                include: {
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
    },
  });

  return shift;
}

export async function getCashTrackingSummary(filters?: ShiftFilters) {
  // Build the same filter conditions as getAdminShifts
  const where: any = {};

  if (filters?.staffId) {
    where.staffId = filters.staffId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.startTime = {};
    if (filters.startDate) where.startTime.gte = new Date(filters.startDate);
    if (filters.endDate) where.startTime.lte = new Date(filters.endDate);
  }

  if (filters?.status) {
    where.isActive = filters.status === "Active";
  }

  if (filters?.search) {
    where.staff = {
      fullName: { contains: filters.search, mode: "insensitive" },
    };
  }

  // Exclude system-admin shifts if requested
  if (filters?.excludeSystemAdmin) {
    where.staff = {
      ...where.staff,
      user: {
        role: {
          not: "system-admin",
        },
      },
    };
  }

  // Get shifts matching filters to calculate accurate totals
  const matchingShifts = await prisma.shift.findMany({
    where,
    select: {
      id: true,
      totalCollected: true,
      totalRefunded: true,
      isActive: true,
    },
  });

  // Calculate totals from the filtered shifts
  let totalCollected = 0;
  let totalRefunded = 0;
  let activeShiftsCount = 0;

  matchingShifts.forEach((shift) => {
    const collected = shift.totalCollected?.toNumber() || 0;
    const refunded = shift.totalRefunded?.toNumber() || 0;

    totalCollected += collected;
    totalRefunded += refunded;
    if (shift.isActive) activeShiftsCount++;
  });

  return {
    totalCollected,
    totalRefunded,
    activeShiftsCount,
  };
}
