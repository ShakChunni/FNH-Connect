import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCSRFToken, addCSRFTokenToResponse } from "@/lib/csrfProtection";
import { getUserFromSession } from "@/lib/auth";
import * as infertilityService from "@/services/infertilityService";

// ═══════════════════════════════════════════════════════════════
// GET /api/infertility-patients/[id] - Get single patient
// ═══════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getUserFromSession(request);

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    const patient = await infertilityService.getInfertilityPatientById(id);

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Infertility patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("GET /api/infertility-patients/[id] error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch infertility patient",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/infertility-patients/[id] - Update patient
// ═══════════════════════════════════════════════════════════════

const patientUpdateSchema = z.object({
  id: z.number().nullable(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  gender: z.string().min(1, "Gender is required"),
  age: z.number().nullable(),
  dateOfBirth: z.string().nullable().transform((val) => (val ? new Date(val) : null)),
  guardianName: z.string(),
  address: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  bloodGroup: z.string(),
});

const hospitalUpdateSchema = z.object({
  id: z.number().nullable(),
  name: z.string().min(1, "Hospital name is required"),
  address: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  website: z.string(),
  type: z.string(),
});

const spouseInfoUpdateSchema = z.object({
  name: z.string(),
  age: z.number().nullable(),
  dateOfBirth: z.string().nullable().transform((val) => (val ? new Date(val) : null)),
  gender: z.string(),
});

const medicalInfoUpdateSchema = z.object({
  yearsMarried: z.number().nullable(),
  yearsTrying: z.number().nullable(),
  infertilityType: z.string(),
  para: z.string(),
  gravida: z.string(),
  weight: z.number().nullable(),
  height: z.number().nullable(),
  bmi: z.number().nullable(),
  bloodPressure: z.string(),
  medicalHistory: z.string(),
  surgicalHistory: z.string(),
  menstrualHistory: z.string(),
  contraceptiveHistory: z.string(),
  referralSource: z.string(),
  chiefComplaint: z.string(),
  treatmentPlan: z.string(),
  medications: z.string(),
  nextAppointment: z.string().nullable().transform((val) => (val ? new Date(val) : null)),
  status: z.string(),
  notes: z.string(),
});

const updatePatientSchema = z.object({
  patient: patientUpdateSchema,
  hospital: hospitalUpdateSchema,
  spouseInfo: spouseInfoUpdateSchema,
  medicalInfo: medicalInfoUpdateSchema,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const { userId, staffId } = await getUserFromSession(request);

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updatePatientSchema.safeParse(body);

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
      id,
      patient,
      hospital,
      spouseInfo,
      medicalInfo,
      staffId,
      userId
    );

    const response = NextResponse.json({
      success: true,
      data: result,
      message: "Infertility patient record updated successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/infertility-patients/[id] error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update infertility patient record",
        message: error instanceof Error ? error.message : "Unknown error",
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
  { params }: { params: { id: string } }
) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const { userId } = await getUserFromSession(request);

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    await infertilityService.deleteInfertilityPatient(id, userId);

    const response = NextResponse.json({
      success: true,
      message: "Infertility patient record deleted successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("DELETE /api/infertility-patients/[id] error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete infertility patient record",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
