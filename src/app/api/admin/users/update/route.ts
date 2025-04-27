import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { UAParser } from "ua-parser-js";

export async function POST(request: NextRequest) {
  const { id, username, role, password, manages, organizations, actor } =
    await request.json();

  if (!id || !username || !role || !actor) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const updateData: {
      username: string;
      role: string;
      password?: string;
      manages?: string[];
      organizations?: string[];
    } = {
      username,
      role,
      manages: manages || [],
      organizations: organizations || [],
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: Number(id) },
        data: updateData,
      });

      // Delete all sessions associated with the user
      await tx.session.deleteMany({
        where: { userId: Number(id) },
      });

      // Get client IP address
      let clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "Unknown";
      // Handle loopback address
      if (clientIp === "::1" || clientIp === "127.0.0.1") {
        clientIp = "localhost";
      }

      // Get user-agent and parse device type
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const parser = new UAParser(userAgent);
      const userAgentResult = parser.getResult();
      const deviceType = userAgentResult.os.name || "Unknown";
      const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

      // Log the update activity with IP address and device type
      await tx.activityLog.create({
        data: {
          username: actor,
          action: "UPDATE",
          description: `Updated user with ID ${id}`,
          ip_address: clientIp,
          device_type: deviceType,
          timestamp: klTime,
        },
      });

      return updatedUser;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
