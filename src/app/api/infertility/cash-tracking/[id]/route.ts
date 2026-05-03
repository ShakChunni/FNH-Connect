import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getInfertilityCashTrackingShiftDetails } from "@/services/infertilityCashTrackingService";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.coerce.number().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const validation = paramsSchema.safeParse({ id });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid shift ID",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const shift = await getInfertilityCashTrackingShiftDetails(validation.data.id);

    if (!shift) {
      return NextResponse.json(
        { success: false, error: "Shift not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shift,
    });
  } catch (error) {
    console.error("GET /api/infertility/cash-tracking/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shift details" },
      { status: 500 }
    );
  }
}
