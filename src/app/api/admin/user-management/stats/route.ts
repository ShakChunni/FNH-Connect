/**
 * User Management API - Stats
 * GET: Fetch user management statistics
 */

import { NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { isAdminRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const [totalUsers, activeUsers, archivedUsers, roleGroups] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.user.groupBy({
          by: ["role"],
          _count: { role: true },
        }),
      ]);

    const byRole: Record<string, number> = {};
    for (const group of roleGroups) {
      byRole[group.role] = group._count.role;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        archivedUsers,
        byRole,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/user-management/stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
