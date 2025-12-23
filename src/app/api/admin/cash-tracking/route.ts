import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getAdminShifts,
  getCashTrackingSummary,
} from "@/services/adminShiftService";
import { isAdminRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId")
      ? parseInt(searchParams.get("staffId")!)
      : undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") as
      | "Active"
      | "Closed"
      | undefined;

    const [shifts, summary] = await Promise.all([
      getAdminShifts({ staffId, startDate, endDate, status, search }),
      getCashTrackingSummary(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        shifts,
        summary,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/cash-tracking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cash tracking data" },
      { status: 500 }
    );
  }
}
