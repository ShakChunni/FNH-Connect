import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY as string;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: "No session found" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Get session with user details from database
      const session = await tx.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
      });

      if (!session) {
        throw new Error("Session not found in database");
      }

      // Create logout activity log using session information
      const bdTime = new Date(new Date().getTime() + 6 * 60 * 60 * 1000); // Bangladesh time (UTC+6)

      // Construct device info string from session data
      const deviceString = `${session.deviceType || "Unknown"} (${
        session.osType || "Unknown OS"
      }) using ${session.browserName || "Unknown Browser"}`;

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "LOGOUT",
          sessionId: session.id,
          description: `User ${session.user.username} logged out from ${deviceString}`,
          // Copy these fields directly from session using updated field names
          readableFingerprint: session.readableFingerprint,
          deviceFingerprint: session.deviceFingerprint,
          ipAddress: session.ipAddress,
          deviceType: session.deviceType,
          browserName: session.browserName,
          browserVersion: session.browserVersion,
          osType: session.osType,
          timestamp: bdTime,
          entityType: "User",
          entityId: session.userId,
        },
      });

      // Delete the session
      await tx.session.delete({
        where: { token: sessionToken },
      });
    });

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear the session cookie
    response.cookies.set({
      name: "session",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error during logout",
      },
      { status: 500 }
    );
  }
}
