import { prisma } from "@/lib/prisma";
import { BDT_OFFSET_MS } from "@/lib/timezone";
import type { Prisma } from "@prisma/client";

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

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseCalendarDate(value: string) {
  const match = calendarDatePattern.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const normalized = new Date(Date.UTC(year, month - 1, day));

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function isValidInfertilityCashTrackingDateFilter(value: string): boolean {
  if (parseCalendarDate(value)) return true;

  return !Number.isNaN(new Date(value).getTime());
}

export function getInfertilityCashTrackingDateBoundary(
  value: string,
  boundary: "start" | "end",
): Date {
  const calendarDate = parseCalendarDate(value);

  if (calendarDate) {
    const dayOffset = boundary === "end" ? 1 : 0;
    return new Date(
      Date.UTC(
        calendarDate.year,
        calendarDate.month - 1,
        calendarDate.day + dayOffset,
      ) - BDT_OFFSET_MS,
    );
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid infertility cash tracking date filter");
  }

  return date;
}

function buildInfertilityCashTrackingWhere(
  filters?: InfertilityCashTrackingFilters,
): Prisma.InfertilityShiftWhereInput {
  const where: Prisma.InfertilityShiftWhereInput = {};

  if (!filters) return where;

  if (filters.staffId) {
    where.staffId = filters.staffId;
  }

  if (filters.startDate || filters.endDate) {
    where.startTime = {};

    if (filters.startDate) {
      where.startTime.gte = getInfertilityCashTrackingDateBoundary(
        filters.startDate,
        "start",
      );
    }

    if (filters.endDate) {
      where.startTime.lt = getInfertilityCashTrackingDateBoundary(
        filters.endDate,
        "end",
      );
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

  return where;
}

/**
 * Get infertility shifts from the dedicated InfertilityShift table
 */
export async function getInfertilityCashTrackingShifts(
  filters: InfertilityCashTrackingFilters
) {
  const where = buildInfertilityCashTrackingWhere(filters);

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
  const where = buildInfertilityCashTrackingWhere(filters);

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
