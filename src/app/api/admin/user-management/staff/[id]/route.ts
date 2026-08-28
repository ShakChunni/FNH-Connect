/**
 * User Management API - Single Staff
 * PATCH: Update standalone staff record (no linked User account)
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

const updateStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100).optional(),
  lastName: z.string().max(100).optional(),
  role: z.string().min(1, "Role is required").max(100).optional(),
  specialization: z.string().max(200).optional(),
  phoneNumber: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ═══════════════════════════════════════════════════════════════
// PATCH - Update Standalone Staff
// ═══════════════════════════════════════════════════════════════

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
    const validation = updateStaffSchema.safeParse(body);

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

    const data = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      const existingStaff = await tx.staff.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          user: { select: { id: true } },
        },
      });

      if (!existingStaff) {
        throw new Error("Staff not found");
      }

      // This endpoint is meant for standalone staff records only
      if (existingStaff.user) {
        throw new Error("Staff has a linked user account");
      }

      const staffUpdate: Record<string, unknown> = {};

      if (data.firstName !== undefined) {
        staffUpdate.firstName = data.firstName.trim();
      }
      if (data.lastName !== undefined) {
        staffUpdate.lastName = (data.lastName || "").trim();
      }
      if (data.firstName !== undefined || data.lastName !== undefined) {
        const newFirstName =
          data.firstName !== undefined
            ? data.firstName.trim()
            : existingStaff.firstName;
        const newLastName =
          data.lastName !== undefined
            ? (data.lastName || "").trim()
            : existingStaff.lastName;
        staffUpdate.fullName = newLastName
          ? `${newFirstName} ${newLastName}`
          : newFirstName;
      }
      if (data.role !== undefined) staffUpdate.role = data.role;
      if (data.specialization !== undefined) {
        staffUpdate.specialization = data.specialization || null;
      }
      if (data.phoneNumber !== undefined) {
        staffUpdate.phoneNumber = data.phoneNumber || null;
      }
      if (data.email !== undefined) staffUpdate.email = data.email || null;
      if (data.isActive !== undefined) staffUpdate.isActive = data.isActive;

      const updatedStaff = await tx.staff.update({
        where: { id: staffId },
        data: staffUpdate,
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
          user: { select: { id: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: authUser.id,
          action: "STAFF_UPDATED",
          description: `Updated staff member "${updatedStaff.fullName}"`,
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

    const response = NextResponse.json({
      success: true,
      data: result,
      message: "Staff updated successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/admin/user-management/staff/[id] error:", error);

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
        error: "Failed to update staff member",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE - Delete Standalone Staff
// ═══════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    await prisma.$transaction(async (tx) => {
      const existingStaff = await tx.staff.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          fullName: true,
          user: { select: { id: true } },
        },
      });

      if (!existingStaff) {
        throw new Error("Staff member not found");
      }

      if (existingStaff.user) {
        throw new Error(
          "Cannot delete a staff member with a linked user account",
        );
      }

      // Check relation dependencies across the system
      const [
        admissionsCount,
        chamberVisitsCount,
        pathologyOrderedCount,
        pathologyDoneCount,
        paymentsCount,
        shiftsCount,
        infertilityCreatedCount,
        infertilityModifiedCount,
        infertilityTestOrderedCount,
        infertilityTestDoneCount,
        infertilityShiftsCount,
        infertilityPaymentsCount,
      ] = await Promise.all([
        tx.admission.count({ where: { doctorId: staffId } }),
        tx.doctorChamberVisit.count({ where: { doctorId: staffId } }),
        tx.pathologyTest.count({ where: { orderedById: staffId } }),
        tx.pathologyTest.count({ where: { doneById: staffId } }),
        tx.payment.count({ where: { collectedById: staffId } }),
        tx.shift.count({ where: { staffId } }),
        tx.infertilityPatient.count({ where: { createdBy: staffId } }),
        tx.infertilityPatient.count({ where: { lastModifiedBy: staffId } }),
        tx.infertilityTest.count({ where: { orderedById: staffId } }),
        tx.infertilityTest.count({ where: { doneById: staffId } }),
        tx.infertilityShift.count({ where: { staffId } }),
        tx.infertilityPayment.count({ where: { collectedById: staffId } }),
      ]);

      const totalReferences =
        admissionsCount +
        chamberVisitsCount +
        pathologyOrderedCount +
        pathologyDoneCount +
        paymentsCount +
        shiftsCount +
        infertilityCreatedCount +
        infertilityModifiedCount +
        infertilityTestOrderedCount +
        infertilityTestDoneCount +
        infertilityShiftsCount +
        infertilityPaymentsCount;

      if (totalReferences > 0) {
        throw new Error(
          "Cannot delete staff member with associated admissions, chamber visits, pathology tests, shifts, or payment records. Please deactivate them instead.",
        );
      }

      // Clean up department assignments junction records
      await tx.staffDepartment.deleteMany({
        where: { staffId },
      });

      // Delete the staff record
      await tx.staff.delete({
        where: { id: staffId },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: authUser.id,
          action: "STAFF_DELETED",
          description: `Deleted standalone staff member "${existingStaff.fullName}"`,
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
    });

    const response = NextResponse.json({
      success: true,
      message: "Staff member deleted successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("DELETE /api/admin/user-management/staff/[id] error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      (error.message.includes("linked user account") ||
        error.message.includes("associated"))
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete staff member",
      },
      { status: 500 },
    );
  }
}

