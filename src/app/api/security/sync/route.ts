/**
 * Security Sync API Route (Node Runtime)
 *
 * This endpoint syncs security data from Edge middleware to database.
 * Called by external cron job (cron-job.org) every X minutes.
 *
 * Functions:
 * 1. Receives security events from middleware
 * 2. Writes blocked IPs, security logs to database
 * 3. Returns current list of blocked IPs for middleware sync
 * 4. Cleans up old data from database
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // Must use Node runtime for Prisma
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

// === HELPER FUNCTIONS ===
function validateCronSecret(request: NextRequest): boolean {
  const headerSecret = request.headers.get("x-cron-secret");

  // In development without secret, allow all
  if (!CRON_SECRET && process.env.NODE_ENV === "development") {
    console.log("[Security Sync] Dev mode: No secret required");
    return true;
  }

  // In production, secret is required
  if (!CRON_SECRET) {
    console.error("[Security Sync] CRON_SECRET not configured!");
    return false;
  }

  if (!headerSecret) {
    console.error("[Security Sync] No x-cron-secret header provided");
    return false;
  }

  const isValid = headerSecret === CRON_SECRET;
  if (!isValid) {
    console.error(
      "[Security Sync] Invalid secret. Header length:",
      headerSecret.length,
      "Expected length:",
      CRON_SECRET.length
    );
  }

  return isValid;
}

// === MAIN SYNC HANDLER ===
export async function POST(request: NextRequest) {
  try {
    // Validate cron secret
    if (!validateCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { events, suspicious, blocked } = body;

    const now = new Date();
    const results = {
      securityLogs: 0,
      blockedIPs: 0,
      cleaned: {
        oldSecurityLogs: 0,
        expiredBlocks: 0,
        oldRateLimits: 0,
      },
    };

    // === 1. PROCESS SECURITY EVENTS ===
    if (events && Array.isArray(events) && events.length > 0) {
      const securityLogs = events.map((event: any) => ({
        ip_address: event.ip,
        action: event.action,
        path: event.path,
        severity:
          event.action === "BLOCKED"
            ? "HIGH"
            : event.action === "RATE_LIMITED"
            ? "MEDIUM"
            : "LOW",
        timestamp: new Date(event.timestamp),
        metadata: {},
      }));

      const created = await prisma.securityLog.createMany({
        data: securityLogs,
        skipDuplicates: true,
      });

      results.securityLogs = created.count;
    }

    // === 2. PROCESS BLOCKED IPS ===
    if (blocked && Array.isArray(blocked) && blocked.length > 0) {
      for (const ip of blocked) {
        // Check if already blocked
        const existing = await prisma.blockedIP.findUnique({
          where: { ip_address: ip },
        });

        if (!existing) {
          // Find suspicious data for this IP
          const suspiciousData = suspicious?.find((s: any) => s.ip === ip);

          await prisma.blockedIP.create({
            data: {
              ip_address: ip,
              reason: "Suspicious activity detected",
              description: `Blocked due to ${
                suspiciousData?.hits || "multiple"
              } suspicious path access attempts`,
              paths: suspiciousData?.paths || [],
              blocked_at: now,
              blocked_until: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
              attempt_count: suspiciousData?.hits || 1,
              user_agent: null,
            },
          });

          results.blockedIPs++;
        }
      }
    }

    // === 3. PROCESS SUSPICIOUS IPS (not yet blocked) ===
    if (suspicious && Array.isArray(suspicious)) {
      for (const entry of suspicious) {
        if (!blocked?.includes(entry.ip)) {
          // Log suspicious activity
          await prisma.securityLog.create({
            data: {
              ip_address: entry.ip,
              action: "SUSPICIOUS_PATH",
              path: entry.paths[0] || "unknown",
              severity: entry.hits >= 2 ? "MEDIUM" : "LOW",
              timestamp: new Date(entry.lastHit),
              metadata: {
                totalHits: entry.hits,
                paths: entry.paths,
              },
            },
          });
        }
      }
    }

    // === 4. CLEANUP OLD DATA ===
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Clean old security logs (keep 7 days)
    const deletedLogs = await prisma.securityLog.deleteMany({
      where: {
        timestamp: {
          lt: sevenDaysAgo,
        },
      },
    });
    results.cleaned.oldSecurityLogs = deletedLogs.count;

    // Clean expired IP blocks
    const deletedBlocks = await prisma.blockedIP.deleteMany({
      where: {
        is_permanent: false,
        blocked_until: {
          not: null,
          lt: now,
        },
      },
    });
    results.cleaned.expiredBlocks = deletedBlocks.count;

    // Clean old rate limit entries (keep 24 hours)
    const deletedRateLimits = await prisma.rateLimit.deleteMany({
      where: {
        window_start: {
          lt: oneDayAgo,
        },
      },
    });
    results.cleaned.oldRateLimits = deletedRateLimits.count;

    // === 5. FETCH ACTIVE BLOCKED IPS FOR SYNC ===
    const activeBlockedIPs = await prisma.blockedIP.findMany({
      where: {
        OR: [
          { is_permanent: true },
          {
            blocked_until: {
              gt: now,
            },
          },
        ],
      },
      select: {
        ip_address: true,
      },
    });

    const blockedIPList = activeBlockedIPs.map((b) => b.ip_address);
    return NextResponse.json({
      success: true,
      results,
      blockedIPs: blockedIPList,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[Security Sync] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    // ✅ Always disconnect Prisma in serverless
    await prisma.$disconnect();
  }
}

// === GET HANDLER - Health Check ===
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Get stats
    const [totalBlockedIPs, recentSecurityLogs, activeBlocks] =
      await Promise.all([
        prisma.blockedIP.count(),
        prisma.securityLog.count({
          where: {
            timestamp: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.blockedIP.count({
          where: {
            OR: [
              { is_permanent: true },
              {
                blocked_until: {
                  gt: now,
                },
              },
            ],
          },
        }),
      ]);

    return NextResponse.json({
      status: "healthy",
      stats: {
        totalBlockedIPs,
        activeBlocks,
        recentSecurityLogs,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    // ✅ Always disconnect Prisma in serverless
    await prisma.$disconnect();
  }
}
