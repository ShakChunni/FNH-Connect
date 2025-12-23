import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getAdminShifts(filters: {
  staffId?: number;
  startDate?: string;
  endDate?: string;
  status?: "Active" | "Closed";
  search?: string;
}) {
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

  const shifts = await prisma.shift.findMany({
    where,
    include: {
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

export async function getCashTrackingSummary() {
  // Aggregate stats for the admin dashboard
  const [totalCollected, totalRefunded, activeShiftsCount] = await Promise.all([
    prisma.shift.aggregate({
      _sum: { totalCollected: true },
    }),
    prisma.shift.aggregate({
      _sum: { totalRefunded: true },
    }),
    prisma.shift.count({
      where: { isActive: true },
    }),
  ]);

  return {
    totalCollected: totalCollected._sum.totalCollected?.toNumber() || 0,
    totalRefunded: totalRefunded._sum.totalRefunded?.toNumber() || 0,
    activeShiftsCount,
  };
}
