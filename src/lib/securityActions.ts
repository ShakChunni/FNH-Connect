/**
 * Security Helper Functions
 *
 * These functions work with the Prisma database to track security events,
 * login attempts, and suspicious activity.
 *
 * Used by:
 * - /api/auth/login - Track login attempts
 * - /api/security/* - Security monitoring endpoints
 */

import { prisma } from "./prisma";

// ═══════════════════════════════════════════════════════════════
// LOGIN ATTEMPT TRACKING
// ═══════════════════════════════════════════════════════════════

/**
 * Track login attempt (success or failure)
 */
export async function trackLoginAttempt(params: {
  ipAddress: string;
  username: string;
  success: boolean;
  userAgent?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        ip_address: params.ipAddress,
        username: params.username,
        success: params.success,
        user_agent: params.userAgent || null,
        metadata: params.metadata || {},
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("[Security] Failed to track login attempt:", error);
    // Don't throw - logging failure shouldn't break login flow
  }
}

/**
 * Get failed login attempts for an IP in the last N minutes
 */
export async function getFailedLoginAttempts(
  ipAddress: string,
  windowMinutes: number = 15
): Promise<number> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = await prisma.loginAttempt.count({
      where: {
        ip_address: ipAddress,
        success: false,
        timestamp: {
          gte: windowStart,
        },
      },
    });

    return count;
  } catch (error) {
    console.error("[Security] Failed to get failed login attempts:", error);
    return 0;
  }
}

/**
 * Get failed login attempts for a username in the last N minutes
 */
export async function getFailedLoginAttemptsForUser(
  username: string,
  windowMinutes: number = 15
): Promise<number> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = await prisma.loginAttempt.count({
      where: {
        username: username,
        success: false,
        timestamp: {
          gte: windowStart,
        },
      },
    });

    return count;
  } catch (error) {
    console.error(
      "[Security] Failed to get failed login attempts for user:",
      error
    );
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// IP BLOCKING
// ═══════════════════════════════════════════════════════════════

/**
 * Check if an IP is currently blocked
 */
export async function checkIPBlock(ipAddress: string): Promise<{
  isBlocked: boolean;
  reason?: string;
  blockedUntil?: Date | null;
}> {
  try {
    const now = new Date();

    const block = await prisma.blockedIP.findUnique({
      where: { ip_address: ipAddress },
    });

    if (!block) {
      return { isBlocked: false };
    }

    // Check if permanent block
    if (block.is_permanent) {
      return {
        isBlocked: true,
        reason: block.reason,
        blockedUntil: null,
      };
    }

    // Check if temporary block is still active
    if (block.blocked_until && block.blocked_until > now) {
      return {
        isBlocked: true,
        reason: block.reason,
        blockedUntil: block.blocked_until,
      };
    }

    // Block has expired, remove it
    await prisma.blockedIP.delete({
      where: { ip_address: ipAddress },
    });

    return { isBlocked: false };
  } catch (error) {
    console.error("[Security] Failed to check IP block:", error);
    return { isBlocked: false }; // Fail open - don't block legitimate users
  }
}

/**
 * Block an IP address
 */
export async function blockIP(params: {
  ipAddress: string;
  reason: string;
  description?: string;
  paths?: string[];
  durationHours?: number; // NULL for permanent
  userAgent?: string;
}): Promise<void> {
  try {
    const now = new Date();
    const blockedUntil = params.durationHours
      ? new Date(now.getTime() + params.durationHours * 60 * 60 * 1000)
      : null;

    await prisma.blockedIP.upsert({
      where: { ip_address: params.ipAddress },
      create: {
        ip_address: params.ipAddress,
        reason: params.reason,
        description: params.description || null,
        paths: params.paths || [],
        blocked_at: now,
        blocked_until: blockedUntil,
        is_permanent: !params.durationHours,
        attempt_count: 1,
        user_agent: params.userAgent || null,
      },
      update: {
        reason: params.reason,
        description: params.description || null,
        blocked_until: blockedUntil,
        is_permanent: !params.durationHours,
        attempt_count: { increment: 1 },
      },
    });

    console.log(
      `[Security] Blocked IP ${params.ipAddress}: ${params.reason}${
        params.durationHours ? ` for ${params.durationHours}h` : " permanently"
      }`
    );
  } catch (error) {
    console.error("[Security] Failed to block IP:", error);
  }
}

// ═══════════════════════════════════════════════════════════════
// SECURITY LOGGING
// ═══════════════════════════════════════════════════════════════

/**
 * Log suspicious activity
 */
export async function trackSuspiciousActivity(params: {
  ipAddress: string;
  action: string;
  path?: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        ip_address: params.ipAddress,
        action: params.action,
        path: params.path || null,
        severity: params.severity,
        timestamp: new Date(),
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    console.error("[Security] Failed to log suspicious activity:", error);
  }
}

/**
 * Clean up old security logs (called by cron job)
 */
export async function cleanupSecurityLogs(
  retentionDays: number = 30
): Promise<number> {
  try {
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    );

    const result = await prisma.securityLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("[Security] Failed to cleanup security logs:", error);
    return 0;
  }
}

/**
 * Clean up old login attempts (called by cron job)
 */
export async function cleanupLoginAttempts(
  retentionDays: number = 7
): Promise<number> {
  try {
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    );

    const result = await prisma.loginAttempt.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("[Security] Failed to cleanup login attempts:", error);
    return 0;
  }
}
