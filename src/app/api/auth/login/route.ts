import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import DeviceDetector from "node-device-detector";
import { prisma } from "@/lib/prisma";

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
  fullName: string | null;
  role: string;
  manages: string[] | null;
  organizations: string[] | null;
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = (await request.json()) as LoginRequest;

    // Wrap all database operations in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { username },
        include: {
          sessions: true,
        },
      });

      if (!user) {
        throw new Error("Invalid username");
      }

      if (user.archived) {
        throw new Error(
          "Account has been deactivated. Please contact your administrator."
        );
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error("Invalid password");
      }

      // Generate JWT token
      const sessionToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          manages: user.manages,
          organizations: user.organizations,
        },
        SECRET_KEY,
        { expiresIn: EXPIRATION_TIME }
      );

      const expiresAt = new Date();
      const createdAt = new Date();
      const updatedAt = new Date();
      [expiresAt, createdAt, updatedAt].forEach((date) => {
        date.setHours(date.getHours() + 8);
      });

      expiresAt.setSeconds(expiresAt.getSeconds() + EXPIRATION_TIME);

      // Create server-side session with MYT times
      const session = await tx.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt,
          createdAt,
          updatedAt,
        },
      });

      // Get client IP address
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

      // Get detailed device information with node-device-detector
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const deviceInfo = getDeviceInfo(userAgent);

      // Format device display string
      let deviceTypeDisplay = "Unknown Device";

      if (deviceInfo.device.vendor || deviceInfo.device.model) {
        deviceTypeDisplay =
          [deviceInfo.device.vendor, deviceInfo.device.model]
            .filter(Boolean)
            .join(" ")
            .trim() || "Unknown Device";

        if (
          deviceInfo.device.type &&
          !deviceTypeDisplay
            .toLowerCase()
            .includes(deviceInfo.device.type.toLowerCase())
        ) {
          deviceTypeDisplay += ` (${deviceInfo.device.type})`;
        }
      } else if (deviceInfo.client.name) {
        deviceTypeDisplay = `${deviceInfo.client.name} ${
          deviceInfo.client.version || ""
        }`.trim();
      }

      const osInfo = deviceInfo.os.name
        ? `${deviceInfo.os.name} ${deviceInfo.os.version || ""}`.trim()
        : "Unknown OS";

      const deviceType = `${deviceTypeDisplay} on ${osInfo}`;
      const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

      // Log the login activity with enhanced device information
      await tx.activityLog.create({
        data: {
          userId: user.id,
          username: user.username,
          action: "LOGIN",
          description: `User ${user.username} logged in from IP ${clientIp} using ${deviceType}`,
          ip_address: clientIp,
          device_type: deviceType,
          // Add detailed device information
          browser_name: deviceInfo.client.name || null,
          browser_version: deviceInfo.client.version || null,
          os_name: deviceInfo.os.name || null,
          os_version: deviceInfo.os.version || null,
          device_vendor: deviceInfo.device.vendor || null,
          device_model: deviceInfo.device.model || null,
          device_type_spec: deviceInfo.device.type || null,
          timestamp: klTime,
        },
      });

      const userResponse: UserResponse = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        manages: user.manages,
        organizations: user.organizations,
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
    cookieExpiry.setHours(cookieExpiry.getHours() + 8); // Set to MYT
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

interface DeviceInfo {
  client: {
    name: string | null;
    version: string | null;
    type: string | null;
  };
  os: {
    name: string | null;
    version: string | null;
    platform: string | null;
  };
  device: {
    type: string | null;
    brand: string | null;
    model: string | null;
    vendor: string | null;
  };
  bot: boolean;
}

function getDeviceInfo(userAgent: string): DeviceInfo {
  const detector = new DeviceDetector({
    clientIndexes: true,
    deviceIndexes: true,
    deviceAliasCode: false,
    deviceTrusted: true,
    maxUserAgentSize: 500,
  });

  const result = detector.detect(userAgent);

  // Get OS info
  const osName = result.os?.name || null;
  let osVersion = result.os?.version || null;

  // Enhance macOS versions with marketing names
  if (osName === "Mac OS" && osVersion) {
    const macOSVersions: Record<string, string> = {
      "10.15": "Catalina",
      "11": "Big Sur",
      "12": "Monterey",
      "13": "Ventura",
      "14": "Sonoma",
      "15": "Sequoia",
    };

    const majorVersion = osVersion.split(".")[0];
    const minorVersion = osVersion.split(".")[1];
    const versionKey =
      majorVersion === "10" ? `${majorVersion}.${minorVersion}` : majorVersion;

    if (macOSVersions[versionKey]) {
      osVersion = `${osVersion} (${macOSVersions[versionKey]})`;
    }
  }

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

  // Handle frozen Android user agent (Chrome 110+ shows "Android 10; K")
  const isFrozenAndroidUA =
    osName === "Android" &&
    osVersion === "10" &&
    (deviceModel === "K" || !deviceModel);

  if (isFrozenAndroidUA) {
    // Try to get better device info from user agent
    const androidDeviceMatch = userAgent.match(/;\s*([^;)]+?)(?:\s+Build|\))/i);
    if (androidDeviceMatch && androidDeviceMatch[1]) {
      const deviceString = androidDeviceMatch[1].trim();
      if (deviceString && deviceString !== "K") {
        const knownVendors = [
          { name: "Samsung", patterns: ["SM-", "SAMSUNG"] },
          { name: "Xiaomi", patterns: ["MI ", "Redmi", "POCO"] },
          { name: "Google", patterns: ["Pixel"] },
          { name: "OnePlus", patterns: ["OnePlus"] },
          { name: "OPPO", patterns: ["OPPO", "CPH"] },
          { name: "Vivo", patterns: ["vivo"] },
          { name: "Huawei", patterns: ["HUAWEI"] },
          { name: "Motorola", patterns: ["moto", "Motorola"] },
          { name: "Nokia", patterns: ["Nokia"] },
          { name: "Sony", patterns: ["Sony", "Xperia"] },
        ];

        for (const vendor of knownVendors) {
          if (vendor.patterns.some((p) => deviceString.includes(p))) {
            deviceVendor = vendor.name;
            deviceModel = deviceString;
            break;
          }
        }

        if (!deviceVendor && deviceString !== "K") {
          deviceModel = deviceString;
        }
      }
    }
  }

  // Bot detection
  let isBot = false;
  const botResult = detector.parseBot(userAgent);
  if (botResult && Object.keys(botResult).length > 0) {
    isBot = true;
  } else if (result.client?.type === "bot") {
    isBot = true;
  }

  return {
    client: {
      name: result.client?.name || null,
      version: result.client?.version || null,
      type: result.client?.type || null,
    },
    os: {
      name: osName,
      version: osVersion,
      platform: result.os?.platform || null,
    },
    device: {
      type: deviceType,
      brand: deviceVendor,
      model: deviceModel,
      vendor: deviceVendor,
    },
    bot: isBot,
  };
}
