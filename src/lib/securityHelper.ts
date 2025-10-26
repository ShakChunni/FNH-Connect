async function callSecurityAPI(action: string, data: any) {
  try {
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/auth/security/check`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, ...data }),
      }
    );

    if (!response.ok) {
      throw new Error(`Security API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Security API call failed for ${action}:`, error);
    // Return safe defaults on error
    switch (action) {
      case "checkIPBlock":
        return { blocked: false };
      case "trackSuspicious":
        return { shouldBlock: false };
      case "getRateLimit":
        return { rateLimited: false, attemptsLeft: 5 };
      case "trackLoginAttempt":
        return { blocked: false };
      default:
        return null;
    }
  }
}

export async function checkIPBlock(ip: string) {
  return await callSecurityAPI("checkIPBlock", { ip });
}

export async function trackSuspiciousActivity(
  ip: string,
  path: string,
  userAgent?: string
) {
  const result = await callSecurityAPI("trackSuspicious", {
    ip,
    path,
    userAgent,
  });
  return result?.shouldBlock || false;
}

export async function getLoginRateLimitStatus(ip: string) {
  return await callSecurityAPI("getRateLimit", { ip });
}

export async function trackLoginAttempt(
  ip: string,
  success: boolean,
  employeeId?: string,
  userAgent?: string
) {
  return await callSecurityAPI("trackLoginAttempt", {
    ip,
    success,
    employeeId,
    userAgent,
  });
}

export async function autoCleanup() {
  return await callSecurityAPI("autoCleanup", {});
}
