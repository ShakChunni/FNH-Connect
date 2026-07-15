/**
 * Admissions API Route
 * GET: List admissions with filters
 * POST: Create new admission with cash tracking
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  addCSRFTokenToResponse,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import {
  admissionFiltersSchema,
  createAdmissionSchema,
} from "@/app/(authenticated)/general-admission/types/schemas";
import {
  getAdmissions,
  createAdmission,
  transformAdmissionForResponse,
  AdmissionMedicineValidationError,
} from "@/services/admissionService";

// ═══════════════════════════════════════════════════════════════
// GET - List Admissions
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawFilters = Object.fromEntries(searchParams.entries());
    const validation = admissionFiltersSchema.safeParse(rawFilters);

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

    // Extract validated filters
    const filters = validation.data;

    const { admissions, total } = await getAdmissions({
      search: filters.search,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status,
      departmentId: filters.departmentId,
      doctorId: filters.doctorId,
      hasDue: filters.hasDue,
      hasDiscount: filters.hasDiscount,
      page: filters.page,
      limit: filters.limit,
    });

    // Transform to flat structure for frontend
    const transformedData = admissions.map(transformAdmissionForResponse);

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admissions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admissions",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST - Create Admission with payment tracking
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = createAdmissionSchema.safeParse(body);

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

    const result = await createAdmission(
      {
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
      },
      {
        id: validated.hospital.id,
        name: validated.hospital.name,
        address: validated.hospital.address,
        phoneNumber: validated.hospital.phoneNumber,
        email: validated.hospital.email,
        website: validated.hospital.website,
        type: validated.hospital.type,
      },
      {
        departmentId: validated.departmentId,
        doctorId: validated.doctorId,
        chiefComplaint: validated.chiefComplaint,
        ward: validated.ward,
        seatNumber: validated.seatNumber,
        status: validated.status,
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
        // medicineCharge is intentionally NOT sent: the server derives it
        // from the Admission.medicineBillingEnabled flag and the
        // AdmissionMedicineCharge rows.
        otherCharges: validated.otherCharges,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        discountAmount: validated.discountAmount,
        paidAmount: validated.paidAmount,
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

    // Transform response
    const responseData = transformAdmissionForResponse(result.admission);

    const response = NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Patient admitted successfully",
      },
      { status: 201 }
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/admissions error:", error);
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
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { success: false, error: "Admission number already exists" },
        { status: 400 }
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
        error: "Failed to create admission",
      },
      { status: 500 }
    );
  }
}
