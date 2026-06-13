import { prisma } from "@/lib/prisma";

export type SessionCleanupResult =
  | {
      success: true;
      cleaned: number;
      timestamp: string;
      error?: never;
    }
  | {
      success: false;
      cleaned: 0;
      timestamp: string;
      error: string;
    };

export async function runSessionCleanup(
  now = new Date(),
): Promise<SessionCleanupResult> {
  console.info("[Session Cleanup] Deleting expired sessions", {
    cutoffUtc: now.toISOString(),
  });

  try {
    // Defensively disconnect activity logs from expired sessions before
    // deleting them. The schema already uses onDelete: SetNull, but making
    // this explicit keeps the cleanup self-contained and protects against
    // unexpected FK issues if the relation ever changes.
    const disconnectedLogs = await prisma.activityLog.updateMany({
      where: {
        session: {
          expiresAt: { lt: now },
        },
      },
      data: { sessionId: null },
    });

    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.info("[Session Cleanup] Deleted expired sessions", {
      cleaned: deletedSessions.count,
      disconnectedLogs: disconnectedLogs.count,
      cutoffUtc: now.toISOString(),
    });

    return {
      success: true,
      cleaned: deletedSessions.count,
      timestamp: now.toISOString(),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown session cleanup error";

    console.error("[Session Cleanup] Failed to delete expired sessions", {
      error: message,
      cutoffUtc: now.toISOString(),
    });

    return {
      success: false,
      cleaned: 0,
      timestamp: now.toISOString(),
      error: message,
    };
  }
}
