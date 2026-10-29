import { publicErrorMessage } from "@/lib/publicError";
import { authorizeAPIRequest, parsePositiveIntegerId } from "@/lib/apiAuthorization";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import * as infertilityService from "@/services/infertilityService";

// ═══════════════════════════════════════════════════════════════
// GET /api/infertility-patients/[id] - Get single patient
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserForAPI();
    const authorizationError = await authorizeAPIRequest(user, "/api/infertility-patients/[id]", "GET");
    if (authorizationError) return authorizationError;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const patientId = parsePositiveIntegerId(id);
    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    const patient = await infertilityService.getInfertilityPatientById(
      patientId
    );

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "HSI Center patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("GET /api/infertility-patients/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch HSI Center patient",
        message: "Unable to process request",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/infertility-patients/[id] - Update patient
// ═══════════════════════════════════════════════════════════════

import { editPatientSchema } from "@/app/(authenticated)/infertility/types/schemas";

// ═══════════════════════════════════════════════════════════════
// PATCH /api/infertility-patients/[id] - Update patient
// ═══════════════════════════════════════════════════════════════

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
    const authorizationError = await authorizeAPIRequest(user, "/api/infertility-patients/[id]", "PATCH");
    if (authorizationError) return authorizationError;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id: userId, staffId } = user;

    const { id } = await params;
    const patientId = parsePositiveIntegerId(id);
    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = editPatientSchema.safeParse(body);

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

    const result = await infertilityService.updateInfertilityPatient(
      patientId,
      patient,
      hospital,
      spouseInfo,
      medicalInfo,
      staffId,
      userId,
      // Pass session device info for activity logging
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      }
    );

    const response = NextResponse.json({
      success: true,
      data: result,
      message: "HSI Center patient record updated successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/infertility-patients/[id] error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: publicErrorMessage(error) },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update HSI Center patient record",
        message: "Unable to process request",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/infertility-patients/[id] - Delete patient
// ═══════════════════════════════════════════════════════════════

export async function DELETE(
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
    const authorizationError = await authorizeAPIRequest(user, "/api/infertility-patients/[id]", "DELETE");
    if (authorizationError) return authorizationError;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id: userId } = user;

    const { id } = await params;
    const patientId = parsePositiveIntegerId(id);
    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    await infertilityService.deleteInfertilityPatient(
      patientId,
      userId,
      // Pass session device info for activity logging
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      }
    );

    const response = NextResponse.json({
      success: true,
      message: "HSI Center patient record deleted successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("DELETE /api/infertility-patients/[id] error:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: publicErrorMessage(error) },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete HSI Center patient record",
        message: "Unable to process request",
      },
      { status: 500 }
    );
  }
}
