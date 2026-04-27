import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getInfertilityShiftDetails } from "@/services/adminInfertilityShiftService";
import { isAdminRole } from "@/lib/roles";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const shiftId = parseInt(id);

    if (isNaN(shiftId)) {
      return NextResponse.json({ error: "Invalid shift ID" }, { status: 400 });
    }

    const shift = await getInfertilityShiftDetails(shiftId);

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: shift,
    });
  } catch (error) {
    console.error("GET /api/admin/infertility-cash-tracking/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shift details" },
      { status: 500 }
    );
  }
}
