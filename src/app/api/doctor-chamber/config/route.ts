import { NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getDoctorChamberConfig } from "@/services/doctorChamberService";

export async function GET() {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: await getDoctorChamberConfig(),
    });
  } catch (error) {
    console.error("GET /api/doctor-chamber/config error:", error);
    return NextResponse.json(
      { success: false, error: "Doctor chamber configuration is unavailable" },
      { status: 500 },
    );
  }
}

