/**
 * Session Cleanup Endpoint
 *
 * Cleanup is intentionally not runnable through HTTP.
 *
 * Expired sessions are cleaned by the internal `node-cron` scheduler started
 * from `src/instrumentation.ts`. This route only exists to make accidental
 * external calls obvious in logs and responses.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function disabledResponse(request: NextRequest) {
  console.warn("[Session Cleanup] HTTP endpoint called but disabled", {
    method: request.method,
    path: request.nextUrl.pathname,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json(
    {
      success: false,
      error: "Session cleanup is handled by internal node-cron only.",
      schedule: "0 0 * * *",
      timezone: "Asia/Dhaka",
    },
    { status: 410 },
  );
}

export async function GET(request: NextRequest) {
  return disabledResponse(request);
}

export async function POST(request: NextRequest) {
  return disabledResponse(request);
}
