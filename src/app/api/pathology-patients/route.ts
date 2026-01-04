import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import * as pathologyService from "@/services/pathologyService";
import {
  pathologyFiltersSchema,
  addPatientSchema,
} from "@/app/(authenticated)/pathology/types/schemas";

// ═══════════════════════════════════════════════════════════════
// GET /api/pathology-patients - List with filters
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validation = pathologyFiltersSchema.safeParse({
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      isCompleted: searchParams.get("isCompleted") || undefined,
      testCategory: searchParams.get("testCategory") || undefined,
      testCategories: searchParams.get("testCategories") || undefined,
      testNames: searchParams.get("testNames") || undefined,
      orderedById: searchParams.get("orderedById") || undefined,
      doneById: searchParams.get("doneById") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "15",
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await pathologyService.getPathologyPatients(validation.data);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET /api/pathology-patients error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pathology patients",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/pathology-patients - Create new with payment tracking
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id: userId, staffId } = user;

    const body = await request.json();
    const validation = addPatientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { patient, hospital, guardianInfo, pathologyInfo } = validation.data;

    // Get active shift for staff (for cash tracking)
    const activeShift = await prisma?.shift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
    });

    // Ensure all fields are not undefined
    const safePatient = {
      ...patient,
      age: patient.age ?? null,
      dateOfBirth: patient.dateOfBirth ?? null,
    };

    const safeGuardian = {
      ...guardianInfo,
      age: guardianInfo.age ?? null,
      dateOfBirth: guardianInfo.dateOfBirth ?? null,
    };

    const safePathologyInfo = {
      ...pathologyInfo,
      orderedById: pathologyInfo.orderedById ?? null,
      doneById: pathologyInfo.doneById ?? null,
      discountType: pathologyInfo.discountType ?? null,
      discountValue: pathologyInfo.discountValue ?? null,
      discountAmount: pathologyInfo.discountAmount ?? 0,
    };

    const result = await pathologyService.createPathologyPatient(
      safePatient,
      hospital,
      safeGuardian,
      safePathologyInfo,
      staffId,
      userId,
      activeShift?.id || null,
      // Pass session device info for activity logging
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      }
    );

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        message: "Pathology test record created successfully",
      },
      { status: 201 }
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/pathology-patients error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create pathology test record",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
