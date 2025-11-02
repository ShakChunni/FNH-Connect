import type { AuthUser, UserRole } from "@/types/auth";

/**
 * Convert Prisma User with Staff to our AuthUser type
 * For use when both User and Staff records are available
 */
export function convertPrismaUserWithStaff(data: {
  id: number;
  username: string;
  staffId: number;
  role: string;
  isActive: boolean;
  staff?: {
    email: string | null;
    firstName: string;
    lastName: string;
    fullName: string;
    specialization: string | null;
  };
}): AuthUser {
  const staff = data.staff;

  return {
    id: data.id,
    staffId: data.staffId,
    username: data.username,
    email: staff?.email || "",
    firstName: staff?.firstName || "",
    lastName: staff?.lastName || "",
    fullName: staff?.fullName || "",
    role: data.role as UserRole,
    department: undefined,
    specialization: staff?.specialization ?? undefined,
    isActive: data.isActive,
  };
}

/**
 * Convert Prisma Staff to partial AuthUser
 * For use when only Staff record is available
 */
export function convertPrismaStaff(staff: {
  id: number;
  email: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  specialization: string | null;
  isActive: boolean;
}): Partial<AuthUser> {
  return {
    staffId: staff.id,
    email: staff.email || "",
    firstName: staff.firstName,
    lastName: staff.lastName,
    fullName: staff.fullName,
    specialization: staff.specialization ?? undefined,
    isActive: staff.isActive,
  };
}

/**
 * Type guard to check if user has admin access
 */
export function hasAdminAccess(role: UserRole): boolean {
  return role === "SysAdmin" || role === "Admin";
}

/**
 * Type guard to check if user has system admin access
 */
export function hasSysAdminAccess(role: UserRole): boolean {
  return role === "SysAdmin";
}
