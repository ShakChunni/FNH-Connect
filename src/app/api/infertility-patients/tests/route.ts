import { NextRequest, NextResponse } from "next/server";
import { validateCSRFToken, addCSRFTokenToResponse } from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import * as infertilityService from "@/services/infertilityService";
import {
  infertilityTestFiltersSchema,
  createInfertilityTestSchema,
} from "@/app/(authenticated)/infertility/types/schemas";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse testNames array properly if sent multiple times
    const testNamesParam = searchParams.getAll("testNames[]");
    
    const validation = infertilityTestFiltersSchema.safeParse({
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      status: searchParams.get("status") || undefined,
      orderedById: searchParams.get("orderedById") || undefined,
      doneById: searchParams.get("doneById") || undefined,
      testNames: testNamesParam.length > 0 ? testNamesParam : undefined,
      infertilityPatientId: searchParams.get("infertilityPatientId") ? Number(searchParams.get("infertilityPatientId")) : undefined,
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

    const result = await infertilityService.getInfertilityTests(validation.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET Infertility Tests error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch infertility tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getAuthenticatedUserForAPI();
    if (!user || !user.staffId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. CSRF validation
    if (!validateCSRFToken(request)) {
      return NextResponse.json({ success: false, error: "CSRF token validation failed" }, { status: 403 });
    }

    // 3. Read body & validate
    const body = await request.json();

    const validation = createInfertilityTestSchema.safeParse(body);
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

    // Capture device info
    const ipAddress = request.headers.get("x-forwarded-for") || "Unknown IP";

    // Extract shiftId if present
    const shiftId = body.shiftId ? Number(body.shiftId) : null;

    // 4. Create via service
    const result = await infertilityService.createInfertilityTest(
      validation.data,
      user.staffId,
      user.id,
      shiftId,
      {
        sessionId: undefined,
        deviceInfo: {
          ipAddress,
          deviceFingerprint: "",
          readableFingerprint: "",
          deviceType: "",
          browserName: "",
          browserVersion: "",
          osType: "",
        },
      }
    );

    const response = NextResponse.json({ success: true, data: result }, { status: 201 });
    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST Infertility Test error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create infertility test";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
