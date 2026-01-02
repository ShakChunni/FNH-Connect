/**
 * Admissions Report API Route
 * GET: Fetch all admissions data (no pagination) for report generation
 * This endpoint returns all matching records based on filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { admissionFiltersSchema } from "@/app/(staff)/general-admission/types/schemas";
import {
  getAdmissions,
  transformAdmissionForResponse,
} from "@/services/admissionService";

// Maximum records to return for reports (safety limit)
const MAX_REPORT_RECORDS = 10000;

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
    const rawFilters = Object.fromEntries(searchParams.entries());

    // Override pagination to get all records
    const validation = admissionFiltersSchema.safeParse({
      ...rawFilters,
      page: "1",
      limit: MAX_REPORT_RECORDS.toString(),
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

    const { admissions, total } = await getAdmissions({
      search: filters.search,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status,
      departmentId: filters.departmentId,
      doctorId: filters.doctorId,
      page: 1,
      limit: MAX_REPORT_RECORDS,
    });

    // Transform to flat structure for frontend
    const transformedData = admissions.map(transformAdmissionForResponse);

    return NextResponse.json({
      success: true,
      data: transformedData,
      total,
    });
  } catch (error) {
    console.error("GET /api/admissions/report error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admissions data for report",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
