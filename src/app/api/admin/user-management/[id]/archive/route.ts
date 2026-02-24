/**
 * User Management API - Archive/Unarchive
 * PATCH: Toggle User.isActive (Staff stays active)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const archiveSchema = z.object({
  isActive: z.boolean(),
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

    // Prevent self-archiving
    if (userId === authUser.id) {
      return NextResponse.json(
        { success: false, error: "You cannot archive your own account" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = archiveSchema.safeParse(body);

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

    const { isActive } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      // Verify user exists
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, isActive: true, staffId: true },
      });

      if (!existingUser) {
        throw new Error("User not found");
      }

      // Update User.isActive only (Staff stays active)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isActive },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              role: true,
              specialization: true,
              phoneNumber: true,
              email: true,
              isActive: true,
            },
          },
        },
      });

      // If archiving (deactivating), invalidate all sessions for this user
      if (!isActive) {
        const userSessions = await tx.session.findMany({
          where: { userId },
          select: { id: true },
        });

        if (userSessions.length > 0) {
          const sessionIds = userSessions.map((s) => s.id);

          await tx.activityLog.updateMany({
            where: { sessionId: { in: sessionIds } },
            data: { sessionId: null },
          });

          await tx.session.deleteMany({
            where: { id: { in: sessionIds } },
          });
        }
      }

      // Log activity
      const action = isActive ? "USER_UNARCHIVED" : "USER_ARCHIVED";
      const actionDesc = isActive ? "Unarchived" : "Archived";

      await tx.activityLog.create({
        data: {
          userId: authUser.id,
          action,
          description: `${actionDesc} user account "${existingUser.username}" (${updatedUser.staff.fullName})`,
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

      return updatedUser;
    });

    const statusText = isActive ? "unarchived" : "archived";

    const response = NextResponse.json({
      success: true,
      data: result,
      message: `User ${statusText} successfully`,
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error(
      "PATCH /api/admin/user-management/[id]/archive error:",
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
        error: "Failed to update user status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
