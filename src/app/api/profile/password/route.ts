/**
 * Profile Password API
 * PATCH: Change the authenticated user's own password
 */

import { NextRequest, NextResponse } from "next/server";
import {
  addCSRFTokenToResponse,
  validateCSRFToken,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { validatePassword } from "@/lib/passwordPolicy";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
});

interface PasswordChangeSuccessResponse {
  success: true;
  message: string;
}

interface PasswordChangeErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}

type PasswordChangeResponse =
  | PasswordChangeSuccessResponse
  | PasswordChangeErrorResponse;

export async function PATCH(
  request: NextRequest,
) {
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

    const rawBody: unknown = await request.json();
    const validation = passwordChangeSchema.safeParse(rawBody);

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

    const { currentPassword, newPassword, confirmPassword } = validation.data;

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "New password and confirmation do not match" },
        { status: 400 },
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be different from your current password",
        },
        { status: 400 },
      );
    }

    const policyCheck = validatePassword(newPassword);
    if (!policyCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Password does not meet security requirements",
          details: { newPassword: policyCheck.errors },
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: authUser.id },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await tx.user.update({
        where: { id: authUser.id },
        data: { password: hashedPassword },
      });

      const otherSessions = await tx.session.findMany({
        where: {
          userId: authUser.id,
          id: { not: authUser.sessionId },
        },
        select: { id: true },
      });

      if (otherSessions.length > 0) {
        const otherSessionIds = otherSessions.map((session) => session.id);

        await tx.activityLog.updateMany({
          where: { sessionId: { in: otherSessionIds } },
          data: { sessionId: null },
        });

        await tx.session.deleteMany({
          where: { id: { in: otherSessionIds } },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: authUser.id,
          action: "PROFILE_PASSWORD_CHANGED",
          description: "Changed own password",
          entityType: "User",
          entityId: authUser.id,
          sessionId: authUser.sessionId,
          ipAddress: authUser.sessionDeviceInfo.ipAddress,
          deviceFingerprint: authUser.sessionDeviceInfo.deviceFingerprint,
          readableFingerprint: authUser.sessionDeviceInfo.readableFingerprint,
          deviceType: authUser.sessionDeviceInfo.deviceType,
          browserName: authUser.sessionDeviceInfo.browserName,
          browserVersion: authUser.sessionDeviceInfo.browserVersion,
          osType: authUser.sessionDeviceInfo.osType,
        },
      });
    });

    const response = NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/profile/password error:", error);

    if (error instanceof Error) {
      if (error.message === "Current password is incorrect") {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      if (error.message === "User not found") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to update password. Please try again." },
      { status: 500 },
    );
  }
}
