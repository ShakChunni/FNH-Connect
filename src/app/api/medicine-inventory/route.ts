/**
 * Medicine Inventory API Route
 * GET: Dashboard statistics for medicine inventory
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getMedicineInventoryStats } from "@/services/medicineInventoryService";

// ═══════════════════════════════════════════════════════════════
// GET - Dashboard Statistics
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const { stats, lowStockItems } = await getMedicineInventoryStats(
      startDate,
      endDate,
    );

    return NextResponse.json({
      success: true,
      data: {
        stats,
        lowStockItems,
      },
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch medicine inventory stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
