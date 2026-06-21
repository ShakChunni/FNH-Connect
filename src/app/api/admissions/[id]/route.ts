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
  AdmissionMedicineValidationError,
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

    const body: unknown = await request.json();
    const requestData =
      typeof body === "object" && body !== null && !Array.isArray(body)
        ? body
        : {};
    const validation = updateAdmissionSchema.safeParse({
      ...requestData,
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
        patient: validated.patient
          ? {
              id: validated.patient.id,
              firstName: validated.patient.firstName,
              lastName: validated.patient.lastName,
              fullName: validated.patient.fullName,
              gender: validated.patient.gender,
              age: validated.patient.age,
              dateOfBirth: validated.patient.dateOfBirth,
              address: validated.patient.address,
              phoneNumber: validated.patient.phoneNumber,
              email: validated.patient.email,
              bloodGroup: validated.patient.bloodGroup,
              guardianName: validated.patient.guardianName,
              guardianPhone: validated.patient.guardianPhone,
            }
          : undefined,
        doctorId: validated.doctorId,
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
        medicineChargeItems: validated.medicineChargeItems,
      },
      staffId,
      userId,
      activeShift?.id || null,
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      }
    );

    const responseData = transformAdmissionForResponse(updatedAdmission);

    const response = NextResponse.json({
      success: true,
      data: responseData,
      message: "Admission updated successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/admissions/[id] error:", error);
    if (error instanceof AdmissionMedicineValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.fieldErrors,
        },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      error.message === "Admission record not found"
    ) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }
    if (
      error instanceof Error &&
      error.message ===
        "Cannot change the patient linked to an existing admission."
    ) {
      return NextResponse.json(
        { success: false, error: "Patient does not match this admission" },
        { status: 400 },
      );
    }
    if (
      error instanceof Error &&
      (error.message.includes("Insufficient stock") ||
        error.message.includes("Sale date cannot") ||
        error.message.includes("No stock available") ||
        error.message.includes("No stock purchase history"))
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update admission",
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
      },
      { status: 500 }
    );
  }
}
