import { prisma } from "@/lib/prisma";

export async function runSessionCleanup(now = new Date()) {
  console.info("[Session Cleanup] Deleting expired sessions", {
    cutoffUtc: now.toISOString(),
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
    cutoffUtc: now.toISOString(),
  });

  return {
    success: true as const,
    cleaned: deletedSessions.count,
    timestamp: now.toISOString(),
  };
}
