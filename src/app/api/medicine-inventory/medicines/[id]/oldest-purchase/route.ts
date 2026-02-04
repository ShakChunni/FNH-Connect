/**
 * Medicine Oldest Purchase API Route
 * GET: Get the oldest purchase with remaining stock for a medicine (FIFO)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getOldestPurchaseForMedicine } from "@/services/medicineInventoryService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ═══════════════════════════════════════════════════════════════
// GET - Get Oldest Purchase for Medicine (FIFO)
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const medicineId = parseInt(id, 10);

    if (isNaN(medicineId) || medicineId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid medicine ID" },
        { status: 400 },
      );
    }

    const oldestPurchase = await getOldestPurchaseForMedicine(medicineId);

    return NextResponse.json({
      success: true,
      data: oldestPurchase,
    });
  } catch (error) {
    console.error(
      "GET /api/medicine-inventory/medicines/[id]/oldest-purchase error:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch oldest purchase",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
