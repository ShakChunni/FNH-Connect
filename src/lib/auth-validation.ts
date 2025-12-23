import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { SessionUser } from "@/types/auth";
import { isAdminRole } from "@/lib/roles";

const SECRET_KEY = process.env.SECRET_KEY as string;

// Just in case, though usually this is handled by env validation on start
if (!SECRET_KEY) {
  console.warn("SECRET_KEY is not defined in environment variables");
}

/**
 * Server-side session validation utility
 *
 * Use this in any Server Component layout to validate sessions
 * before rendering protected pages.
 *
 * @returns User session data if valid, redirects to /login if invalid
 */
export async function validateServerSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  // No session cookie? Redirect to login
  if (!sessionToken) {
    redirect("/login");
  }

  try {
    // Verify JWT token signature and expiration
    if (SECRET_KEY) {
      jwt.verify(sessionToken, SECRET_KEY);
    }

    // Check session exists and is valid in database
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: {
            staff: true, // Fetch related staff details
          },
        },
      },
    });

    // Session not found in database or user missing
    if (!session || !session.user || !session.user.staff) {
      redirect("/login");
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.session.delete({
        where: { id: session.id },
      });
      redirect("/login");
    }

    // Check user status
    if (!session.user.isActive) {
      redirect("/login");
    }

    // Check staff status
    if (!session.user.staff.isActive) {
      redirect("/login");
    }

    // Map to SessionUser type
    const user: SessionUser = {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      isActive: session.user.isActive,
      staffId: session.user.staffId,
      firstName: session.user.staff.firstName,
      lastName: session.user.staff.lastName,
      fullName: session.user.staff.fullName,
      staffRole: session.user.staff.role,
      specialization: session.user.staff.specialization || undefined,
      email: session.user.staff.email || undefined,
      phoneNumber: session.user.staff.phoneNumber || undefined,
      photoUrl: session.user.staff.photoUrl || undefined,
    };

    // Return user data for use in layout
    return {
      user,
      session: session,
    };
  } catch (error) {
    // JWT verification failed or database error
    console.error("[Auth Validation] Error:", error);
    redirect("/login");
  }
}

/**
 * Validate admin access - redirects to /dashboard if not admin
 */
export async function validateAdminAccess() {
  const { user } = await validateServerSession();

  // Check based on User system role using centralized roles utility
  if (!isAdminRole(user.role)) {
    redirect("/dashboard");
  }

  return { user };
}

/**
 * API-side session validation utility
 *
 * Use this in API routes to validate sessions without redirects.
 * Returns the authenticated user data or null if invalid.
 *
 * @returns User data if valid, null if invalid
 */
export async function getAuthenticatedUserForAPI() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  // No session cookie? Return null
  if (!sessionToken) {
    return null;
  }

  try {
    // Verify JWT token signature and expiration
    if (SECRET_KEY) {
      jwt.verify(sessionToken, SECRET_KEY);
    }

    // Check session exists and is valid in database
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: {
            staff: true,
          },
        },
      },
    });

    // Session not found in database
    if (!session || !session.user || !session.user.staff) {
      return null;
    }

    // Check if session has expired (cleanup handled by cron or login usually, but check here too)
    if (session.expiresAt < new Date()) {
      // Optional: delete expired session async
      await prisma.session
        .delete({
          where: { id: session.id },
        })
        .catch(console.error);
      return null;
    }

    // Check user status
    if (!session.user.isActive) {
      return null;
    }

    // Check staff status
    if (!session.user.staff.isActive) {
      return null;
    }

    // Map to SessionUser type
    const user: SessionUser = {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
      isActive: session.user.isActive,
      staffId: session.user.staffId,
      firstName: session.user.staff.firstName,
      lastName: session.user.staff.lastName,
      fullName: session.user.staff.fullName,
      staffRole: session.user.staff.role,
      specialization: session.user.staff.specialization || undefined,
      email: session.user.staff.email || undefined,
      phoneNumber: session.user.staff.phoneNumber || undefined,
      photoUrl: session.user.staff.photoUrl || undefined,
    };

    // Return user data
    return user;
  } catch (error) {
    // JWT verification failed or database error
    console.error("[API Auth Validation] Error:", error);
    return null;
  }
}
