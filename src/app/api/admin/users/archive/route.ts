import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";

export async function POST(request: NextRequest) {
  const { id, archived, actor } = await request.json();

  if (id === undefined || actor === undefined) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: Number(id) },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const updatedUser = await tx.user.update({
        where: { id: Number(id) },
        data: { archived: archived },
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
      const userAgentResult = parser.getResult();
      const deviceType = userAgentResult.os.name || "Unknown";
      const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

      // Log the archive activity with IP address and device type
      await tx.activityLog.create({
        data: {
          username: actor,
          action: "ARCHIVE",
          description: `User ${user.username} archive status changed to ${archived}`,
          ip_address: clientIp,
          device_type: deviceType,
          timestamp: klTime,
        },
      });

      return updatedUser;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error updating user archive status:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
