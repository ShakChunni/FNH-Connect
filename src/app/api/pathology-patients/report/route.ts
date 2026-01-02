/**
 * Pathology Report API Route
 * GET: Fetch all pathology data (no pagination) for report generation
 * This endpoint returns all matching records based on filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import * as pathologyService from "@/services/pathologyService";
import { pathologyFiltersSchema } from "@/app/(staff)/pathology/types/schemas";

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
    const validation = pathologyFiltersSchema.safeParse({
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      isCompleted: searchParams.get("isCompleted") || undefined,
      testCategory: searchParams.get("testCategory") || undefined,
      testCategories: searchParams.get("testCategories") || undefined,
      testNames: searchParams.get("testNames") || undefined,
      orderedById: searchParams.get("orderedById") || undefined,
      doneById: searchParams.get("doneById") || undefined,
      // Override pagination to get all records
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

    const result = await pathologyService.getPathologyPatients({
      ...validation.data,
      page: 1,
      limit: MAX_REPORT_RECORDS,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.pagination.total,
    });
  } catch (error) {
    console.error("GET /api/pathology-patients/report error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pathology data for report",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
