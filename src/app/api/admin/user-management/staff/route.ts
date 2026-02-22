/**
 * User Management API - Staff
 * GET: Fetch staff records (all or only those without User accounts)
 * POST: Create standalone staff record (no login account)
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

const createStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional(),
  role: z.string().min(1, "Role is required").max(100),
  specialization: z.string().max(200).optional(),
  phoneNumber: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

// ═══════════════════════════════════════════════════════════════
// GET - Fetch Staff
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";
    const search = searchParams.get("search") || undefined;

    const where: Record<string, unknown> = {
      isActive: true,
    };

    // If not showing all, only return staff without a linked User account
    if (!showAll) {
      where.user = null;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const staffList = await prisma.staff.findMany({
      where,
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
        user: {
          select: { id: true },
        },
      },
      orderBy: { fullName: "asc" },
    });

    const transformedStaff = staffList.map((staff) => ({
      id: staff.id,
      firstName: staff.firstName,
      lastName: staff.lastName,
      fullName: staff.fullName,
      role: staff.role,
      specialization: staff.specialization,
      phoneNumber: staff.phoneNumber,
      email: staff.email,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
      hasUser: !!staff.user,
    }));

    return NextResponse.json({
      success: true,
      data: transformedStaff,
    });
  } catch (error) {
    console.error("GET /api/admin/user-management/staff error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch staff",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create Standalone Staff
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = createStaffSchema.safeParse(body);

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
    const firstName = data.firstName.trim();
    const lastName = (data.lastName || "").trim();
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    const newStaff = await prisma.staff.create({
      data: {
        firstName,
        lastName,
        fullName,
        role: data.role,
        specialization: data.specialization || null,
        phoneNumber: data.phoneNumber || null,
        email: data.email || null,
        isActive: true,
      },
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: authUser.id,
        action: "STAFF_CREATED",
        description: `Created staff member "${fullName}" with role "${data.role}"`,
        entityType: "Staff",
        entityId: newStaff.id,
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

    const response = NextResponse.json(
      {
        success: true,
        data: { ...newStaff, hasUser: false },
        message: "Staff member created successfully",
      },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/admin/user-management/staff error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create staff member",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
