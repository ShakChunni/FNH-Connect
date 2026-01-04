import { prisma } from "@/lib/prisma";

interface ActivityLogFilters {
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch paginated activity logs with filters
 */
export async function getActivityLogs(filters: ActivityLogFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action && filters.action !== "All") {
    where.action = { contains: filters.action, mode: "insensitive" };
  }

  if (filters.entityType && filters.entityType !== "All") {
    where.entityType = filters.entityType;
  }

  // Handle date range with BDT timezone (UTC+6)
  if (filters.startDate || filters.endDate) {
    where.timestamp = {};

    // Parse dates as Bangladesh time (UTC+6)
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

    if (filters.startDate) {
      const [year, month, day] = filters.startDate.split("-").map(Number);
      const startBDT = new Date(Date.UTC(year, month - 1, day) - BDT_OFFSET_MS);
      where.timestamp.gte = startBDT;
    }
    if (filters.endDate) {
      const [year, month, day] = filters.endDate.split("-").map(Number);
      const endBDT = new Date(
        Date.UTC(year, month - 1, day + 1) - BDT_OFFSET_MS
      );
      where.timestamp.lte = endBDT;
    }
  }

  // Search by user name or description
  if (filters.search) {
    where.OR = [
      {
        description: { contains: filters.search, mode: "insensitive" },
      },
      {
        user: {
          staff: {
            fullName: { contains: filters.search, mode: "insensitive" },
          },
        },
      },
      {
        action: { contains: filters.search, mode: "insensitive" },
      },
    ];
  }

  // Fetch logs and count in parallel
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      select: {
        id: true,
        userId: true,
        action: true,
        description: true,
        entityType: true,
        entityId: true,
        timestamp: true,
        ipAddress: true,
        deviceType: true,
        browserName: true,
        browserVersion: true,
        osType: true,
        deviceFingerprint: true,
        readableFingerprint: true,
        sessionId: true,
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            staff: {
              select: {
                id: true,
                fullName: true,
                role: true,
                photoUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get single activity log with full details
 */
export async function getActivityLogDetails(id: number) {
  const log = await prisma.activityLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          staff: {
            select: {
              id: true,
              fullName: true,
              role: true,
              photoUrl: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      },
      session: {
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          deviceType: true,
          browserName: true,
          browserVersion: true,
          osType: true,
          ipAddress: true,
          readableFingerprint: true,
        },
      },
    },
  });

  return log;
}

/**
 * Get summary statistics for activity logs
 */
export async function getActivityLogSummary(filters?: ActivityLogFilters) {
  // Build same filter conditions
  const where: any = {};

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.action && filters.action !== "All") {
    where.action = { contains: filters.action, mode: "insensitive" };
  }

  if (filters?.startDate || filters?.endDate) {
    where.timestamp = {};
    const BDT_OFFSET_MS = 6 * 60 * 60 * 1000;

    if (filters.startDate) {
      const [year, month, day] = filters.startDate.split("-").map(Number);
      const startBDT = new Date(Date.UTC(year, month - 1, day) - BDT_OFFSET_MS);
      where.timestamp.gte = startBDT;
    }
    if (filters.endDate) {
      const [year, month, day] = filters.endDate.split("-").map(Number);
      const endBDT = new Date(
        Date.UTC(year, month - 1, day + 1) - BDT_OFFSET_MS
      );
      where.timestamp.lte = endBDT;
    }
  }

  // Run aggregation queries in parallel
  const [totalActions, uniqueUsers, loginCount, recentLogs] = await Promise.all(
    [
      // Total actions count
      prisma.activityLog.count({ where }),

      // Unique users count
      prisma.activityLog.groupBy({
        by: ["userId"],
        where,
        _count: true,
      }),

      // Login actions count
      prisma.activityLog.count({
        where: {
          ...where,
          action: { contains: "LOGIN", mode: "insensitive" },
        },
      }),

      // Most recent 5 logs for "recent activity" indicator
      prisma.activityLog.findMany({
        where,
        select: { timestamp: true },
        orderBy: { timestamp: "desc" },
        take: 1,
      }),
    ]
  );

  return {
    totalActions,
    uniqueUsers: uniqueUsers.length,
    loginCount,
    lastActivity: recentLogs.length > 0 ? recentLogs[0].timestamp : null,
  };
}

/**
 * Get distinct action types for filter dropdown
 */
export async function getDistinctActionTypes() {
  const actions = await prisma.activityLog.findMany({
    select: {
      action: true,
    },
    distinct: ["action"],
    orderBy: {
      action: "asc",
    },
  });

  return actions.map((a) => a.action);
}

/**
 * Get users who have activity logs (for user filter dropdown)
 */
export async function getUsersWithActivityLogs() {
  const users = await prisma.activityLog.findMany({
    select: {
      user: {
        select: {
          id: true,
          username: true,
          staff: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
    },
    distinct: ["userId"],
  });

  // Deduplicate and format
  const uniqueUsers = new Map();
  users.forEach((log) => {
    if (log.user && !uniqueUsers.has(log.user.id)) {
      uniqueUsers.set(log.user.id, {
        id: log.user.id,
        username: log.user.username,
        fullName: log.user.staff?.fullName || log.user.username,
      });
    }
  });

  return Array.from(uniqueUsers.values());
}
