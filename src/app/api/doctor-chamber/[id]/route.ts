import { NextRequest, NextResponse } from "next/server";
import {
  addCSRFTokenToResponse,
  validateCSRFToken,
} from "@/lib/csrfProtection";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { doctorChamberVisitSchema } from "@/lib/doctorChamber";
import {
  getDoctorChamberVisitById,
  updateDoctorChamberVisit,
} from "@/services/doctorChamberService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getId(context: RouteContext): Promise<number | null> {
  const { id } = await context.params;
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const id = await getId(context);
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invalid visit ID" },
        { status: 400 },
      );
    }

    const visit = await getDoctorChamberVisitById(id);
    if (!visit) {
      return NextResponse.json(
        { success: false, error: "Doctor chamber visit not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: visit });
  } catch (error) {
    console.error("GET /api/doctor-chamber/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctor chamber visit" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    if (!validateCSRFToken(request)) {
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const id = await getId(context);
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invalid visit ID" },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();
    const validation = doctorChamberVisitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid chamber visit data",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await updateDoctorChamberVisit(
      id,
      validation.data,
      user.staffId,
      user.id,
      {
        sessionId: user.sessionId,
        deviceInfo: user.sessionDeviceInfo,
      },
    );

    const response = NextResponse.json({
      success: true,
      data: result,
      message: "Doctor chamber visit updated successfully",
    });

    return addCSRFTokenToResponse(response);
  } catch (error) {
    console.error("PATCH /api/doctor-chamber/[id] error:", error);
    const message =
      error instanceof Error &&
      [
        "Doctor chamber visit not found",
        "This visit does not belong to the configured doctor",
        "The patient cannot be changed while editing a visit",
      ].includes(error.message)
        ? error.message
        : "Failed to update doctor chamber visit";

    return NextResponse.json(
      { success: false, error: message },
      { status: message === "Doctor chamber visit not found" ? 404 : 400 },
    );
  }
}

