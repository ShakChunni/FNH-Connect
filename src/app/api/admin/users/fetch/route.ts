import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const user = await getUserFromSession(request);
    requireAdmin(user);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    // Transform to match expected interface
    const transformedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      role: user.role,
      manages: [], // Default empty array
      organizations: [], // Default empty array
      archived: !user.isActive, // Use isActive as archived indicator
    }));
    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500 }
    );
  }
}
