/**
 * Blocked IPs Retrieval Endpoint
 *
 * Lightweight endpoint to fetch currently blocked IPs from database
 * Called by cron job every 1 minute to sync with middleware
 *
 * Security: Protected with x-cron-secret header
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

// === VALIDATE CRON SECRET ===
function validateCronSecret(request: NextRequest): boolean {
  const headerSecret = request.headers.get("x-cron-secret");

  // In development without secret, allow all
  if (!CRON_SECRET && process.env.NODE_ENV === "development") {
    console.log("[Blocked IPs] Dev mode: No secret required");
    return true;
  }

  // In production, secret is required
  if (!CRON_SECRET) {
    console.error("[Blocked IPs] CRON_SECRET not configured!");
    return false;
  }

  if (!headerSecret) {
    console.error("[Blocked IPs] No x-cron-secret header provided");
    return false;
  }

  const isValid = headerSecret === CRON_SECRET;
  if (!isValid) {
    console.error(
      "[Blocked IPs] Invalid secret. Header length:",
      headerSecret.length,
      "Expected length:",
      CRON_SECRET.length
    );
  }

  return isValid;
}

export async function GET(request: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid cron secret" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();

    // Fetch all currently blocked IPs (permanent or not yet expired)
    const blockedIPs = await prisma.blockedIP.findMany({
      where: {
        OR: [
          { is_permanent: true },
          {
            AND: [
              { blocked_until: { not: null } },
              { blocked_until: { gt: now } },
            ],
          },
        ],
      },
      select: {
        ip_address: true,
        reason: true,
        blocked_until: true,
        is_permanent: true,
      },
    });

    return NextResponse.json({
      success: true,
      blockedIPs: blockedIPs.map((b) => b.ip_address),
      details: blockedIPs,
      count: blockedIPs.length,
      synced: true,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[Blocked IPs] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blocked IPs" },
      { status: 500 }
    );
  } finally {
    // ✅ Always disconnect Prisma in serverless
    await prisma.$disconnect();
  }
}
