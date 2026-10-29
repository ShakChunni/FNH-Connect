import { verifySessionToken, isSessionExpired, sessionAbsoluteExpiry, sessionIdleMilliseconds } from "@/lib/sessionSecurity";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { VerifySessionResponse } from "@/types/auth";
import {
  normalizePortal,
} from "@/lib/sessionPortal";
import {
  closeActiveStaffCashShiftsIfNoUnexpiredSession,
} from "@/services/staffShiftClosureService";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      const response = NextResponse.json<VerifySessionResponse>(
        { success: false, valid: false, error: "No active session" },
        { status: 401 }
      );
      return response;
    }

    let payload;
    try {
      payload = verifySessionToken(sessionToken);
    } catch {
      return NextResponse.json<VerifySessionResponse>(
        { success: false, valid: false, error: "Invalid session" }, { status: 401 },
      );
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
      const response = NextResponse.json<VerifySessionResponse>(
        { success: false, valid: false, error: "Invalid session" },
        { status: 401 }
      );
      return response;
    }

    // Check expiry
    const now = new Date();
    if (isSessionExpired(session, payload, now.getTime())) {
      // Session expiry is also a cash-session boundary. Close both portals
      // atomically before removing the expired session.
      await prisma.$transaction(async (tx) => {
        await closeActiveStaffCashShiftsIfNoUnexpiredSession({
          tx,
          staffId: session.user.staff.id,
          endedAt: now,
          generalNotes: "Shift auto-closed on session expiry",
          infertilityNotes: "HSI Center shift auto-closed on session expiry",
          excludedSessionId: session.id,
        });
        await tx.activityLog.updateMany({
          where: { sessionId: session.id },
          data: { sessionId: null },
        });
        await tx.session.delete({ where: { id: session.id } });
      });
      const response = NextResponse.json<VerifySessionResponse>(
        { success: false, valid: false, error: "Session expired" },
        { status: 401 }
      );
      return response;
    }

    const portal = normalizePortal(session.portal);

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
          portal,
          specialization: session.user.staff.specialization || undefined,
          email: session.user.staff.email || undefined,
          phoneNumber: session.user.staff.phoneNumber || undefined,
          photoUrl: session.user.staff.photoUrl || undefined,
        },
      },
      { status: 200 }
    );

    // Refresh only the idle deadline; the signed absolute expiry never changes.
    // No Set-Cookie here: a delayed refresh response must not overwrite a portal switch.
    // The browser cookie already expires at the signed absolute deadline.
    const newExpiresAt = new Date(Math.min(
      now.getTime() + sessionIdleMilliseconds(), sessionAbsoluteExpiry(session, payload),
    ));
    if (session.expiresAt.getTime() - now.getTime() < Math.min(2 * 3_600_000, sessionIdleMilliseconds() / 2)
        && newExpiresAt.getTime() > session.expiresAt.getTime()) {
      // Conditional update cannot resurrect a concurrently revoked session.
      await prisma.session.updateMany({
        where: { id: session.id, token: sessionToken, expiresAt: { gt: now, lt: newExpiresAt } },
        data: { expiresAt: newExpiresAt },
      });
    }
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Session verification failed";

    console.error("Session verification error:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Transient server errors must not clear a valid browser session.
    const response = NextResponse.json<VerifySessionResponse>(
      {
        success: false,
        valid: false,
        error: "Session verification failed",
      },
      { status: 500 }
    );
    return response;
  }
}
