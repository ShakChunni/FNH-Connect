import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import * as infertilityService from "@/services/infertilityService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const testId = parseInt(id, 10);
    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID" }, { status: 400 });
    }

    const test = await infertilityService.getInfertilityTestById(testId);
    if (!test) {
      return NextResponse.json({ success: false, error: "Test not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: test });
  } catch (error) {
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
    const user = await getAuthenticatedUserForAPI();
    if (!user || !user.staffId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const testId = parseInt(id, 10);
    if (isNaN(testId)) {
      return NextResponse.json({ success: false, error: "Invalid test ID" }, { status: 400 });
    }

    const body = await request.json();
    
    const ipAddress = request.headers.get("x-forwarded-for") || "Unknown IP";

    const updatedTest = await infertilityService.updateInfertilityTest(
      testId,
      body,
      user.staffId,
      user.id,
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

    return NextResponse.json({ success: true, data: updatedTest });
  } catch (error) {
    console.error("PUT Infertility Test error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update test" },
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
