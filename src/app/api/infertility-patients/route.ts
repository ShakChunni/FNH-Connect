import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCSRFToken, addCSRFTokenToResponse } from "@/lib/csrfProtection";
import { getUserFromSession } from "@/lib/auth";
import * as infertilityService from "@/services/infertilityService";

// ═══════════════════════════════════════════════════════════════
// GET /api/infertility-patients - List with filters
// ═══════════════════════════════════════════════════════════════

const querySchema = z.object({
  status: z.string().optional(),
  hospitalId: z.string().transform(Number).optional(),
  infertilityType: z.string().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await getUserFromSession(request);

    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      status: searchParams.get("status") || undefined,
      hospitalId: searchParams.get("hospitalId") || undefined,
      infertilityType: searchParams.get("infertilityType") || undefined,
      search: searchParams.get("search") || undefined,
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

    const patients = await infertilityService.getInfertilityPatients(validation.data);

    return NextResponse.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error("GET /api/infertility-patients error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch infertility patients",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/infertility-patients - Create new
// ═══════════════════════════════════════════════════════════════

const patientSchema = z.object({
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

const hospitalSchema = z.object({
  id: z.number().nullable(),
  name: z.string().min(1, "Hospital name is required"),
  address: z.string(),
  phoneNumber: z.string(),
  email: z.string(),
  website: z.string(),
  type: z.string(),
});

const spouseInfoSchema = z.object({
  name: z.string(),
  age: z.number().nullable(),
  dateOfBirth: z.string().nullable().transform((val) => (val ? new Date(val) : null)),
  gender: z.string(),
});

const medicalInfoSchema = z.object({
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

const addPatientSchema = z.object({
  patient: patientSchema,
  hospital: hospitalSchema,
  spouseInfo: spouseInfoSchema,
  medicalInfo: medicalInfoSchema,
});

export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const { userId, staffId } = await getUserFromSession(request);

    const body = await request.json();
    const validation = addPatientSchema.safeParse(body);

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

    const result = await infertilityService.createInfertilityPatient(
      patient,
      hospital,
      spouseInfo,
      medicalInfo,
      staffId,
      userId
    );

    const response = NextResponse.json(
      {
        success: true,
        data: result,
        message: "Infertility patient record created successfully",
      },
      { status: 201 }
    );

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("POST /api/infertility-patients error:", error);

    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create infertility patient record",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
