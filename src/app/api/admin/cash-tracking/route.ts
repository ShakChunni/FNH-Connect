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

    // Default to excluding system-admin shifts (pass includeSystemAdmin=true to include)
    const excludeSystemAdmin =
      searchParams.get("includeSystemAdmin") !== "true";

    const filters = {
      staffId,
      startDate,
      endDate,
      status,
      search,
      excludeSystemAdmin,
    };

    const [shifts, summary] = await Promise.all([
      getAdminShifts(filters),
      getCashTrackingSummary(filters),
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
