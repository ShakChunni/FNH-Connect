import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine staffId. The session user has staffId.
    const staffId = user.staffId;
    if (!staffId) {
      return NextResponse.json(
        { error: "No staff profile found" },
        { status: 400 }
      );
    }

    // Get the active shift to know system cash
    const activeShift = await prisma.shift.findFirst({
      where: {
        staffId: staffId,
        isActive: true,
      },
    });

    if (!activeShift) {
      return NextResponse.json({ message: "No active shift to end" });
    }

    // Check if body has data
    let body: { notes?: string; logoutAllDevices?: boolean } = {};
    try {
      body = await req.json();
    } catch (e) {
      // Empty body is fine
    }

    const { notes, logoutAllDevices = true } = body;

    // We default closing cash to system cash (perfect match)
    const closingCash = activeShift.systemCash.toNumber();

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Close the active shift
      await tx.shift.update({
        where: { id: activeShift.id },
        data: {
          isActive: false,
          endTime: new Date(),
          closingCash,
          variance: closingCash - activeShift.systemCash.toNumber(),
          notes: notes || "Shift ended via dashboard/logout",
        },
      });

      // 2. If logoutAllDevices is true, invalidate ALL sessions for this user
      if (logoutAllDevices) {
        // Get count of sessions being deleted for logging
        const sessionCount = await tx.session.count({
          where: { userId: user.id },
        });

        // Delete all sessions for this user
        await tx.session.deleteMany({
          where: { userId: user.id },
        });

        // Log the multi-device logout
        await tx.activityLog.create({
          data: {
            userId: user.id,
            action: "SHIFT_END_ALL_DEVICES",
            description: `Shift ended and ${sessionCount} session(s) invalidated across all devices`,
            entityType: "Shift",
            entityId: activeShift.id,
            ipAddress:
              req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
              req.headers.get("x-real-ip") ||
              "Unknown",
            timestamp: new Date(),
          },
        });
      }
    });

    // Create response and clear the session cookie
    const response = NextResponse.json({
      success: true,
      allDevicesLoggedOut: logoutAllDevices,
    });

    // Clear session cookie
    response.cookies.set({
      name: "session",
      value: "",
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("End shift error:", error);
    return NextResponse.json({ error: "Failed to end shift" }, { status: 500 });
  }
}
