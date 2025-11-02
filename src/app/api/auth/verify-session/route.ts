import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { SessionUser } from "@/types/auth";

const SECRET_KEY = process.env.SECRET_KEY as string;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables");
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "No active session",
        },
        { status: 401 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find session in database
      const session = await tx.session.findUnique({
        where: { token: sessionToken },
        include: {
          user: {
            include: {
              staff: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  role: true,
                  specialization: true,
                  email: true,
                  phoneNumber: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await tx.session.delete({
          where: { id: session.id },
        });
        throw new Error("Session expired");
      }

      // Verify JWT token
      try {
        jwt.verify(sessionToken, SECRET_KEY);
      } catch (error) {
        await tx.session.delete({
          where: { id: session.id },
        });
        throw new Error("Invalid session token");
      }

      // Check if user and staff are active
      if (!session.user.isActive) {
        await tx.session.delete({
          where: { id: session.id },
        });
        throw new Error("User account is inactive");
      }

      if (!session.user.staff.isActive) {
        await tx.session.delete({
          where: { id: session.id },
        });
        throw new Error("Staff account is inactive");
      }

      // Build session user response
      const sessionUser: SessionUser = {
        id: session.user.id,
        username: session.user.username,
        firstName: session.user.staff.firstName,
        lastName: session.user.staff.lastName,
        fullName: session.user.staff.fullName,
        role: session.user.staff.role, // Hospital role (Doctor, Nurse, etc.)
        systemRole: session.user.role, // System role (sysAdmin, staff, etc.)
        specialization: session.user.staff.specialization || undefined,
        email: session.user.staff.email || undefined,
        phoneNumber: session.user.staff.phoneNumber || undefined,
        isActive: session.user.isActive,
      };

      return {
        success: true,
        valid: true,
        user: sessionUser,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Session verification failed";

    console.error("Session verification error:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: message,
      },
      { status: 401 }
    );
  }
}
