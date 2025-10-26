import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET_KEY = process.env.SECRET_KEY as string;
const EXPIRATION_TIME = 60 * 60 * 24; // 1 day in seconds
const REFRESH_THRESHOLD = 60 * 60 * 2; // Refresh token when 2 hours left
const MAX_SESSION_LIFETIME = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables");
}

function clearSessionCookie(response: NextResponse) {
  const cookieStore = response.cookies;
  cookieStore.delete("session");
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      const response = NextResponse.json(
        { success: false, valid: false, message: "No session token" },
        { status: 401 }
      );
      return clearSessionCookie(response);
    }

    // Atomic session validation and potential refresh
    const result = await prisma.$transaction(async (tx) => {
      // First check if session exists in database
      const session = await tx.session.findUnique({
        where: { token: sessionToken },
        include: {
          user: {
            select: {
              id: true,
              staffId: true,
              username: true,
              role: true,
              isActive: true,
              staff: {
                select: {
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  email: true,
                  specialization: true,
                  departmentAssignments: {
                    where: { isPrimary: true },
                    select: {
                      department: {
                        select: {
                          name: true,
                        },
                      },
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (!session) {
        return { valid: false, reason: "session_not_found" };
      }

      // Check if session has exceeded maximum lifetime (7 days)
      const now = new Date();
      const sessionAge = now.getTime() - session.createdAt.getTime();

      if (sessionAge > MAX_SESSION_LIFETIME) {
        // Session is too old, force re-authentication
        await tx.session.delete({
          where: { id: session.id },
        });
        return { valid: false, reason: "max_lifetime_exceeded" };
      }

      // Check if database session is expired
      if (session.expiresAt < now) {
        // Clean up expired session
        await tx.session.delete({
          where: { id: session.id },
        });
        return { valid: false, reason: "session_expired" };
      }

      // Verify JWT token
      let jwtPayload;
      try {
        jwtPayload = jwt.verify(sessionToken, SECRET_KEY) as any;
      } catch (jwtError) {
        console.log("JWT verification failed:", jwtError);
        // JWT is invalid/expired, clean up database session
        await tx.session.delete({
          where: { id: session.id },
        });
        return { valid: false, reason: "jwt_invalid" };
      }

      // Check if user still exists and is active
      if (!session.user || !session.user.isActive) {
        await tx.session.delete({
          where: { id: session.id },
        });
        return {
          valid: false,
          reason: session.user ? "user_inactive" : "user_not_found",
        };
      }

      // Check if token needs refresh (less than REFRESH_THRESHOLD seconds left)
      const timeLeft = Math.floor(
        (session.expiresAt.getTime() - now.getTime()) / 1000
      );

      if (timeLeft < REFRESH_THRESHOLD) {
        // Refresh the token
        const newExpiresAt = new Date(now.getTime() + EXPIRATION_TIME * 1000);

        const newToken = jwt.sign(
          {
            id: session.user.id,
            staffId: session.user.staffId,
            username: session.user.username,
            email: session.user.staff.email,
            role: session.user.role,
          },
          SECRET_KEY,
          {
            expiresIn: EXPIRATION_TIME,
          }
        );

        // Update session in database
        await tx.session.update({
          where: { id: session.id },
          data: {
            token: newToken,
            expiresAt: newExpiresAt,
            updatedAt: new Date(),
          },
        });

        return {
          valid: true,
          user: session.user,
          refreshed: true,
          newToken,
        };
      }

      return {
        valid: true,
        user: session.user,
        refreshed: false,
      };
    });

    // Handle invalid sessions
    if (!result.valid || !result.user) {
      const response = NextResponse.json(
        {
          success: false,
          valid: false,
          message: `Session invalid: ${result.reason}`,
        },
        { status: 401 }
      );
      return clearSessionCookie(response);
    }

    // Extract primary department
    const primaryDepartment =
      result.user.staff.departmentAssignments[0]?.department.name;

    // Build successful response
    const response = NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: result.user.id,
        staffId: result.user.staffId,
        username: result.user.username,
        email: result.user.staff.email,
        firstName: result.user.staff.firstName,
        lastName: result.user.staff.lastName,
        fullName: result.user.staff.fullName,
        role: result.user.role,
        department: primaryDepartment,
        specialization: result.user.staff.specialization,
        isActive: result.user.isActive,
      },
    });

    // If token was refreshed, update cookie
    if (result.refreshed && result.newToken) {
      response.cookies.set("session", result.newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: EXPIRATION_TIME,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Session verification error:", error);
    const response = NextResponse.json(
      { success: false, valid: false, message: "Internal server error" },
      { status: 500 }
    );
    return clearSessionCookie(response);
  }
}
