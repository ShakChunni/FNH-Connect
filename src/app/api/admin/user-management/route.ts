/**
 * User Management API - List & Create
 * GET: List users with filters and pagination
 * POST: Create a new user (link existing staff or create new staff + user)
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

// ═══════════════════════════════════════════════════════════════
// Validation Schemas
// ═══════════════════════════════════════════════════════════════

const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(["all", "active", "archived"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const createUserSchema = z
  .object({
    staffId: z.number().int().positive().optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().max(100).optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50)
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, hyphens and underscores",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    role: z.enum([
      "system-admin",
      "admin",
      "receptionist",
      "receptionist-infertility",
      "medicine-pharmacist",
      "staff",
    ]),
    staffRole: z.string().min(1).max(100).optional(),
    specialization: z.string().max(200).optional(),
    phoneNumber: z.string().max(50).optional(),
    email: z.string().email().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      return (
        data.staffId || (data.firstName && data.firstName.trim().length > 0)
      );
    },
    {
      message:
        "Either select an existing staff member or provide a first name for new staff",
      path: ["firstName"],
    },
  );

// ═══════════════════════════════════════════════════════════════
// GET - List Users
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
    const rawFilters = Object.fromEntries(searchParams.entries());
    const validation = userFiltersSchema.safeParse(rawFilters);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { search, role, status, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        {
          staff: {
            fullName: { contains: search, mode: "insensitive" },
          },
        },
        {
          staff: {
            email: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "archived") {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/user-management error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create User
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
    const validation = createUserSchema.safeParse(body);

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

    // Check username uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      let staffId: number;

      if (data.staffId) {
        // Link to existing staff — verify staff exists and doesn't already have a user
        const existingStaff = await tx.staff.findUnique({
          where: { id: data.staffId },
          include: { user: true },
        });

        if (!existingStaff) {
          throw new Error("Staff member not found");
        }

        if (existingStaff.user) {
          throw new Error("This staff member already has a user account");
        }

        staffId = existingStaff.id;

        // Update staff role if provided
        if (data.staffRole) {
          await tx.staff.update({
            where: { id: staffId },
            data: { role: data.staffRole },
          });
        }
      } else {
        // Create new staff
        const firstName = data.firstName!.trim();
        const lastName = (data.lastName || "").trim();
        const fullName = lastName ? `${firstName} ${lastName}` : firstName;

        const newStaff = await tx.staff.create({
          data: {
            firstName,
            lastName,
            fullName,
            role: data.staffRole || "Staff",
            specialization: data.specialization || null,
            phoneNumber: data.phoneNumber || null,
            email: data.email || null,
            isActive: true,
          },
        });

        staffId = newStaff.id;
      }

      // Create user
      const newUser = await tx.user.create({
        data: {
          username: data.username,
          password: hashedPassword,
          staffId,
          role: data.role,
          isActive: true,
        },
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
          action: "USER_CREATED",
          description: `Created user account "${data.username}" for ${newUser.staff.fullName}`,
          entityType: "User",
          entityId: newUser.id,
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

      return newUser;
    });

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        message: "User created successfully",
      },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/admin/user-management error:", error);

    if (error instanceof Error) {
      const knownErrors = [
        "already exists",
        "already has",
        "not found",
        "Staff member",
      ];
      if (knownErrors.some((msg) => error.message.includes(msg))) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
