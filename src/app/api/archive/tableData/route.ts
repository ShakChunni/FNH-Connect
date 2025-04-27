import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";
import { sendInactiveNotification } from "@/lib/emailService"; // Adjust the import path as needed

export async function POST(req: NextRequest) {
  const { id, sourceTable, pic, inactiveReason, username } = await req.json();

  try {
    // Get current time in Kuala Lumpur
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 8);

    const updatedRecord = await prisma.$transaction(async (tx) => {
      let record;
      if (sourceTable === "MAVN") {
        record = await tx.mavn_monthly_report.update({
          where: { id },
          data: {
            isInactive: true,
            inactiveReason: inactiveReason,
            updatedAt: currentDate,
            updatedBy: username,
          },
        });
      } else if (sourceTable === "MI") {
        record = await tx.mi_monthly_report.update({
          where: { id },
          data: {
            isInactive: true,
            inactiveReason: inactiveReason,
            updatedAt: currentDate,
            updatedBy: username,
          },
        });
      }

      if (!record) {
        throw new Error("Record not found");
      }

      // Get client IP address
      let clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "Unknown";

      // Handle loopback address
      if (clientIp === "::1" || clientIp === "127.0.0.1") {
        clientIp = "localhost";
      }

      // Extract the first IP address if there are multiple
      if (clientIp.includes(",")) {
        clientIp = clientIp.split(",")[0].trim();
      }

      // Get user-agent and parse device type
      const userAgent = req.headers.get("user-agent") || "Unknown";
      const parser = new UAParser(userAgent);
      const userAgentResult = parser.getResult();
      const deviceType = userAgentResult.os.name || "Unknown";
      const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

      // Log the inactivation activity with IP address and device type
      const log = await tx.activityLog.create({
        data: {
          username: username,
          action: "INACTIVE",
          source_table: sourceTable,
          source_id: id,
          description: `Marked record ${id} as inactive in ${sourceTable.toUpperCase()}. Reason: ${
            inactiveReason.charAt(0).toUpperCase() + inactiveReason.slice(1)
          }`,
          ip_address: clientIp,
          device_type: deviceType,
          timestamp: klTime,
        },
      });

      // Send email notification
      await sendInactiveNotification(log, record, inactiveReason);

      return record;
    });

    return NextResponse.json({
      message: "Data marked as inactive successfully",
    });
  } catch (error) {
    console.error("Error marking data as inactive:", error);
    return NextResponse.json(
      {
        error: "Error marking data as inactive",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
