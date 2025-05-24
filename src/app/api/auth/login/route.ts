import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import DeviceDetector from "node-device-detector";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const SECRET_KEY = process.env.SECRET_KEY as string;
const EXPIRATION_TIME = 60 * 60 * 24; // 1 day in seconds

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables");
}

interface LoginRequest {
  username: string;
  password: string;
}

interface UserResponse {
  id: number;
  username: string;
  staffId: number;
  fullName: string;
  role: string;
}

interface DeviceInfo {
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

function getDeviceInfo(
  userAgent: string,
  clientIp: string,
  userId?: number
): DeviceInfo {
  const detector = new DeviceDetector({
    clientIndexes: true,
    deviceIndexes: true,
    deviceAliasCode: false,
    deviceTrusted: true,
    maxUserAgentSize: 500,
  });

  const result = detector.detect(userAgent);

  // Get OS info
  const osName = result.os?.name || "Unknown";
  let osVersion = result.os?.version || "Unknown";

  // Get device info with fallbacks
  let deviceVendor = result.device?.brand || null;
  let deviceModel = result.device?.model || null;
  let deviceType = result.device?.type || null;

  // Capitalize device type
  if (deviceType && typeof deviceType === "string") {
    deviceType =
      deviceType.charAt(0).toUpperCase() + deviceType.slice(1).toLowerCase();
  }

  // Set desktop type for desktop operating systems
  if (
    !deviceType &&
    ((osName && ["Windows", "Mac OS", "Linux"].includes(osName)) ||
      result.os?.platform === "x64" ||
      result.os?.platform === "x86")
  ) {
    deviceType = "Desktop";
  }

  // Generate device fingerprint
  const deviceFingerprint = generateDeviceFingerprint(
    clientIp,
    userAgent,
    result.device,
    result.os,
    result.client,
    userId
  );

  // Create readable fingerprint (e.g., AB:CD:EF:12:34:56)
  const readableFingerprint = deviceFingerprint
    .substring(0, 12)
    .replace(/(.{2})/g, "$1:")
    .slice(0, -1)
    .toUpperCase();

  // Format device display string
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
  try {
    const { username, password } = (await request.json()) as LoginRequest;

    // Wrap all database operations in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find user and include staff data
      const user = await tx.user.findUnique({
        where: { username },
        include: {
          staff: true,
          sessions: true,
        },
      });

      if (!user) {
        throw new Error("Invalid username");
      }

      if (!user.isActive) {
        throw new Error(
          "Account has been deactivated. Please contact your administrator."
        );
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error("Invalid password");
      }

      // Generate JWT token with staffId and fullName from staff
      const sessionToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          staffId: user.staffId,
          fullName: user.staff.fullName,
          role: user.role,
        },
        SECRET_KEY,
        { expiresIn: EXPIRATION_TIME }
      );

      // Create expiration date in Bangladesh time (UTC+6)
      const expiresAt = new Date();
      const createdAt = new Date();
      const updatedAt = new Date();

      // Add 6 hours for Bangladesh time
      expiresAt.setHours(expiresAt.getHours() + 6);
      createdAt.setHours(createdAt.getHours() + 6);
      updatedAt.setHours(updatedAt.getHours() + 6);

      // Add expiration time
      expiresAt.setSeconds(expiresAt.getSeconds() + EXPIRATION_TIME);

      // Process client IP address
      let clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "Unknown";

      if (clientIp.includes(",")) {
        clientIp = clientIp.split(",")[0].trim();
      }

      if (clientIp === "::1" || clientIp === "127.0.0.1") {
        clientIp = "localhost";
      }

      // Get detailed device information with device fingerprinting
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const deviceInfo = getDeviceInfo(userAgent, clientIp, user.id);

      // Check if there's an existing session with the same device fingerprint
      const existingSession = await tx.session.findFirst({
        where: {
          userId: user.id,
          deviceFingerprint: deviceInfo.deviceFingerprint,
        },
      });

      // If there's an existing session, you might want to invalidate it
      if (existingSession) {
        await tx.session.delete({
          where: { id: existingSession.id },
        });
      }

      // Create server-side session with Bangladesh times and device info
      const session = await tx.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt,
          createdAt,
          updatedAt,
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

      // Bangladesh time (UTC+6)
      const bdTime = new Date(new Date().getTime() + 6 * 60 * 60 * 1000);

      // Log the login activity with enhanced device information
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          description: `User ${user.username} logged in from ${deviceInfo.deviceString}`,
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
          timestamp: bdTime,
        },
      });

      // Create user response object
      const userResponse: UserResponse = {
        id: user.id,
        username: user.username,
        staffId: user.staffId,
        fullName: user.staff.fullName,
        role: user.role,
      };

      return { userResponse, sessionToken };
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: result.userResponse,
      },
      { status: 200 }
    );

    const cookieExpiry = new Date();
    cookieExpiry.setHours(cookieExpiry.getHours() + 6); // Set to Bangladesh time
    cookieExpiry.setSeconds(cookieExpiry.getSeconds() + EXPIRATION_TIME);

    response.cookies.set({
      name: "session",
      value: result.sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: cookieExpiry,
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message.includes("Invalid")
            ? 401
            : 500,
      }
    );
  }
}
