import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // Need Node.js for Prisma
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

// === HELPER FUNCTIONS ===
function validateCronSecret(request: NextRequest): boolean {
  const headerSecret = request.headers.get("x-cron-secret");

  // In development without secret, allow all
  if (!CRON_SECRET && process.env.NODE_ENV === "development") {
    console.log("[Middleware Sync] Dev mode: No secret required");
    return true;
  }

  // In production, secret is required
  if (!CRON_SECRET) {
    console.error("[Middleware Sync] CRON_SECRET not configured!");
    return false;
  }

  if (!headerSecret) {
    console.error("[Middleware Sync] No x-cron-secret header provided");
    return false;
  }

  const isValid = headerSecret === CRON_SECRET;
  if (!isValid) {
    console.error(
      "[Middleware Sync] Invalid secret. Header length:",
      headerSecret.length,
      "Expected length:",
      CRON_SECRET.length
    );
  }

  return isValid;
}

// === MAIN SYNC HANDLER ===
export async function GET(request: NextRequest) {
  try {
    // Validate cron secret
    if (!validateCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const results = {
      middlewareData: {
        events: 0,
        suspicious: 0,
        blocked: 0,
      },
      database: {
        securityLogs: 0,
        blockedIPs: 0,
        cleaned: {
          oldSecurityLogs: 0,
          expiredBlocks: 0,
          oldRateLimits: 0,
        },
      },
      sync: {
        blockedIPsToMiddleware: 0,
      },
    };

    // === STEP 1: FETCH SECURITY DATA FROM EDGE MIDDLEWARE ===
    // Import middleware functions dynamically
    const { getSecurityData, clearSecurityEvents, syncBlockedIPs } =
      await import("@/middleware");

    const middlewareData = getSecurityData();
    results.middlewareData.events = middlewareData.events.length;
    results.middlewareData.suspicious = middlewareData.suspicious.length;
    results.middlewareData.blocked = middlewareData.blocked.length;

    // === STEP 2: WRITE SECURITY EVENTS TO DATABASE ===
    if (middlewareData.events.length > 0) {
      const securityLogs = middlewareData.events.map((event: any) => ({
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

      results.database.securityLogs = created.count;
    }

    // === STEP 3: WRITE BLOCKED IPS TO DATABASE ===
    if (middlewareData.blocked.length > 0) {
      for (const ip of middlewareData.blocked) {
        // Check if already blocked
        const existing = await prisma.blockedIP.findUnique({
          where: { ip_address: ip },
        });

        if (!existing) {
          // Find suspicious data for this IP
          const suspiciousData = middlewareData.suspicious.find(
            (s: any) => s.ip === ip
          );

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

          results.database.blockedIPs++;
        }
      }
    }

    // === STEP 4: LOG SUSPICIOUS IPS (not yet blocked) ===
    if (middlewareData.suspicious.length > 0) {
      for (const entry of middlewareData.suspicious) {
        if (!middlewareData.blocked.includes(entry.ip)) {
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

    // === STEP 5: CLEANUP OLD DATA ===
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
    results.database.cleaned.oldSecurityLogs = deletedLogs.count;

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
    results.database.cleaned.expiredBlocks = deletedBlocks.count;

    // Clean old rate limit entries (keep 24 hours)
    const deletedRateLimits = await prisma.rateLimit.deleteMany({
      where: {
        window_start: {
          lt: oneDayAgo,
        },
      },
    });
    results.database.cleaned.oldRateLimits = deletedRateLimits.count;

    // === STEP 6: FETCH ACTIVE BLOCKED IPS FROM DATABASE ===
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

    // === STEP 7: SYNC BLOCKED IPS BACK TO MIDDLEWARE ===
    syncBlockedIPs(blockedIPList);
    results.sync.blockedIPsToMiddleware = blockedIPList.length;

    // === STEP 8: CLEAR MIDDLEWARE EVENTS (prevent double-processing) ===
    clearSecurityEvents();

    // === STEP 9: RETURN SYNC RESULTS ===
    return NextResponse.json(
      {
        success: true,
        message: "Security data synced successfully",
        results,
        timestamp: now.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Middleware Sync] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    // ✅ CRITICAL: Always disconnect Prisma in serverless context
    // Prevents connection pool exhaustion in production
    await prisma.$disconnect();
  }
}

// === HEALTH CHECK ENDPOINT ===
export async function POST(request: NextRequest) {
  // Allow POST method to return same response as GET (for testing)
  return GET(request);
}
