import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UAParser } from "ua-parser-js";

export async function POST(req: NextRequest) {
  const { id, sourceTable, username } = await req.json();

  try {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 8);

    let updatedRecord;
    if (sourceTable === "MAVN") {
      updatedRecord = await prisma.mavn_monthly_report.update({
        where: { id },
        data: {
          isInactive: false,
          inactiveReason: null,
          updatedAt: currentDate,
          updatedBy: username,
        },
      });
    } else if (sourceTable === "MI") {
      updatedRecord = await prisma.mi_monthly_report.update({
        where: { id },
        data: {
          isInactive: false,
          inactiveReason: null,
          updatedAt: currentDate,
          updatedBy: username,
        },
      });
    } else {
      return NextResponse.json(
        { message: "Invalid sourceTable" },
        { status: 400 }
      );
    }

    if (!updatedRecord) {
      return NextResponse.json(
        { message: "Record not found" },
        { status: 404 }
      );
    }

    let clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "Unknown";

    if (clientIp === "::1" || clientIp === "127.0.0.1") {
      clientIp = "localhost";
    }

    const userAgent = req.headers.get("user-agent") || "Unknown";
    const parser = new UAParser(userAgent);
    const userAgentResult = parser.getResult();
    const deviceType = userAgentResult.os.name || "Unknown";
    const klTime = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

    await prisma.activityLog.create({
      data: {
        username: username,
        action: "ACTIVE",
        source_table: sourceTable,
        source_id: id,
        description: `Marked record ${id} as active in ${sourceTable.toUpperCase()}.`,
        ip_address: clientIp,
        device_type: deviceType,
        timestamp: klTime,
      },
    });

    return NextResponse.json({
      message: "Data marked as active successfully",
    });
  } catch (error) {
    console.error("Error marking data as active:", error);
    return NextResponse.json(
      { error: "Error marking data as active" },
      { status: 500 }
    );
  }
}
