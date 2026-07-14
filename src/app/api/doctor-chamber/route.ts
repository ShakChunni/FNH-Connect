import { NextRequest, NextResponse } from "next/server";
import {
  addCSRFTokenToResponse,
  validateCSRFToken,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  doctorChamberQuerySchema,
  doctorChamberVisitSchema,
} from "@/lib/doctorChamber";
import {
  createDoctorChamberVisit,
  getDoctorChamberVisits,
} from "@/services/doctorChamberService";

function getQueryInput(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return {
    search: searchParams.get("search") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    page: searchParams.get("page") || undefined,
    limit: searchParams.get("limit") || undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const validation = doctorChamberQuerySchema.safeParse(getQueryInput(request));
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid chamber filters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await getDoctorChamberVisits(validation.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET /api/doctor-chamber error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctor chamber visits" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const validation = doctorChamberVisitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid chamber visit data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await createDoctorChamberVisit(
      validation.data,
      user.staffId,
      user.id,
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      },
    );

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        message: "Doctor chamber visit created successfully",
      },
      { status: 201 },
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/doctor-chamber error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create doctor chamber visit" },
      { status: 500 },
    );
  }
}

