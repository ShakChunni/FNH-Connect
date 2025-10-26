import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";

const SECRET_KEY = process.env.SECRET_KEY as string;
const EXPIRATION_TIME = 60 * 60 * 24; // 1 day in seconds

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables");
}

// Input validation schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { username, password } = loginSchema.parse(body);

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
        isActive: true,
        staffId: true,
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
    });

    // Generic error message to prevent user enumeration
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please try again." },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been deactivated. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please try again." },
        { status: 401 }
      );
    }

    // Create JWT token
    const expiresAt = new Date(Date.now() + EXPIRATION_TIME * 1000);
    const token = jwt.sign(
      {
        id: user.id,
        staffId: user.staffId,
        username: user.username,
        email: user.staff.email,
        role: user.role,
      },
      SECRET_KEY,
      {
        expiresIn: EXPIRATION_TIME,
      }
    );

    // Create session in database
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        description: `User ${user.username} logged in`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        sessionId: session.id,
      },
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: EXPIRATION_TIME,
      path: "/",
    });

    // Build response user object
    const primaryDepartment =
      user.staff.departmentAssignments[0]?.department.name;

    const responseUser = {
      id: user.id,
      staffId: user.staffId,
      username: user.username,
      email: user.staff.email,
      firstName: user.staff.firstName,
      lastName: user.staff.lastName,
      fullName: user.staff.fullName,
      role: user.role,
      department: primaryDepartment,
      specialization: user.staff.specialization,
      isActive: user.isActive,
    };

    return NextResponse.json({
      success: true,
      user: responseUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during login. Please try again.",
      },
      { status: 500 }
    );
  }
}
