/**
 * Internal Session Cleanup Endpoint
 *
 * Called by an external cron job (cron-job.org, EasyCron, etc.) once a
 * day at 00:00 BDT (= 18:00 UTC the previous day).
 *
 * Security: Protected with x-cron-secret header (must match CRON_SECRET).
 *
 * Idempotency: A BDT-day guard is held in HospitalConfig so a misfiring
 * cron job (or an out-of-order retry) cannot run cleanup more than once
 * per Bangladesh calendar day.
 *
 * Health:
 *   GET  /api/internal/session-cleanup  -> reports last run (no cleanup)
 *   POST /api/internal/session-cleanup  -> runs cleanup if not done today
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSessionCleanup } from "@/app/utils/sessionCleanup";
import {
  BDT_OFFSET_MS,
  getTodayBDTCalendarDateParts,
  formatCalendarPartsISO,
} from "@/lib/timezone";

export const runtime = "nodejs"; // Prisma requires Node runtime
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;
const LAST_RUN_CONFIG_KEY = "LAST_SESSION_CLEANUP_BDT_DATE";

function validateCronSecret(request: NextRequest): boolean {
  const headerSecret = request.headers.get("x-cron-secret");

  if (!CRON_SECRET && process.env.NODE_ENV === "development") {
    return true;
  }

  if (!CRON_SECRET) {
    console.error(
      "[Session Cleanup] CRON_SECRET not configured. Refusing to run.",
    );
    return false;
  }

  if (!headerSecret) {
    console.error("[Session Cleanup] No x-cron-secret header provided");
    return false;
  }

  return headerSecret === CRON_SECRET;
}

function getTodayBDTDateString(): string {
  const parts = getTodayBDTCalendarDateParts();
  return formatCalendarPartsISO(parts);
}

interface HandleResult {
  success: boolean;
  cleaned: number;
  ranAt: string;
  bdtDate: string;
  alreadyRanToday: boolean;
}

async function performCleanup(): Promise<HandleResult> {
  const bdtDate = getTodayBDTDateString();
  const now = new Date();
  const nowIso = now.toISOString();

  const existing = await prisma.hospitalConfig.findUnique({
    where: { key: LAST_RUN_CONFIG_KEY },
    select: { value: true },
  });

  if (existing?.value === bdtDate) {
    return {
      success: true,
      cleaned: 0,
      ranAt: nowIso,
      bdtDate,
      alreadyRanToday: true,
    };
  }

  const result = await runSessionCleanup(now);

  await prisma.hospitalConfig.upsert({
    where: { key: LAST_RUN_CONFIG_KEY },
    create: {
      key: LAST_RUN_CONFIG_KEY,
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

  return {
    success: true,
    cleaned: result.cleaned,
    ranAt: nowIso,
    bdtDate,
    alreadyRanToday: false,
  };
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid cron secret" },
      { status: 401 },
    );
  }

  try {
    const result = await performCleanup();
    return NextResponse.json(
      {
        success: true,
        result,
        schedule: "Runs at 00:00 Asia/Dhaka (BDT) daily",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Session Cleanup] Failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run session cleanup",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid cron secret" },
      { status: 401 },
    );
  }

  try {
    const bdtDate = getTodayBDTDateString();
    const lastRun = await prisma.hospitalConfig.findUnique({
      where: { key: LAST_RUN_CONFIG_KEY },
      select: { value: true, updatedAt: true },
    });

    const bdtOffsetHours = BDT_OFFSET_MS / (60 * 60 * 1000);

    return NextResponse.json(
      {
        success: true,
        bdtDate,
        bdtTimezone: "Asia/Dhaka",
        bdtUtcOffsetHours: bdtOffsetHours,
        lastRunBdtDate: lastRun?.value ?? null,
        lastRunAtUtc: lastRun?.updatedAt?.toISOString() ?? null,
        alreadyRanToday: lastRun?.value === bdtDate,
        schedule: "POST this endpoint at 00:00 Asia/Dhaka (BDT) daily",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Session Cleanup] Status check failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read session cleanup status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}
