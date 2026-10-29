import { authorizeAPIRequest, parsePositiveIntegerId } from "@/lib/apiAuthorization";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getInfertilityCashTrackingShiftDetails } from "@/services/infertilityCashTrackingService";
import { isAdminRole } from "@/lib/roles";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserForAPI();
    const authorizationError = await authorizeAPIRequest(user, "/api/infertility/cash-tracking/[id]", "GET");
    if (authorizationError) return authorizationError;
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

    if (!isAdminRole(user.role) && shift.staffId !== user.staffId) {
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
