import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { verifySessionToken, isSessionExpired, sessionAbsoluteExpiry, requireSessionSecret, sessionCookieOptions } from "@/lib/sessionSecurity";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateCSRFToken } from "@/lib/csrfProtection";
import { shiftService } from "@/services/shiftService";
import { infertilityShiftService } from "@/services/infertilityShiftService";
import {
  closeActiveStaffCashShiftsIfNoUnexpiredSession,
} from "@/services/staffShiftClosureService";
import { canAccessPortal } from "@/lib/roles";
import type { LoginResponse, PortalType, SessionUser } from "@/types/auth";

class PortalSwitchConflict extends Error {}

const switchPortalSchema = z.object({
  portal: z.enum(["general", "infertility"]),
});

function userNeedsCashShift(role: string, staffRole: string): boolean {
  const normalizedRole = role.toLowerCase();
  const normalizedStaffRole = staffRole.toLowerCase();

  return (
    normalizedRole === "system-admin" ||
    normalizedRole === "operator" ||
    normalizedRole === "receptionist" ||
    normalizedRole === "staff" ||
    normalizedStaffRole === "system-admin" ||
    normalizedStaffRole === "operator" ||
    normalizedStaffRole === "receptionist"
  );
}

function buildSessionUser(
  user: {
    id: number;
    username: string;
    role: string;
    isActive: boolean;
    staffId: number;
    staff: {
      firstName: string;
      lastName: string;
      fullName: string;
      role: string;
      specialization: string | null;
      email: string | null;
      phoneNumber: string | null;
      photoUrl: string | null;
    };
  },
  portal: PortalType,
): SessionUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    staffId: user.staffId,
    firstName: user.staff.firstName,
    lastName: user.staff.lastName,
    fullName: user.staff.fullName,
    staffRole: user.staff.role,
    portal,
    specialization: user.staff.specialization || undefined,
    email: user.staff.email || undefined,
    phoneNumber: user.staff.phoneNumber || undefined,
    photoUrl: user.staff.photoUrl || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const body = switchPortalSchema.parse(await request.json());
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "No active session" },
        { status: 401 },
      );
    }

    let payload;
    try { payload = verifySessionToken(sessionToken); }
    catch {
      return NextResponse.json<LoginResponse>({ success: false, error: "Invalid session" }, { status: 401 });
    }

    const currentSession = await prisma.session.findUnique({
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
      !currentSession ||
      !currentSession.user ||
      !currentSession.user.staff ||
      !currentSession.user.isActive ||
      !currentSession.user.staff.isActive
    ) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "Invalid session" },
        { status: 401 },
      );
    }

    if (!canAccessPortal(currentSession.user.role, body.portal)) {
      return NextResponse.json<LoginResponse>(
        {
          success: false,
          error:
            body.portal === "infertility"
              ? "You are not authorized to access the HSI Center Portal."
              : "You are not authorized to access the Hospital Portal.",
        },
        { status: 403 },
      );
    }

    if (isSessionExpired(currentSession, payload)) {
      await prisma.$transaction(async (tx) => {
        const expiredAt = new Date();
        await closeActiveStaffCashShiftsIfNoUnexpiredSession({
          tx,
          staffId: currentSession.user.staff.id,
          endedAt: expiredAt,
          generalNotes: "Shift auto-closed on session expiry",
          infertilityNotes: "HSI Center shift auto-closed on session expiry",
          excludedSessionId: currentSession.id,
        });
        await tx.activityLog.updateMany({
          where: { sessionId: currentSession.id },
          data: { sessionId: null },
        });
        await tx.session.delete({ where: { id: currentSession.id } });
      });

      return NextResponse.json<LoginResponse>(
        { success: false, error: "Session expired" },
        { status: 401 },
      );
    }

    if (currentSession.portal === body.portal) {
      return NextResponse.json<LoginResponse>({
        success: true,
        message: "Portal already active",
        user: buildSessionUser(currentSession.user, body.portal),
      });
    }

    const newSessionToken = jwt.sign(
      {
        userId: currentSession.user.id,
        username: currentSession.user.username,
        staffId: currentSession.user.staff.id,
        fullName: currentSession.user.staff.fullName,
        role: currentSession.user.role,
        portal: body.portal,
        exp: Math.floor(sessionAbsoluteExpiry(currentSession, payload) / 1000),
      },
      requireSessionSecret(),
      { algorithm: "HS256", jwtid: randomUUID() },
    );

    const updatedSession = await prisma.$transaction(async (tx) => {
      // Only one switch may replace this token. A delayed competing response
      // must never install an already-revoked token in the browser.
      const changed = await tx.session.updateMany({
        where: { id: currentSession.id, token: sessionToken },
        data: { token: newSessionToken, portal: body.portal },
      });
      if (changed.count !== 1) throw new PortalSwitchConflict();
      const updated = await tx.session.findUniqueOrThrow({
        where: { id: currentSession.id },
        include: {
          user: {
            include: {
              staff: true,
            },
          },
        },
      });

      if (userNeedsCashShift(updated.user.role, updated.user.staff.role)) {
        if (body.portal === "infertility") {
          await infertilityShiftService.ensureActiveShift(updated.user.staff.id, tx);
        } else {
          await shiftService.ensureActiveShift(updated.user.staff.id, tx);
        }
      }

      await tx.activityLog.create({
        data: {
          userId: updated.user.id,
          action: "PORTAL_SWITCH",
          description: `Staff member ${updated.user.username} switched portal from ${currentSession.portal} to ${body.portal}`,
          entityType: "Session",
          entityId: null,
          ipAddress: updated.ipAddress,
          sessionId: updated.id,
          deviceFingerprint: updated.deviceFingerprint,
          readableFingerprint: updated.readableFingerprint,
          deviceType: updated.deviceType,
          browserName: updated.browserName,
          browserVersion: updated.browserVersion,
          osType: updated.osType,
          timestamp: new Date(),
        },
      });

      return updated;
    });

    const user = buildSessionUser(updatedSession.user, body.portal);
    const response = NextResponse.json<LoginResponse>(
      {
        success: true,
        message: "Portal switched successfully",
        user,
      },
      { status: 200 },
    );

    response.cookies.set({
      name: "session",
      value: newSessionToken,
      ...sessionCookieOptions(),
      expires: new Date(verifySessionToken(newSessionToken).exp! * 1000),
    });

    response.cookies.set({
      name: "portal",
      value: body.portal,
      httpOnly: false,
      secure: sessionCookieOptions().secure,
      expires: new Date(verifySessionToken(newSessionToken).exp! * 1000),
      sameSite: sessionCookieOptions().sameSite,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Switch portal error:", error);

    if (error instanceof PortalSwitchConflict) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "Session changed. Please try again." }, { status: 409 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json<LoginResponse>(
        { success: false, error: "Invalid portal selection" },
        { status: 400 },
      );
    }

    return NextResponse.json<LoginResponse>(
      {
        success: false,
        error: "Failed to switch portal",
      },
      { status: 500 },
    );
  }
}
