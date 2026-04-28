import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import * as infertilityService from "@/services/infertilityService";

const updateStatusSchema = z.object({
  status: z
    .string()
    .trim()
    .min(1, "Status is required")
    .max(50, "Status is too long"),
});

export async function PATCH(
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
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!user.staffId) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const patientId = parseInt(id, 10);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

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

    const updated = await infertilityService.updateInfertilityPatientStatus(
      patientId,
      validation.data.status,
      user.staffId,
      user.id,
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      }
    );

    const response = NextResponse.json({
      success: true,
      data: updated,
      message: `Patient status updated to ${validation.data.status}`,
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/infertility-patients/[id]/status error:", error);

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("not found")
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update infertility patient status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

