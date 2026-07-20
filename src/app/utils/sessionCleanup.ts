import { prisma } from "@/lib/prisma";
import {
  closeActiveStaffCashShiftsIfNoUnexpiredSession,
} from "@/services/staffShiftClosureService";

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
    const expiredSessions = await prisma.session.findMany({
      where: { expiresAt: { lt: now } },
      select: {
        id: true,
        userId: true,
        user: { select: { staffId: true } },
      },
    });

    const expiredSessionIds = expiredSessions.map((session) => session.id);
    const staffIds = Array.from(
      new Set(
        expiredSessions
          .map((session) => session.user.staffId)
          .filter((staffId): staffId is number => staffId !== null),
      ),
    );

    const result = await prisma.$transaction(async (tx) => {
      // An expired session is a shift boundary. Close both portal ledgers
      // before removing the session, using the same idempotent closure used by
      // explicit logout.
      for (const staffId of staffIds) {
        await closeActiveStaffCashShiftsIfNoUnexpiredSession({
          tx,
          staffId,
          endedAt: now,
          generalNotes: "Shift auto-closed on session expiry",
          infertilityNotes: "HSI Center shift auto-closed on session expiry",
        });
      }

      let disconnectedLogs = 0;
      let deletedSessions = 0;

      if (expiredSessionIds.length > 0) {
        const disconnected = await tx.activityLog.updateMany({
          where: { sessionId: { in: expiredSessionIds } },
          data: { sessionId: null },
        });
        disconnectedLogs = disconnected.count;

        const deleted = await tx.session.deleteMany({
          where: { id: { in: expiredSessionIds } },
        });
        deletedSessions = deleted.count;
      }

      return { disconnectedLogs, deletedSessions };
    });

    console.info("[Session Cleanup] Deleted expired sessions", {
      cleaned: result.deletedSessions,
      disconnectedLogs: result.disconnectedLogs,
      cutoffUtc: now.toISOString(),
    });

    return {
      success: true,
      cleaned: result.deletedSessions,
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
