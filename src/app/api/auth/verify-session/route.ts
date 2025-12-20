import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { VerifySessionResponse } from "@/types/auth";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      // Clear any stale session cookie that might exist
      const response = NextResponse.json<VerifySessionResponse>(
        { success: false, valid: false, error: "No active session" },
        { status: 401 }
      );
      response.cookies.delete("session");
      return response;
    }

    // Verify manually to get session object for expiry check
    // We can't use getAuthenticatedUserForAPI because we need the session timestamp
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: {
            staff: true,
          },
        },
      },
    });

    if (
      !session ||
      !session.user ||
      !session.user.staff ||
      !session.user.isActive ||
      !session.user.staff.isActive
    ) {
      // Delete the session cookie server-side since client can't delete httpOnly cookies
      const response = NextResponse.json<VerifySessionResponse>(
        { success: false, valid: false, error: "Invalid session" },
        { status: 401 }
      );
      response.cookies.delete("session");
      return response;
    }

    // Check expiry
    const now = new Date();
    if (session.expiresAt < now) {
      // Clean up expired session from database
      await prisma.session.delete({ where: { id: session.id } });
      // Delete the session cookie server-side since client can't delete httpOnly cookies
      const response = NextResponse.json<VerifySessionResponse>(
        { success: false, valid: false, error: "Session expired" },
        { status: 401 }
      );
      response.cookies.delete("session");
      return response;
    }

    const response = NextResponse.json<VerifySessionResponse>(
      {
        success: true,
        valid: true,
        user: {
          id: session.user.id,
          username: session.user.username,
          role: session.user.role,
          isActive: session.user.isActive,
          staffId: session.user.staffId,
          firstName: session.user.staff.firstName,
          lastName: session.user.staff.lastName,
          fullName: session.user.staff.fullName,
          staffRole: session.user.staff.role,
          specialization: session.user.staff.specialization || undefined,
          email: session.user.staff.email || undefined,
          phoneNumber: session.user.staff.phoneNumber || undefined,
          photoUrl: session.user.staff.photoUrl || undefined,
        },
      },
      { status: 200 }
    );

    // Auto-refresh logic: Extend if less than 2 hours remaining
    const timeRemaining = session.expiresAt.getTime() - now.getTime();
    const TWO_HOURS = 2 * 60 * 60 * 1000;

    if (timeRemaining < TWO_HOURS) {
      // Get configuration from env
      const SESSION_EXPIRATION_HOURS = parseInt(
        process.env.SESSION_EXPIRATION_HOURS || "24",
        10
      );
      const EXPIRATION_TIME = 60 * 60 * SESSION_EXPIRATION_HOURS; // in seconds

      const COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE
        ? process.env.SESSION_COOKIE_SECURE === "true"
        : process.env.NODE_ENV === "production";

      const COOKIE_HTTP_ONLY = process.env.SESSION_COOKIE_HTTP_ONLY
        ? process.env.SESSION_COOKIE_HTTP_ONLY === "true"
        : true;

      const COOKIE_SAME_SITE = (process.env.SESSION_COOKIE_SAME_SITE ||
        "strict") as "strict";

      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + EXPIRATION_TIME);

      // Update DB
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: newExpiresAt },
      });

      // Update Cookie
      response.cookies.set({
        name: "session",
        value: sessionToken,
        httpOnly: COOKIE_HTTP_ONLY,
        secure: COOKIE_SECURE,
        expires: newExpiresAt,
        sameSite: COOKIE_SAME_SITE,
        path: "/",
      });

      console.log(`Session refreshed for user ${session.user.username}`);
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Session verification failed";

    console.error("Session verification error:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Delete the session cookie on any error
    const response = NextResponse.json<VerifySessionResponse>(
      {
        success: false,
        valid: false,
        error: message,
      },
      { status: 401 }
    );
    response.cookies.delete("session");
    return response;
  }
}
