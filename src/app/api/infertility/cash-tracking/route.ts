import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getInfertilityCashTrackingDateBoundary,
  getInfertilityCashTrackingShifts,
  getInfertilityCashTrackingSummary,
  getInfertilityCashTrackingStaff,
  isValidInfertilityCashTrackingDateFilter,
} from "@/services/infertilityCashTrackingService";
import { isAdminRole } from "@/lib/roles";
import { z } from "zod";

const cashTrackingDateSchema = z
  .string()
  .trim()
  .refine(isValidInfertilityCashTrackingDateFilter, {
    message: "Invalid date filter",
  });

const filtersSchema = z
  .object({
    staffId: z.coerce.number().optional(),
    startDate: cashTrackingDateSchema.optional(),
    endDate: cashTrackingDateSchema.optional(),
    status: z.enum(["Active", "Closed", "All"]).optional(),
    search: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.startDate || !value.endDate) return;

    const startDate = getInfertilityCashTrackingDateBoundary(
      value.startDate,
      "start",
    );
    const endDate = getInfertilityCashTrackingDateBoundary(
      value.endDate,
      "end",
    );

    if (startDate >= endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after start date",
      });
    }
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

    const canSelectStaff = isAdminRole(user.role);
    const filters = {
      ...validation.data,
      staffId: canSelectStaff ? validation.data.staffId : user.staffId,
    };

    const [shifts, summary, staff] = await Promise.all([
      getInfertilityCashTrackingShifts(filters),
      getInfertilityCashTrackingSummary(filters),
      canSelectStaff
        ? getInfertilityCashTrackingStaff()
        : Promise.resolve([
            {
              id: user.staffId,
              fullName: user.fullName,
              role: user.staffRole,
            },
          ]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        shifts,
        summary,
        filterOptions: {
          staff,
        },
        selectedStaffId: filters.staffId ?? null,
        canSelectStaff,
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
