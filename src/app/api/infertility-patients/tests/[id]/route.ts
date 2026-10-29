import { publicErrorMessage } from "@/lib/publicError";
import { InfertilityBillingError } from "@/lib/infertilityBilling";
import { authorizeAPIRequest, parsePositiveIntegerId } from "@/lib/apiAuthorization";
import { NextRequest, NextResponse } from "next/server";
import {
  addCSRFTokenToResponse,
  validateCSRFToken,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import * as infertilityService from "@/services/infertilityService";
import { updateInfertilityTestSchema } from "@/app/(authenticated)/infertility/types/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserForAPI();
    const authorizationError = await authorizeAPIRequest(user, "/api/infertility-patients/tests/[id]", "GET");
    if (authorizationError) return authorizationError;
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const testId = parsePositiveIntegerId(id);
    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID" }, { status: 400 });
    }

    const test = await infertilityService.getInfertilityTestById(testId);
    if (!test) {
      return NextResponse.json({ success: false, error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: test });
  } catch (error) {
    if (error instanceof InfertilityBillingError) {
      return NextResponse.json({ success: false, error: publicErrorMessage(error) }, { status: 400 });
    }
    console.error("GET Infertility Test Detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch test details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const user = await getAuthenticatedUserForAPI();
    const authorizationError = await authorizeAPIRequest(user, "/api/infertility-patients/tests/[id]", "PUT");
    if (authorizationError) return authorizationError;
    if (!user || !user.staffId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const testId = parsePositiveIntegerId(id);
    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID" }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateInfertilityTestSchema.safeParse(body);
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
    
    const ipAddress = request.headers.get("x-forwarded-for") || "Unknown IP";

    const updatedTest = await infertilityService.updateInfertilityTest(
      testId,
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

    return addCSRFTokenToResponse(
      NextResponse.json({
        success: true,
        data: updatedTest,
        message: "Investigation updated successfully",
      })
    );
  } catch (error) {
    if (error instanceof InfertilityBillingError) {
      return NextResponse.json({ success: false, error: publicErrorMessage(error) }, { status: 400 });
    }
    console.error("PUT Infertility Test error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update test",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  return PUT(request, props);
}
