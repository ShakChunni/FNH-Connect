import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UAParser } from "ua-parser-js";
import { getUserFromSession, requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const currentUser = await getUserFromSession(request);
    requireAdmin(currentUser);

    const { username, role, password, manages, organizations, actor } =
      await request.json();

    if (!username || !role || !password || !actor) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Create staff record first
      const staff = await tx.staff.create({
        data: {
          firstName: username, // Use username as firstName for now
          lastName: "",
          fullName: username,
          role: "Staff", // Default hospital role
          isActive: true,
        },
      });

      // Create user record
      const newUser = await tx.user.create({
        data: {
          username,
          role,
          password: hashedPassword,
          staffId: staff.id,
          isActive: true,
        },
      });

      // Get client IP address
      let clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "Unknown";

      // Extract the first IP address if there are multiple
      if (clientIp.includes(",")) {
        clientIp = clientIp.split(",")[0].trim();
      }
      // Handle loopback address
      if (clientIp === "::1" || clientIp === "127.0.0.1") {
        clientIp = "localhost";
      }

      // Get user-agent and parse device type
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      const deviceType = result.os.name || "Unknown";
      const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

      // Log the creation activity with IP address and device type
      await tx.activityLog.create({
        data: {
          userId: currentUser.userId,
          action: "CREATE",
          description: `Created new user ${username}`,
          entityType: "User",
          entityId: newUser.id,
          ipAddress: clientIp,
          deviceType: deviceType,
          browserName: result.browser.name || "Unknown",
          osType: result.os.name || "Unknown",
          timestamp: klTime,
        },
      });

      return newUser;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
