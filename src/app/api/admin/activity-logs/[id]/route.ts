import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { getActivityLogDetails } from "@/services/activityLogService";
import { canViewActivityLogs } from "@/lib/roles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUserForAPI();

    if (!user || !canViewActivityLogs(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const logId = parseInt(id);

    if (isNaN(logId)) {
      return NextResponse.json({ error: "Invalid log ID" }, { status: 400 });
    }

    const log = await getActivityLogDetails(logId);

    if (!log) {
      return NextResponse.json(
        { error: "Activity log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("GET /api/admin/activity-logs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity log details" },
      { status: 500 }
    );
  }
}
