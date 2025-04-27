import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET_KEY = process.env.SECRET_KEY as string;
const EXPIRATION_TIME = 60 * 60 * 24; // 1 day in seconds

interface UserResponse {
  id: number;
  username: string;
  fullName: string | null;
  role: string;
  manages: string[] | null;
  organizations: string[] | null;
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
        user: true,
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

    // Set both times to MYT (+8)
    [newExpiresAt, newUpdatedAt].forEach((date) => {
      date.setHours(date.getHours() + 8);
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
      fullName: session.user.fullName,
      role: session.user.role,
      manages: session.user.manages,
      organizations: session.user.organizations,
    };

    const response = NextResponse.json({
      success: true,
      valid: true,
      user: userResponse,
    });
    // Update browser cookie expiration
    const cookieExpiry = new Date();
    cookieExpiry.setHours(cookieExpiry.getHours() + 8); // Set to MYT
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
