import { prisma } from "@/lib/prisma";
import { runSessionCleanup } from "../app/utils/sessionCleanup";

export const SESSION_CLEANUP_LAST_RUN_CONFIG_KEY =
  "LAST_SESSION_CLEANUP_BDT_DATE";
export const SESSION_CLEANUP_TIMEZONE = "Asia/Dhaka";
export const SESSION_CLEANUP_CRON_EXPRESSION = "0 0 * * *";

declare global {
  var __fnhSessionCleanupCronStarted: boolean | undefined;
}

type MaintenanceResults = {
  session: Awaited<ReturnType<typeof runSessionCleanup>>;
  alreadyRanToday: boolean;
  bdtDate: string;
};

export function logSessionCleanupStartupStatus() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  console.info("[Session Cleanup] Startup status", {
    internalCron: {
      enabled: true,
      expression: SESSION_CLEANUP_CRON_EXPRESSION,
      timezone: SESSION_CLEANUP_TIMEZONE,
    },
    httpTriggerEnabled: false,
  });
}

export async function startSessionCleanupCron() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (globalThis.__fnhSessionCleanupCronStarted) {
    console.info("[Session Cleanup] Internal cron already scheduled");
    return;
  }

  globalThis.__fnhSessionCleanupCronStarted = true;
  logSessionCleanupStartupStatus();

  try {
    const { schedule } = await import("node-cron");

    schedule(
      SESSION_CLEANUP_CRON_EXPRESSION,
      async () => {
        const now = new Date();
        console.info("[Session Cleanup] Internal cron triggered", {
          nowUtc: now.toISOString(),
          timezone: SESSION_CLEANUP_TIMEZONE,
        });

        try {
          const result = await runMaintenanceJobs(now, "internal-cron");
          console.info("[Session Cleanup] Internal cron finished", {
            bdtDate: result.bdtDate,
            cleaned: result.session.cleaned,
            alreadyRanToday: result.alreadyRanToday,
          });
        } catch (error) {
          console.error("[Session Cleanup] Internal cron failed:", error);
        }
      },
      {
        timezone: SESSION_CLEANUP_TIMEZONE,
      },
    );

    console.info("[Session Cleanup] Internal cron scheduled", {
      expression: SESSION_CLEANUP_CRON_EXPRESSION,
      timezone: SESSION_CLEANUP_TIMEZONE,
      httpTriggerEnabled: false,
    });
  } catch (error) {
    globalThis.__fnhSessionCleanupCronStarted = false;
    console.error("[Session Cleanup] Failed to schedule internal cron:", error);
  }
}

/**
 * Run all nightly maintenance jobs.
 *
 * It is BDT-day aware: a HospitalConfig row tracks the last BDT date
 * the cleanup ran on, so calling this more than once in the same
 * Bangladesh calendar day is a no-op (still safe — it just skips the
 * delete).
 */
export async function runMaintenanceJobs(
  now = new Date(),
  source = "unknown",
): Promise<MaintenanceResults> {
  // We import the timezone helper lazily so this module stays cheap to
  // import in non-runtime contexts (tests, scripts, etc.).
  const { getTodayBDTCalendarDateParts, formatCalendarPartsISO } =
    await import("./timezone");

  const bdtDate = formatCalendarPartsISO(getTodayBDTCalendarDateParts());

  console.info("[Session Cleanup] Maintenance check started", {
    source,
    bdtDate,
    nowUtc: now.toISOString(),
  });

  const lastRun = await prisma.hospitalConfig.findUnique({
    where: { key: SESSION_CLEANUP_LAST_RUN_CONFIG_KEY },
    select: { value: true },
  });

  if (lastRun?.value === bdtDate) {
    console.info("[Session Cleanup] Skipped; already ran for BDT date", {
      source,
      bdtDate,
    });

    return {
      session: {
        success: true,
        cleaned: 0,
        timestamp: now.toISOString(),
      },
      alreadyRanToday: true,
      bdtDate,
    };
  }

  const session = await runSessionCleanup(now);

  await prisma.hospitalConfig.upsert({
    where: { key: SESSION_CLEANUP_LAST_RUN_CONFIG_KEY },
    create: {
      key: SESSION_CLEANUP_LAST_RUN_CONFIG_KEY,
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

  console.info("[Session Cleanup] Maintenance completed", {
    source,
    bdtDate,
    cleaned: session.cleaned,
    timestamp: session.timestamp,
  });

  return { session, alreadyRanToday: false, bdtDate };
}
