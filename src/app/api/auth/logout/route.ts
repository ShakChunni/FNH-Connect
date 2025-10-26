import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.SECRET_KEY as string;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables");
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    // Clear session cookie immediately
    cookieStore.delete("session");

    if (sessionToken) {
      try {
        // Verify token to get user ID for activity logging
        const decoded = jwt.verify(sessionToken, SECRET_KEY) as any;

        // Find and delete the session from database
        const session = await prisma.session.findUnique({
          where: { token: sessionToken },
        });

        if (session) {
          // Create activity log before deleting session
          await prisma.activityLog.create({
            data: {
              userId: session.userId,
              action: "LOGOUT",
              description: `User logged out`,
              ipAddress: request.headers.get("x-forwarded-for") || "unknown",
              sessionId: session.id,
            },
          });

          // Delete the session
          await prisma.session.delete({
            where: { token: sessionToken },
          });
        }
      } catch (tokenError) {
        // Token might be expired or invalid, but we still want to logout
        console.log("Token verification failed during logout:", tokenError);
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, clear the cookie and return success
    // to ensure the user is logged out on the client
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out",
      },
      { status: 200 }
    );

    const cookieStore = await cookies();
    cookieStore.delete("session");

    return response;
  }
}
