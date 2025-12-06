import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { validateCSRFToken } from "@/lib/csrfProtection";
import type { LogoutResponse } from "@/types/auth";

const COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE
  ? process.env.SESSION_COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production";

const COOKIE_HTTP_ONLY = process.env.SESSION_COOKIE_HTTP_ONLY
  ? process.env.SESSION_COOKIE_HTTP_ONLY === "true"
  : true;

const COOKIE_SAME_SITE = (process.env.SESSION_COOKIE_SAME_SITE ||
  "strict") as "strict";

export async function POST(request: NextRequest) {
  try {
    // ✅ CSRF Validation for state-changing request
    const csrfValid = validateCSRFToken(request);
    if (!csrfValid) {
      return NextResponse.json<LogoutResponse>(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json<LogoutResponse>(
        { success: false, error: "No active session" },
        { status: 401 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Find and delete session
      const session = await tx.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Format device info for logging
      const deviceString = `${session.deviceType || "Unknown"} (${
        session.osType || "Unknown OS"
      }) using ${session.browserName || "Unknown Browser"}`;

      // Log logout activity
      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: "LOGOUT",
          description: `Staff member ${session.user.username} logged out from ${deviceString}`,
          entityType: "User",
          entityId: session.userId,
          ipAddress: session.ipAddress,
          sessionId: session.id,
          deviceFingerprint: session.deviceFingerprint,
          readableFingerprint: session.readableFingerprint,
          deviceType: session.deviceType,
          browserName: session.browserName,
          browserVersion: session.browserVersion,
          osType: session.osType,
          timestamp: new Date(),
        },
      });

      // Delete the session
      await tx.session.delete({
        where: { token: sessionToken },
      });
    });

    const response = NextResponse.json<LogoutResponse>(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    // Clear the session cookie
    response.cookies.set({
      name: "session",
      value: "",
      expires: new Date(0),
      path: "/",
      httpOnly: COOKIE_HTTP_ONLY,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json<LogoutResponse>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during logout",
      },
      { status: 500 }
    );
  }
}
