import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET_KEY = process.env.SECRET_KEY as string;
const EXPIRATION_TIME = 60 * 60 * 24; // 1 day in seconds

interface UserResponse {
  id: number;
  username: string;
  staffId: number;
  fullName: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      // Clear the session cookie
      const response = NextResponse.json(
        { success: false, valid: false },
        { status: 401 }
      );
      response.cookies.set("session", "", { maxAge: 0 }); // Deletes the cookie
      return response;
    }

    // Verify JWT token
    try {
      jwt.verify(sessionToken, SECRET_KEY);
    } catch (error) {
      console.error("JWT verification failed:", error);

      const response = NextResponse.json(
        { success: false, valid: false },
        { status: 401 }
      );
      response.cookies.set("session", "", { maxAge: 0 }); // Deletes the cookie
      return response;
    }

    // Check if session exists in database and is not expired
    const session = await prisma.session.findUnique({
      where: {
        token: sessionToken,
      },
      include: {
        user: {
          include: {
            staff: true, // Include staff to get fullName
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        // Clean up expired session
        await prisma.session.delete({
          where: { id: session.id },
        });
      }

      const response = NextResponse.json(
        { success: false, valid: false },
        { status: 401 }
      );
      response.cookies.set("session", "", { maxAge: 0 }); // Deletes the cookie
      return response;
    }

    // Renew session expiration time
    const newExpiresAt = new Date();
    const newUpdatedAt = new Date();

    // Set both times to Bangladesh time (+6)
    [newExpiresAt, newUpdatedAt].forEach((date) => {
      date.setHours(date.getHours() + 6);
    });

    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + EXPIRATION_TIME);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        expiresAt: newExpiresAt,
        updatedAt: newUpdatedAt,
      },
    });

    const userResponse: UserResponse = {
      id: session.user.id,
      username: session.user.username,
      staffId: session.user.staffId,
      fullName: session.user.staff.fullName, // Get fullName from staff relation
      role: session.user.role,
    };

    const response = NextResponse.json({
      success: true,
      valid: true,
      user: userResponse,
    });

    // Update browser cookie expiration - Bangladesh time (+6)
    const cookieExpiry = new Date();
    cookieExpiry.setHours(cookieExpiry.getHours() + 6);
    cookieExpiry.setSeconds(cookieExpiry.getSeconds() + EXPIRATION_TIME);

    response.cookies.set({
      name: "session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: cookieExpiry,
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Session check error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error checking session",
      },
      { status: 500 }
    );
  }
}
