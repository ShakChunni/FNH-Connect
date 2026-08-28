/**
 * User Management API - Archive/Unarchive Staff
 * PATCH: Toggle Staff.isActive for standalone staff records
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { isSystemAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { closeActiveStaffCashShifts } from "@/services/staffShiftClosureService";

const archiveStaffSchema = z.object({
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

    if (!isSystemAdminRole(authUser.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: System admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const staffId = parseInt(id, 10);

    if (isNaN(staffId)) {
      return NextResponse.json(
        { success: false, error: "Invalid staff ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const validation = archiveStaffSchema.safeParse(body);

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
      const existingStaff = await tx.staff.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          fullName: true,
          isActive: true,
          user: { select: { id: true } },
        },
      });

      if (!existingStaff) {
        throw new Error("Staff member not found");
      }

      if (existingStaff.user) {
        throw new Error(
          "Staff member has a linked user account. Please manage their archive status in the Users tab.",
        );
      }

      const updatedStaff = await tx.staff.update({
        where: { id: staffId },
        data: { isActive },
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
          createdAt: true,
        },
      });

      // If deactivating, close any open cash shifts for this staff member
      if (!isActive) {
        await closeActiveStaffCashShifts({
          tx,
          staffId,
          endedAt: new Date(),
          generalNotes: "Shift auto-closed on staff archive",
          infertilityNotes: "HSI Center shift auto-closed on staff archive",
        });
      }

      // Log activity
      const action = isActive ? "STAFF_UNARCHIVED" : "STAFF_ARCHIVED";
      const actionDesc = isActive ? "Unarchived" : "Archived";

      await tx.activityLog.create({
        data: {
          userId: authUser.id,
          action,
          description: `${actionDesc} standalone staff member "${updatedStaff.fullName}"`,
          entityType: "Staff",
          entityId: staffId,
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

      return {
        ...updatedStaff,
        hasUser: false,
      };
    });

    const statusText = isActive ? "unarchived" : "archived";

    const response = NextResponse.json({
      success: true,
      data: result,
      message: `Staff member ${statusText} successfully`,
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error(
      "PATCH /api/admin/user-management/staff/[id]/archive error:",
      error,
    );

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("linked user account")
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update staff status",
      },
      { status: 500 },
    );
  }
}
