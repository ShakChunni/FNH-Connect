import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getAdminShifts,
  getCashTrackingSummary,
} from "@/services/adminShiftService";
import { isAdminRole } from "@/lib/roles";

/**
 * API Route: GET /api/dashboard/admin-shifts
 *
 * This endpoint provides shift data for the admin dashboard widget.
 * It's placed under /dashboard instead of /admin to avoid middleware blocking,
 * but still checks for admin role internally.
 *
 * IMPORTANT: This endpoint excludes system-admin shifts by default
 * for the dashboard widget (since admins typically want to see staff shifts only).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Default to today's date if not provided (using local time, not UTC)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
    const startDate = searchParams.get("startDate") || today;
    const endDate = searchParams.get("endDate") || undefined;
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") as
      | "Active"
      | "Closed"
      | undefined;

    // Default to excluding system-admin shifts in the dashboard widget
    const excludeSystemAdmin =
      searchParams.get("excludeSystemAdmin") !== "false";

    const filters = { startDate, endDate, status, search, excludeSystemAdmin };

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
    console.error("[GET /api/dashboard/admin-shifts] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shifts data" },
      { status: 500 }
    );
  }
}
