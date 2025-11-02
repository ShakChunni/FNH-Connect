import { prisma } from "@/lib/prisma";

export async function runSessionCleanup(now = new Date()) {
  const deletedSessions = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  return {
    success: true as const,
    cleaned: deletedSessions.count,
    timestamp: now.toISOString(),
  };
}
