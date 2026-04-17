import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserForAPI } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";

// ═══════════════════════════════════════════════════════════════
// GET /api/staff/doctors - Get active doctors + self-referred option
// ═══════════════════════════════════════════════════════════════

// Helper function to determine doctor rank from their name prefix
function getDoctorRankOrder(fullName: string): number {
  const name = fullName.toLowerCase();

  // IMPORTANT: Check more specific patterns FIRST (associate/asst contain "prof" too!)
  // Rank order (lower = higher rank, appears first)

  // Check associate/assistant patterns first (they also contain "prof")
  if (name.startsWith("associate prof") || name.includes("associate prof"))
    return 2;
  if (name.startsWith("asst prof") || name.includes("asst prof")) return 3;
  if (name.startsWith("asst director") || name.includes("asst director"))
    return 4;

  // Now check for Professor (after ruling out associate/asst)
  if (
    name.startsWith("prof.") ||
    name.startsWith("prof ") ||
    name.includes("prof. dr.") ||
    name.includes("prof. cornel")
  )
    return 1;

  // Regular doctors
  if (name.startsWith("dr.")) return 5;

  return 10; // Default for others
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserForAPI();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Fetch active doctors plus optional "Self" staff entry
    const doctors = await prisma.staff.findMany({
      where: {
        isActive: true,
        OR: [
          { role: { equals: "Doctor", mode: "insensitive" } },
          { role: { equals: "Self", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        specialization: true,
      },
    });

    // Sort by role first (Self, then doctors by rank), then alphabetically
    const sortedDoctors = doctors.sort((a, b) => {
      const roleA = a.role.toLowerCase();
      const roleB = b.role.toLowerCase();

      const isSelfA = roleA === "self";
      const isSelfB = roleB === "self";
      if (isSelfA !== isSelfB) return isSelfA ? -1 : 1;

      // Sort by rank
      const rankA = getDoctorRankOrder(a.fullName);
      const rankB = getDoctorRankOrder(b.fullName);

      if (rankA !== rankB) return rankA - rankB;

      // Same rank: sort alphabetically
      return a.fullName.localeCompare(b.fullName);
    });

    return NextResponse.json({
      success: true,
      data: sortedDoctors,
    });
  } catch (error) {
    console.error("GET /api/staff/doctors error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch doctors",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
