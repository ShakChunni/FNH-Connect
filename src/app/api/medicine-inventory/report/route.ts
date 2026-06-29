/**
 * Medicine Inventory Report API Route
 * GET: Returns a consolidated report for printing (all data, no pagination)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getMedicineInventoryReport } from "@/services/medicineInventoryService";
import { z } from "zod";

const reportQuerySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
}).superRefine((value, ctx) => {
  if (!value.startDate || !value.endDate) {
    return;
  }

  const startDate = new Date(value.startDate);
  const endDate = new Date(value.endDate);

  if (startDate > endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "End date must be after start date",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET - Consolidated Medicine Inventory Report
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
    const rawFilters = Object.fromEntries(searchParams.entries());
    const validation = reportQuerySchema.safeParse(rawFilters);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { startDate, endDate } = validation.data;

    const report = await getMedicineInventoryReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("GET /api/medicine-inventory/report error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate medicine inventory report",
      },
      { status: 500 },
    );
  }
}
