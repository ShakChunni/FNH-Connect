import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import * as infertilityService from "@/services/infertilityService";
import { infertilityTestFiltersSchema } from "@/app/(authenticated)/infertility/types/schemas";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testNamesParam = searchParams.getAll("testNames[]");

    const validation = infertilityTestFiltersSchema.safeParse({
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      status: searchParams.get("status") || undefined,
      orderedById: searchParams.get("orderedById") || undefined,
      doneById: searchParams.get("doneById") || undefined,
      testNames: testNamesParam.length > 0 ? testNamesParam : undefined,
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

    // Exclude pagination for report
    const { page, limit, ...reportFilters } = validation.data;
    
    const result = await infertilityService.getInfertilityTestsForReport(reportFilters);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET Infertility Tests Report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch infertility tests report data" },
      { status: 500 }
    );
  }
}
