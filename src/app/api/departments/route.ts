import { authorizeAPIRequest } from "@/lib/apiAuthorization";
/**
 * Departments API Route
 * GET: List active departments
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";

export async function GET() {
  try {
    const user = await getAuthenticatedUserForAPI();
    const authorizationError = await authorizeAPIRequest(user, "/api/departments", "GET");
    if (authorizationError) return authorizationError;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch departments",
        message: "Unable to process request",
      },
      { status: 500 }
    );
  }
}
