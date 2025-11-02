import { prisma } from "@/lib/prisma";

const LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_DURATION = 60 * 60 * 1000; // 1 hour

// Get KL time
function getKLTime(): Date {
  return new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
}

export async function trackLoginAttempt(
  ip: string,
  success: boolean,
  userAgent?: string
): Promise<{ blocked: boolean; timeLeft?: number }> {
  const klTime = getKLTime();

  if (success) {
    await prisma.rateLimit.deleteMany({
      where: { ip_address: ip },
    });
    return { blocked: false };
  }

  // Track failed login
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

  // Log the failed attempt with KL time
  await prisma.securityLog.create({
    data: {
      ip_address: ip,
      action: "LOGIN_FAILED",
      user_agent: userAgent,
      description: `Failed login attempt from ${ip} (${result.login_attempts}/${LOGIN_MAX_ATTEMPTS})`,
      severity:
        result.login_attempts >= LOGIN_MAX_ATTEMPTS - 1 ? "HIGH" : "MEDIUM",
      timestamp: klTime, // KL time
    },
  });

  // Check if we should block this IP
  if (result.login_attempts >= LOGIN_MAX_ATTEMPTS) {
    const blockUntil = new Date(klTime.getTime() + LOGIN_BLOCK_DURATION);

    // Create temporary IP block
    await prisma.blockedIP.upsert({
      where: { ip_address: ip },
      update: {
        reason: "Too many login attempts",
        description: `Blocked after ${LOGIN_MAX_ATTEMPTS} failed login attempts`,
        blocked_at: klTime,
        blocked_until: blockUntil,
        is_permanent: false,
        user_agent: userAgent,
        attempt_count: result.login_attempts,
      },
      create: {
        ip_address: ip,
        reason: "Too many login attempts",
        description: `Blocked after ${LOGIN_MAX_ATTEMPTS} failed login attempts`,
        blocked_at: klTime,
        blocked_until: blockUntil,
        is_permanent: false,
        user_agent: userAgent,
        attempt_count: result.login_attempts,
      },
    });

    // Log the blocking action with KL time
    await prisma.securityLog.create({
      data: {
        ip_address: ip,
        action: "RATE_LIMIT_BLOCK",
        user_agent: userAgent,
        description: `IP temporarily blocked for ${
          LOGIN_BLOCK_DURATION / 60000
        } minutes after ${LOGIN_MAX_ATTEMPTS} failed attempts`,
        severity: "CRITICAL",
        timestamp: klTime, // KL time
      },
    });

    const timeLeft = Math.ceil(LOGIN_BLOCK_DURATION / 60000); // Convert to minutes
    return { blocked: true, timeLeft };
  }

  return { blocked: false };
}
