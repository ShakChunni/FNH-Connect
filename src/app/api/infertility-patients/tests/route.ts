import { publicErrorMessage } from "@/lib/publicError";
import { InfertilityBillingError } from "@/lib/infertilityBilling";
import { authorizeAPIRequest } from "@/lib/apiAuthorization";
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
    const authorizationError = await authorizeAPIRequest(user, "/api/infertility-patients/tests", "GET");
    if (authorizationError) return authorizationError;
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const testNamesParam = searchParams.getAll("testNames[]");
    const legacyTestNamesParam = searchParams.get("testNames");
    const parsedLegacyTestNames = legacyTestNamesParam
      ? legacyTestNamesParam
          .split("|")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
    
    const validation = infertilityTestFiltersSchema.safeParse({
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      status: searchParams.get("status") || undefined,
      orderedById: searchParams.get("orderedById") || undefined,
      doneById: searchParams.get("doneById") || undefined,
      testNames:
        testNamesParam.length > 0
          ? testNamesParam
          : parsedLegacyTestNames.length > 0
            ? parsedLegacyTestNames
            : undefined,
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
    if (error instanceof InfertilityBillingError) {
      return NextResponse.json({ success: false, error: publicErrorMessage(error) }, { status: 400 });
    }
    console.error("GET Infertility Tests error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch HSI Center tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getAuthenticatedUserForAPI();
    const authorizationError = await authorizeAPIRequest(user, "/api/infertility-patients/tests", "POST");
    if (authorizationError) return authorizationError;
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

    // 4. Create via service
    const result = await infertilityService.createInfertilityTest(
      validation.data,
      user.staffId,
      user.id,
      {
        sessionId: user.sessionId,
        deviceInfo: {
          ipAddress,
          deviceFingerprint: user.sessionDeviceInfo.deviceFingerprint,
          readableFingerprint: user.sessionDeviceInfo.readableFingerprint,
          deviceType: user.sessionDeviceInfo.deviceType,
          browserName: user.sessionDeviceInfo.browserName,
          browserVersion: user.sessionDeviceInfo.browserVersion,
          osType: user.sessionDeviceInfo.osType,
        },
      }
    );

    const response = NextResponse.json({ success: true, data: result }, { status: 201 });
    return addCSRFTokenToResponse(response);
  } catch (error) {
    if (error instanceof InfertilityBillingError) {
      return NextResponse.json({ success: false, error: publicErrorMessage(error) }, { status: 400 });
    }
    console.error("POST Infertility Test error:", error);
    const errorMessage = "Failed to create HSI Center test";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
