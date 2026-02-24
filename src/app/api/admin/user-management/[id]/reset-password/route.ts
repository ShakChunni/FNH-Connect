/**
 * User Management API - Reset Password
 * PATCH: Reset user password and invalidate all sessions
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const authUser = await getAuthenticatedUserForAPI();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!isAdminRole(authUser.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { newPassword } = validation.data;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      // Verify user exists
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          staff: { select: { fullName: true } },
        },
      });

      if (!existingUser) {
        throw new Error("User not found");
      }

      // Update password
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Invalidate all existing sessions — forces re-login with new password
      const userSessions = await tx.session.findMany({
        where: { userId },
        select: { id: true },
      });

      if (userSessions.length > 0) {
        const sessionIds = userSessions.map((s) => s.id);

        // First, disconnect these sessions from any existing activity logs to prevent foreign key errors
        await tx.activityLog.updateMany({
          where: { sessionId: { in: sessionIds } },
          data: { sessionId: null },
        });

        // Now it's safe to delete the sessions
        await tx.session.deleteMany({
          where: { id: { in: sessionIds } },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: authUser.id,
          action: "USER_PASSWORD_RESET",
          description: `Reset password for user "${existingUser.username}" (${existingUser.staff.fullName})`,
          entityType: "User",
          entityId: userId,
          ipAddress: authUser.sessionDeviceInfo.ipAddress,
          sessionId: authUser.sessionId,
          deviceFingerprint: authUser.sessionDeviceInfo.deviceFingerprint,
          readableFingerprint: authUser.sessionDeviceInfo.readableFingerprint,
          deviceType: authUser.sessionDeviceInfo.deviceType,
          browserName: authUser.sessionDeviceInfo.browserName,
          browserVersion: authUser.sessionDeviceInfo.browserVersion,
          osType: authUser.sessionDeviceInfo.osType,
        },
      });
    });

    const response = NextResponse.json({
      success: true,
      message: "Password reset successfully. User will need to login again.",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error(
      "PATCH /api/admin/user-management/[id]/reset-password error:",
      error,
    );

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset password",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
