/**
 * User Management API - Single User
 * GET: Fetch a single user by ID
 * PATCH: Update user role and staff details
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

const updateUserSchema = z.object({
  role: z
    .enum([
      "system-admin",
      "admin",
      "receptionist",
      "receptionist-infertility",
      "medicine-pharmacist",
      "staff",
    ])
    .optional(),
  staffRole: z.string().min(1).max(100).optional(),
  specialization: z.string().max(200).optional(),
  phoneNumber: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ═══════════════════════════════════════════════════════════════
// GET - Single User
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!isAdminRole(user.role)) {
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

    const foundUser = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!foundUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: foundUser });
  } catch (error) {
    console.error("GET /api/admin/user-management/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH - Update User
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
    const validation = updateUserSchema.safeParse(body);

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
      // Verify user exists
      const existingUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, staffId: true, username: true },
      });

      if (!existingUser) {
        throw new Error("User not found");
      }

      // Update User role if provided
      if (data.role) {
        await tx.user.update({
          where: { id: userId },
          data: { role: data.role },
        });
      }

      // Update Staff details
      const staffUpdate: Record<string, unknown> = {};
      if (data.staffRole !== undefined) staffUpdate.role = data.staffRole;
      if (data.specialization !== undefined)
        staffUpdate.specialization = data.specialization || null;
      if (data.phoneNumber !== undefined)
        staffUpdate.phoneNumber = data.phoneNumber || null;
      if (data.email !== undefined) staffUpdate.email = data.email || null;

      if (Object.keys(staffUpdate).length > 0) {
        await tx.staff.update({
          where: { id: existingUser.staffId },
          data: staffUpdate,
        });
      }

      // Fetch updated user
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
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

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: authUser.id,
          action: "USER_UPDATED",
          description: `Updated user account "${existingUser.username}"`,
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

    const response = NextResponse.json({
      success: true,
      data: result,
      message: "User updated successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/admin/user-management/[id] error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
