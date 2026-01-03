import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import * as infertilityService from "@/services/infertilityService";
import {
  infertilityFiltersSchema,
  addPatientSchema as importedAddPatientSchema,
} from "@/app/(staff)/infertility/types/schemas";

// ═══════════════════════════════════════════════════════════════
// GET /api/infertility-patients - List with filters
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
    const validation = infertilityFiltersSchema.safeParse({
      status: searchParams.get("status") || undefined,
      hospitalId: searchParams.get("hospitalId") || undefined,
      infertilityType: searchParams.get("infertilityType") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
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

    const result = await infertilityService.getInfertilityPatients(
      validation.data
    );

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET /api/infertility-patients error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch infertility patients",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/infertility-patients - Create new
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
    const validation = importedAddPatientSchema.safeParse(body);

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

    const { patient, hospital, spouseInfo, medicalInfo } = validation.data;

    const result = await infertilityService.createInfertilityPatient(
      patient,
      hospital,
      spouseInfo,
      medicalInfo,
      staffId,
      userId
    );

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        message: "Infertility patient record created successfully",
      },
      { status: 201 }
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/infertility-patients error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create infertility patient record",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
