import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { currentUsername, currentRole, managesUsers } = await req.json();

    // Validate required fields
    if (!currentUsername || !currentRole) {
      return NextResponse.json(
        { error: "Missing required user information" },
        { status: 400 }
      );
    }

    // Get all non-admin and non-archived users
    const allUsers = await prisma.user.findMany({
      where: {
        NOT: [{ username: "ashfaq" }, { username: "tanvir" }],
      },
      select: {
        id: true,
        username: true,
        role: true,
        manages: true,
        organizations: true,
        archived: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    // Filter users based on role and management permissions
    let accessibleUsers;

    if (currentRole === "admin") {
      // Admins can see all users
      accessibleUsers = allUsers;
    } else if (currentRole === "salesperson") {
      // Salespersons can see themselves and users they manage
      accessibleUsers = allUsers.filter(
        (user) =>
          user.username === currentUsername ||
          (managesUsers &&
            Array.isArray(managesUsers) &&
            managesUsers.includes(user.username))
      );
    } else {
      // Default case - users can only see themselves
      accessibleUsers = allUsers.filter(
        (user) => user.username === currentUsername
      );
    }

    return NextResponse.json(accessibleUsers);
  } catch (error) {
    console.error("Error filtering users:", error);
    return NextResponse.json(
      { error: "Error filtering users" },
      { status: 500 }
    );
  }
}

// Keep GET method for backward compatibility or redirect to POST
export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      error: "This endpoint now requires a POST request with user information",
    },
    { status: 400 }
  );
}
