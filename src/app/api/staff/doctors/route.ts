import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════
// GET /api/staff/doctors - Get all doctors/staff
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all active staff members who are doctors
    const doctors = await prisma.staff.findMany({
      where: {
        isActive: true,
        OR: [
          { role: { contains: "Doctor", mode: "insensitive" } },
          { role: { contains: "Dr", mode: "insensitive" } },
          { specialization: { not: null } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        specialization: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    console.error("GET /api/staff/doctors error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch doctors",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
