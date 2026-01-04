/**
 * Single Admission API Route
 * GET: Get single admission by ID
 * PATCH: Update admission with cash tracking
 * DELETE: Delete admission
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import { updateAdmissionSchema } from "@/app/(authenticated)/general-admission/types/schemas";
import {
  getAdmissionById,
  updateAdmission,
  deleteAdmission,
  transformAdmissionForResponse,
} from "@/services/admissionService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ═══════════════════════════════════════════════════════════════
// GET - Get Single Admission
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admission ID" },
        { status: 400 }
      );
    }

    const admission = await getAdmissionById(admissionId);

    if (!admission) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    const responseData = transformAdmissionForResponse(admission);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("GET /api/admissions/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admission",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH - Update Admission with cash tracking
// ═══════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admission ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateAdmissionSchema.safeParse({
      ...body,
      id: admissionId,
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

    const validated = validation.data;

    // Get active shift for staff (for cash tracking)
    const activeShift = await prisma.shift.findFirst({
      where: {
        staffId,
        isActive: true,
      },
    });

    const updatedAdmission = await updateAdmission(
      admissionId,
      {
        status: validated.status,
        seatNumber: validated.seatNumber,
        ward: validated.ward,
        diagnosis: validated.diagnosis,
        treatment: validated.treatment,
        otType: validated.otType,
        remarks: validated.remarks,
        serviceCharge: validated.serviceCharge,
        seatRent: validated.seatRent,
        otCharge: validated.otCharge,
        doctorCharge: validated.doctorCharge,
        surgeonCharge: validated.surgeonCharge,
        anesthesiaFee: validated.anesthesiaFee,
        assistantDoctorFee: validated.assistantDoctorFee,
        medicineCharge: validated.medicineCharge,
        otherCharges: validated.otherCharges,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        discountAmount: validated.discountAmount,
        paidAmount: validated.paidAmount,
        isDischarged: validated.isDischarged,
        dateDischarged: validated.dateDischarged,
        chiefComplaint: validated.chiefComplaint,
      },
      staffId,
      userId,
      activeShift?.id || null,
      // Pass session device info for activity logging
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      }
    );

    const responseData = {
      id: updatedAdmission.id,
      admissionNumber: updatedAdmission.admissionNumber,
      patientFullName: updatedAdmission.patient.fullName,
      status: updatedAdmission.status,
      grandTotal: Number(updatedAdmission.grandTotal),
      dueAmount: Number(updatedAdmission.dueAmount),
      updatedAt: updatedAdmission.updatedAt.toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      data: responseData,
      message: "Admission updated successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/admissions/[id] error:", error);
    if (
      error instanceof Error &&
      error.message === "Admission record not found"
    ) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update admission",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE - Delete Admission
// ═══════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const admissionId = parseInt(id);

    if (isNaN(admissionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid admission ID" },
        { status: 400 }
      );
    }

    await deleteAdmission(
      admissionId,
      user.id,
      // Pass session device info for activity logging
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      }
    );

    const response = NextResponse.json({
      success: true,
      message: "Admission deleted successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("DELETE /api/admissions/[id] error:", error);
    if (
      error instanceof Error &&
      error.message === "Admission record not found"
    ) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete admission",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
