import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import DeviceDetector from "node-device-detector";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { z } from "zod";
import {
  trackLoginAttempt,
  getFailedLoginAttempts,
  getFailedLoginAttemptsForUser,
  checkIPBlock,
  blockIP,
  trackSuspiciousActivity,
} from "@/lib/securityActions";
import type { SessionUser, LoginResponse } from "@/types/auth";

const SECRET_KEY = process.env.SECRET_KEY as string;

// Session Configuration
const SESSION_EXPIRATION_HOURS = parseInt(
  process.env.SESSION_EXPIRATION_HOURS || "24",
  10
);
const EXPIRATION_TIME = 60 * 60 * SESSION_EXPIRATION_HOURS; // in seconds

const COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE
  ? process.env.SESSION_COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production";

const COOKIE_HTTP_ONLY = process.env.SESSION_COOKIE_HTTP_ONLY
  ? process.env.SESSION_COOKIE_HTTP_ONLY === "true"
  : true;

const COOKIE_SAME_SITE = (process.env.SESSION_COOKIE_SAME_SITE ||
  "strict") as "strict";

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables");
}

// ✅ Zod schema for login validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  password: z.string().min(1, "Password is required"),
});

function generateDeviceFingerprint(
  ip: string,
  userAgent: string,
  device: any,
  os: any,
  client: any,
  userId?: number
): string {
  const components = [
    ip,
    client.name || "unknown",
    os.name || "unknown",
    device.type || "unknown",
    userId ? `user-${userId}` : "anonymous",
  ];

  const fingerprint = crypto
    .createHash("sha256")
    .update(components.join("|"))
    .digest("hex");

  return fingerprint;
}

interface DeviceInfoType {
  ipAddress: string;
  userAgent: string;
  deviceFingerprint: string;
  readableFingerprint: string;
  osType: string;
  browserName: string;
  browserVersion: string;
  deviceType: string;
  deviceString: string;
}

function getDeviceInfo(
  userAgent: string,
  clientIp: string,
  userId?: number
): DeviceInfoType {
  const detector = new DeviceDetector({
    clientIndexes: true,
    deviceIndexes: true,
    deviceAliasCode: false,
    deviceTrusted: true,
    maxUserAgentSize: 500,
  });

  const result = detector.detect(userAgent);

  const osName = result.os?.name || "Unknown";
  const osVersion = result.os?.version || "Unknown";
  let deviceType = result.device?.type || null;

  if (deviceType && typeof deviceType === "string") {
    deviceType =
      deviceType.charAt(0).toUpperCase() + deviceType.slice(1).toLowerCase();
  }

  if (
    !deviceType &&
    ((osName && ["Windows", "Mac OS", "Linux"].includes(osName)) ||
      result.os?.platform === "x64" ||
      result.os?.platform === "x86")
  ) {
    deviceType = "Desktop";
  }

  const deviceFingerprint = generateDeviceFingerprint(
    clientIp,
    userAgent,
    result.device,
    result.os,
    result.client,
    userId
  );

  const readableFingerprint = deviceFingerprint
    .substring(0, 12)
    .replace(/(.{2})/g, "$1:")
    .slice(0, -1)
    .toUpperCase();

  const deviceVendor = result.device?.brand || null;
  const deviceModel = result.device?.model || null;

  let deviceTypeDisplay = "Unknown Device";

  if (deviceVendor || deviceModel) {
    deviceTypeDisplay =
      [deviceVendor, deviceModel].filter(Boolean).join(" ").trim() ||
      "Unknown Device";

    if (
      deviceType &&
      !deviceTypeDisplay.toLowerCase().includes(deviceType.toLowerCase())
    ) {
      deviceTypeDisplay += ` (${deviceType})`;
    }
  } else if (result.client.name) {
    deviceTypeDisplay = `${result.client.name} ${
      result.client.version || ""
    }`.trim();
  }

  const osInfo = result.os.name
    ? `${result.os.name} ${result.os.version || ""}`.trim()
    : "Unknown OS";

  const deviceString = `${deviceTypeDisplay} on ${osInfo}`;

  return {
    ipAddress: clientIp,
    userAgent: userAgent,
    deviceFingerprint: deviceFingerprint,
    readableFingerprint: readableFingerprint,
    osType: result.os.name || "Unknown",
    browserName: result.client.name || "Unknown",
    browserVersion: result.client.version || "Unknown",
    deviceType: deviceType || "Unknown",
    deviceString,
  };
}

export async function POST(request: NextRequest) {
  let clientIp = "Unknown";
  let userAgent = "Unknown";
  let attemptedUsername = "";

  try {
    // ✅ CSRF Validation for state-changing request
    const csrfValid = validateCSRFToken(request);
    if (!csrfValid) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    // Get client IP and user agent early for security tracking
    clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "Unknown";

    if (clientIp.includes(",")) {
      clientIp = clientIp.split(",")[0].trim();
    }

    if (clientIp === "::1" || clientIp === "127.0.0.1") {
      clientIp = "localhost";
    }

    userAgent = request.headers.get("user-agent") || "Unknown";

    // ✅ Check if IP is blocked
    const ipBlockCheck = await checkIPBlock(clientIp);
    if (ipBlockCheck.isBlocked) {
      await trackSuspiciousActivity({
        ipAddress: clientIp,
        action: "LOGIN_ATTEMPT_BLOCKED_IP",
        severity: "HIGH",
        metadata: {
          reason: ipBlockCheck.reason,
          blockedUntil: ipBlockCheck.blockedUntil,
        },
      });

      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error:
            "Access denied. Your IP has been blocked due to suspicious activity.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // ✅ Validate with Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;
    attemptedUsername = username;

    // ✅ Check for excessive failed login attempts
    const failedIPAttempts = await getFailedLoginAttempts(clientIp, 15);
    const failedUserAttempts = await getFailedLoginAttemptsForUser(
      username,
      15
    );

    // Block IP after 10 failed attempts in 15 minutes
    if (failedIPAttempts >= 10) {
      await blockIP({
        ipAddress: clientIp,
        reason: "Excessive failed login attempts",
        description: `${failedIPAttempts} failed login attempts in 15 minutes`,
        durationHours: 1, // 1 hour block
        userAgent,
      });

      await trackSuspiciousActivity({
        ipAddress: clientIp,
        action: "RATE_LIMIT_LOGIN",
        severity: "HIGH",
        metadata: {
          attemptCount: failedIPAttempts,
          username,
        },
      });

      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error:
            "Too many failed login attempts. Your IP has been temporarily blocked.",
        },
        { status: 429 }
      );
    }

    // Warn after 5 failed attempts for specific username
    if (failedUserAttempts >= 5) {
      await trackSuspiciousActivity({
        ipAddress: clientIp,
        action: "MULTIPLE_FAILED_LOGIN_USER",
        severity: "MEDIUM",
        metadata: {
          attemptCount: failedUserAttempts,
          username,
        },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find user and include staff data
      const user = await tx.user.findUnique({
        where: { username },
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              role: true,
              specialization: true,
              email: true,
              phoneNumber: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!user) {
        // ✅ Track failed login attempt (invalid username)
        await trackLoginAttempt({
          ipAddress: clientIp,
          username,
          success: false,
          userAgent,
          metadata: { reason: "Invalid username" },
        });
        throw new Error("Invalid username or password");
      }

      if (!user.isActive) {
        // ✅ Track failed login attempt (inactive account)
        await trackLoginAttempt({
          ipAddress: clientIp,
          username,
          success: false,
          userAgent,
          metadata: { reason: "User account deactivated" },
        });
        throw new Error("Account has been deactivated");
      }

      if (!user.staff.isActive) {
        // ✅ Track failed login attempt (inactive staff)
        await trackLoginAttempt({
          ipAddress: clientIp,
          username,
          success: false,
          userAgent,
          metadata: { reason: "Staff account inactive" },
        });
        throw new Error("Staff account is inactive");
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        // ✅ Track failed login attempt (wrong password)
        await trackLoginAttempt({
          ipAddress: clientIp,
          username,
          success: false,
          userAgent,
          metadata: { reason: "Invalid password" },
        });
        throw new Error("Invalid username or password");
      }

      // Generate JWT token
      const sessionToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          staffId: user.staff.id,
          fullName: user.staff.fullName,
          role: user.staff.role,
        },
        SECRET_KEY,
        { expiresIn: EXPIRATION_TIME }
      );

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + EXPIRATION_TIME);

      // Get device information
      const deviceInfo = getDeviceInfo(userAgent, clientIp, user.id);

      // Check if session with same device fingerprint exists
      const existingSession = await tx.session.findFirst({
        where: {
          userId: user.id,
          deviceFingerprint: deviceInfo.deviceFingerprint,
        },
      });

      // Delete existing session to prevent multiple concurrent sessions from same device
      if (existingSession) {
        await tx.session.delete({
          where: { id: existingSession.id },
        });
      }

      // Create new session
      const session = await tx.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt,
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
          deviceFingerprint: deviceInfo.deviceFingerprint,
          readableFingerprint: deviceInfo.readableFingerprint,
          osType: deviceInfo.osType,
          browserName: deviceInfo.browserName,
          browserVersion: deviceInfo.browserVersion,
          deviceType: deviceInfo.deviceType,
        },
      });

      // Log login activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          description: `Staff member ${user.username} logged in from ${deviceInfo.deviceString}`,
          entityType: "User",
          entityId: user.id,
          ipAddress: deviceInfo.ipAddress,
          sessionId: session.id,
          deviceFingerprint: deviceInfo.deviceFingerprint,
          readableFingerprint: deviceInfo.readableFingerprint,
          deviceType: deviceInfo.deviceType,
          browserName: deviceInfo.browserName,
          browserVersion: deviceInfo.browserVersion,
          osType: deviceInfo.osType,
          timestamp: new Date(),
        },
      });

      // ✅ Track successful login attempt
      await trackLoginAttempt({
        ipAddress: clientIp,
        username,
        success: true,
        userAgent,
        metadata: {
          userId: user.id,
          staffId: user.staff.id,
          deviceFingerprint: deviceInfo.deviceFingerprint,
        },
      });

      const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
        role: user.role, // System role
        isActive: user.isActive,
        staffId: user.staff.id,
        firstName: user.staff.firstName,
        lastName: user.staff.lastName,
        fullName: user.staff.fullName,
        staffRole: user.staff.role, // Hospital role
        specialization: user.staff.specialization || undefined,
        email: user.staff.email || undefined,
        phoneNumber: user.staff.phoneNumber || undefined,
      };

      return {
        user: sessionUser,
        sessionToken,
      };
    });

    const response = NextResponse.json<LoginResponse>(
      {
        success: true,
        message: "Login successful",
        user: result.user,
      },
      { status: 200 }
    );

    // Set httpOnly session cookie
    const cookieExpiry = new Date();
    cookieExpiry.setSeconds(cookieExpiry.getSeconds() + EXPIRATION_TIME);

    response.cookies.set({
      name: "session",
      value: result.sessionToken,
      httpOnly: COOKIE_HTTP_ONLY,
      secure: COOKIE_SECURE,
      expires: cookieExpiry,
      sameSite: COOKIE_SAME_SITE,
      path: "/",
    });

    // ✅ Ensure CSRF token is present in response
    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("Login error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      ip: clientIp,
      username: attemptedUsername,
    });

    // ✅ Track failed login in catch block (for unexpected errors)
    if (attemptedUsername && clientIp !== "Unknown") {
      try {
        await trackLoginAttempt({
          ipAddress: clientIp,
          username: attemptedUsername,
          success: false,
          userAgent,
          metadata: {
            errorType: "exception",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
        });
      } catch (trackError) {
        console.error("Failed to track login attempt:", trackError);
      }
    }

    const isAuthError =
      error instanceof Error &&
      (error.message.includes("Invalid") ||
        error.message.includes("deactivated") ||
        error.message.includes("inactive"));

    return NextResponse.json<LoginResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during login",
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
