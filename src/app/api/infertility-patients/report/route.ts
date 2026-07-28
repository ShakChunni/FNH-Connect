import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getInfertilityPatientsForReport } from "@/services/infertilityService";
import { infertilityFiltersSchema } from "@/app/(authenticated)/infertility/types/schemas";

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
    const validation = infertilityFiltersSchema.safeParse({
      status: searchParams.get("status") || undefined,
      hospitalId: searchParams.get("hospitalId") || undefined,
      infertilityType: searchParams.get("infertilityType") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      testNames: searchParams.get("testNames") || undefined,
    });

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

    const result = await getInfertilityPatientsForReport(validation.data);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET /api/infertility-patients/report error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch HSI Center patient report",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
