import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { doctorChamberQuerySchema } from "@/lib/doctorChamber";
import { getDoctorChamberVisits } from "@/services/doctorChamberService";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const validation = doctorChamberQuerySchema.safeParse({
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: "1",
      limit: "100",
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid chamber report filters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await getDoctorChamberVisits(validation.data, true);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET /api/doctor-chamber/report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch doctor chamber report" },
      { status: 500 },
    );
  }
}

