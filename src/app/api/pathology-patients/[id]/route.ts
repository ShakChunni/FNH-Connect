import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import * as pathologyService from "@/services/pathologyService";
import { editPatientSchema } from "@/app/(authenticated)/pathology/types/schemas";
import { prisma } from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════
// PATCH /api/pathology-patients/[id] - Update existing
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
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id: userId, staffId } = user;

    const { id } = await params;
    const pathologyId = parseInt(id, 10);

    if (isNaN(pathologyId)) {
      return NextResponse.json(
        { success: false, error: "Invalid pathology test ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = editPatientSchema.safeParse({
      ...body,
      id: pathologyId,
    });

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
    const activeShift = await prisma.shift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
    });

    // Ensure all fields are not undefined (sanitize)
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

    const result = await pathologyService.updatePathologyPatient(
      pathologyId,
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
        message: "Pathology test record updated successfully",
      },
      { status: 200 }
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/pathology-patients/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update pathology test record",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
