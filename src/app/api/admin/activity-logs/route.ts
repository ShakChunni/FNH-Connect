import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import {
  getActivityLogs,
  getActivityLogSummary,
  getDistinctActionTypes,
  getUsersWithActivityLogs,
} from "@/services/activityLogService";
import { canViewActivityLogs } from "@/lib/roles";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();

    if (!user || !canViewActivityLogs(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const search = searchParams.get("search") || undefined;
    const action = searchParams.get("action") || undefined;
    const userId = searchParams.get("userId")
      ? parseInt(searchParams.get("userId")!)
      : undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const filters = {
      page,
      limit,
      search,
      action,
      userId,
      entityType,
      startDate,
      endDate,
    };

    // Fetch logs, summary, and filter options in parallel
    const [logsData, summary, actionTypes, users] = await Promise.all([
      getActivityLogs(filters),
      getActivityLogSummary(filters),
      getDistinctActionTypes(),
      getUsersWithActivityLogs(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs: logsData.logs,
        pagination: logsData.pagination,
        summary,
        filterOptions: {
          actionTypes,
          users,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/activity-logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
