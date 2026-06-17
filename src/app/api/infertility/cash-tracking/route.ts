import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getInfertilityCashTrackingShifts,
  getInfertilityCashTrackingSummary,
  getInfertilityCashTrackingStaff,
} from "@/services/infertilityCashTrackingService";
import { z } from "zod";

const filtersSchema = z.object({
  staffId: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["Active", "Closed", "All"]).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const validation = filtersSchema.safeParse({
      staffId: searchParams.get("staffId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const filters = validation.data;

    const [shifts, summary, staff] = await Promise.all([
      getInfertilityCashTrackingShifts(filters),
      getInfertilityCashTrackingSummary(filters),
      getInfertilityCashTrackingStaff(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        shifts,
        summary,
        filterOptions: {
          staff,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/infertility/cash-tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch HSI Center cash tracking data" },
      { status: 500 }
    );
  }
}
