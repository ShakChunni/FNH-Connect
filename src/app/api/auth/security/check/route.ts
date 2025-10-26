import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RATE_LIMIT_CONFIG = {
  LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_BLOCK_DURATION: 60 * 60 * 1000, // 1 hour
};

// Validation schema for security check requests
const securityCheckSchema = z.object({
  action: z.enum([
    "checkIPBlock",
    "trackSuspicious",
    "getRateLimit",
    "trackLoginAttempt",
    "autoCleanup",
  ]),
  ip: z.string().optional(),
  path: z.string().optional(),
  userAgent: z.string().optional(),
  success: z.boolean().optional(),
  employeeId: z.string().optional(),
});

// Helper: Get KL timezone time
function getKLTime(): Date {
  return new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
}

// Helper: Check if IP is blocked
async function checkIPBlockHelper(ip: string): Promise<boolean> {
  const blockedIP = await prisma.blockedIP.findUnique({
    where: { ip_address: ip },
  });

  if (!blockedIP) {
    return false;
  }

  // Check if permanent block
  if (blockedIP.is_permanent) {
    return true;
  }

  // Check if temporary block is still active
  const now = new Date();
  if (blockedIP.blocked_until && blockedIP.blocked_until > now) {
    return true;
  }

  // Block has expired, clean up
  if (blockedIP.blocked_until && blockedIP.blocked_until <= now) {
    await prisma.blockedIP.delete({
      where: { ip_address: ip },
    });
  }

  return false;
}

// Helper: Track login attempt
async function trackLoginAttemptHelper(
  ip: string,
  success: boolean,
  userAgent?: string
): Promise<{ blocked: boolean; timeLeft?: number }> {
  const klTime = getKLTime();

  if (success) {
    // Clear rate limit on successful login
    await prisma.rateLimit.deleteMany({
      where: { ip_address: ip },
    });
    return { blocked: false };
  }

  // Track failed login attempt
  const result = await prisma.rateLimit.upsert({
    where: { ip_address: ip },
    update: {
      login_attempts: { increment: 1 },
      updatedAt: klTime,
    },
    create: {
      ip_address: ip,
      login_attempts: 1,
      window_start: klTime,
      createdAt: klTime,
      updatedAt: klTime,
    },
  });

  // Log the failed attempt
  await prisma.securityLog.create({
    data: {
      ip_address: ip,
      action: "LOGIN_FAILED",
      user_agent: userAgent,
      description: `Failed login attempt from ${ip} (${result.login_attempts}/${RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS})`,
      severity:
        result.login_attempts >= RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS - 1
          ? "HIGH"
          : "MEDIUM",
      timestamp: klTime,
    },
  });

  // Check if we should block this IP
  if (result.login_attempts >= RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS) {
    const blockUntil = new Date(
      klTime.getTime() + RATE_LIMIT_CONFIG.LOGIN_BLOCK_DURATION
    );

    // Create temporary IP block
    await prisma.blockedIP.upsert({
      where: { ip_address: ip },
      update: {
        reason: "Too many login attempts",
        description: `Blocked after ${RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS} failed login attempts`,
        blocked_at: klTime,
        blocked_until: blockUntil,
        is_permanent: false,
        user_agent: userAgent,
        attempt_count: result.login_attempts,
      },
      create: {
        ip_address: ip,
        reason: "Too many login attempts",
        description: `Blocked after ${RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS} failed login attempts`,
        blocked_at: klTime,
        blocked_until: blockUntil,
        is_permanent: false,
        user_agent: userAgent,
        attempt_count: result.login_attempts,
      },
    });

    // Log the blocking action
    await prisma.securityLog.create({
      data: {
        ip_address: ip,
        action: "RATE_LIMIT_BLOCK",
        user_agent: userAgent,
        description: `IP temporarily blocked for ${
          RATE_LIMIT_CONFIG.LOGIN_BLOCK_DURATION / 60000
        } minutes after ${
          RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS
        } failed attempts`,
        severity: "CRITICAL",
        timestamp: klTime,
      },
    });

    const timeLeft = Math.ceil(RATE_LIMIT_CONFIG.LOGIN_BLOCK_DURATION / 60000);
    return { blocked: true, timeLeft };
  }

  return { blocked: false };
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = securityCheckSchema.parse(body);

    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    switch (validated.action) {
      case "checkIPBlock":
        const isBlocked = await checkIPBlockHelper(validated.ip || clientIP);
        return NextResponse.json({
          blocked: isBlocked,
        });

      case "trackLoginAttempt":
        const trackResult = await trackLoginAttemptHelper(
          validated.ip || clientIP,
          validated.success || false,
          validated.userAgent
        );
        return NextResponse.json(trackResult);

      case "getRateLimit":
        const rateLimit = await prisma.rateLimit.findUnique({
          where: { ip_address: validated.ip || clientIP },
        });

        if (!rateLimit) {
          return NextResponse.json({
            rateLimited: false,
            attemptsLeft: RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS,
          });
        }

        const klTime = getKLTime();
        const timeSinceWindowStart =
          klTime.getTime() - rateLimit.window_start.getTime();

        // Reset if window has passed
        if (timeSinceWindowStart > RATE_LIMIT_CONFIG.LOGIN_WINDOW) {
          await prisma.rateLimit.delete({
            where: { ip_address: validated.ip || clientIP },
          });
          return NextResponse.json({
            rateLimited: false,
            attemptsLeft: RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS,
          });
        }

        return NextResponse.json({
          rateLimited:
            rateLimit.login_attempts >= RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS,
          attemptsLeft: Math.max(
            0,
            RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS - rateLimit.login_attempts
          ),
        });

      case "trackSuspicious":
        await prisma.securityLog.create({
          data: {
            ip_address: validated.ip || clientIP,
            action: "SUSPICIOUS_ACTIVITY",
            user_agent: validated.userAgent,
            description: `Suspicious activity detected at ${validated.path}`,
            severity: "HIGH",
            timestamp: getKLTime(),
          },
        });

        return NextResponse.json({
          shouldBlock: false,
        });

      case "autoCleanup":
        const now = new Date();

        // Delete expired temporary blocks
        const deletedBlocks = await prisma.blockedIP.deleteMany({
          where: {
            is_permanent: false,
            blocked_until: {
              lte: now,
            },
          },
        });

        // Delete old rate limit entries (older than 1 hour)
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const deletedRateLimits = await prisma.rateLimit.deleteMany({
          where: {
            updatedAt: {
              lt: oneHourAgo,
            },
          },
        });

        // Delete old security logs (older than 30 days)
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        const deletedLogs = await prisma.securityLog.deleteMany({
          where: {
            timestamp: {
              lt: thirtyDaysAgo,
            },
          },
        });

        console.log(
          `[Security Cleanup] Deleted: ${deletedBlocks.count} blocks, ${deletedRateLimits.count} rate limits, ${deletedLogs.count} logs`
        );

        return NextResponse.json({
          success: true,
          deletedBlocks: deletedBlocks.count,
          deletedRateLimits: deletedRateLimits.count,
          deletedLogs: deletedLogs.count,
        });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("Security check error:", error);

    // Return safe defaults on error to not expose internals
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
