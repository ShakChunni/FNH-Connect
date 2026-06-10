import { prisma } from "@/lib/prisma";
import { runSessionCleanup } from "../app/utils/sessionCleanup";

type MaintenanceResults = {
  session: Awaited<ReturnType<typeof runSessionCleanup>>;
  alreadyRanToday: boolean;
};

/**
 * Run all nightly maintenance jobs.
 *
 * This helper is shared between:
 *   - The cron endpoint at `/api/internal/session-cleanup`
 *   - Any ad-hoc admin trigger
 *
 * It is BDT-day aware: a HospitalConfig row tracks the last BDT date
 * the cleanup ran on, so calling this more than once in the same
 * Bangladesh calendar day is a no-op (still safe — it just skips the
 * delete).
 */
export async function runMaintenanceJobs(now = new Date()): Promise<MaintenanceResults> {
  // We import the timezone helper lazily so this module stays cheap to
  // import in non-runtime contexts (tests, scripts, etc.).
  const { getTodayBDTCalendarDateParts, formatCalendarPartsISO } =
    await import("./timezone");

  const bdtDate = formatCalendarPartsISO(getTodayBDTCalendarDateParts());

  const lastRun = await prisma.hospitalConfig.findUnique({
    where: { key: "LAST_SESSION_CLEANUP_BDT_DATE" },
    select: { value: true },
  });

  if (lastRun?.value === bdtDate) {
    return {
      session: {
        success: true,
        cleaned: 0,
        timestamp: now.toISOString(),
      },
      alreadyRanToday: true,
    };
  }

  const session = await runSessionCleanup(now);

  await prisma.hospitalConfig.upsert({
    where: { key: "LAST_SESSION_CLEANUP_BDT_DATE" },
    create: {
      key: "LAST_SESSION_CLEANUP_BDT_DATE",
      value: bdtDate,
      description: "Last BDT calendar date when session cleanup ran",
      updatedBy: 0,
    },
    update: {
      value: bdtDate,
      description: "Last BDT calendar date when session cleanup ran",
      updatedBy: 0,
    },
  });

  return { session, alreadyRanToday: false };
}

