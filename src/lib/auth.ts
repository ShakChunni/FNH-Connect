import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { isAdminRole, isSystemAdminRole, SystemRole } from "./roles";

const SECRET_KEY = process.env.SECRET_KEY as string;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY is not defined in environment variables");
}

export interface AuthenticatedUser {
  userId: number;
  staffId: number;
  username: string;
  systemRole: string;
}

/**
 * Extract and validate user session from request
 * @throws Error if session is invalid or user is inactive
 */
export async function getUserFromSession(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const sessionToken = request.cookies.get("session")?.value;

  if (!sessionToken) {
    throw new Error("Unauthorized - No session");
  }

  try {
    const decoded = jwt.verify(sessionToken, SECRET_KEY) as {
      userId: number;
      staffId: number;
      username: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { staff: true },
    });

    if (!user || !user.isActive || !user.staff.isActive) {
      throw new Error("Unauthorized - Invalid session");
    }

    return {
      userId: user.id,
      staffId: user.staff.id,
      username: user.username,
      systemRole: user.role,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      throw error;
    }
    throw new Error("Unauthorized - Invalid token");
  }
}

/**
 * Check if user has required system role
 */
export function hasRole(user: AuthenticatedUser, role: string): boolean {
  return user.systemRole === role;
}

/**
 * Check if user has admin privileges (system-admin or admin)
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return isAdminRole(user.systemRole);
}

/**
 * Check if user is system admin
 */
export function isSystemAdmin(user: AuthenticatedUser): boolean {
  return isSystemAdminRole(user.systemRole);
}

/**
 * Require admin access - throws error if user doesn't have admin privileges
 */
export function requireAdmin(user: AuthenticatedUser): void {
  if (!isAdmin(user)) {
    throw new Error("Admin access required");
  }
}

/**
 * Require system admin access - throws error if user doesn't have system admin privileges
 */
export function requireSystemAdmin(user: AuthenticatedUser): void {
  if (!isSystemAdmin(user)) {
    throw new Error("System admin access required");
  }
}
