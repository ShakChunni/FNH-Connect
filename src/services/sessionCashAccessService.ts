import { prisma } from "@/lib/prisma";
import {
  isAdminRole,
  isSystemAdminRole,
  normalizeRole,
  SystemRole,
} from "@/lib/roles";
import type { AuthenticatedUser } from "@/types/auth";

export interface SessionCashStaffOption {
  id: number;
  fullName: string;
  role: string;
}

export interface SessionCashStaffContext {
  canSelectStaff: boolean;
  selectedStaffId: number;
  selectedStaffName: string;
  staffOptions: SessionCashStaffOption[];
}

export function parseSessionCashStaffId(value: string | null): number | null {
  if (!value || value === "all") {
    return null;
  }

  const staffId = Number(value);

  if (!Number.isInteger(staffId) || staffId <= 0) {
    return null;
  }

  return staffId;
}

export async function getSessionCashStaffOptions(
  user: AuthenticatedUser,
): Promise<
  SessionCashStaffOption[]
> {
  const staff = await prisma.staff.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      role: true,
      user: {
        select: {
          role: true,
        },
      },
    },
    orderBy: {
      fullName: "asc",
    },
  });

  if (isSystemAdminRole(user.role)) {
    return staff.map((staffMember) => ({
      id: staffMember.id,
      fullName: staffMember.fullName,
      role: staffMember.role,
    }));
  }

  return staff
    .filter((staffMember) => {
      if (staffMember.id === user.staffId) {
        return true;
      }

      const staffRole = staffMember.role.toLowerCase();
      const systemRole = staffMember.user?.role
        ? normalizeRole(staffMember.user.role)
        : null;

      return (
        !staffRole.includes("admin") &&
        !staffRole.includes("doctor") &&
        systemRole !== SystemRole.ADMIN &&
        systemRole !== SystemRole.SYSTEM_ADMIN
      );
    })
    .map((staffMember) => ({
      id: staffMember.id,
      fullName: staffMember.fullName,
      role: staffMember.role,
    }));
}

export async function resolveSessionCashStaffContext(
  user: AuthenticatedUser,
  requestedStaffId: number | null,
): Promise<SessionCashStaffContext | null> {
  const canSelectStaff = isAdminRole(user.role);
  const staffOptions = canSelectStaff
    ? await getSessionCashStaffOptions(user)
    : [];

  const eligibleStaffIds = new Set(staffOptions.map((staff) => staff.id));
  const selectedStaffId = canSelectStaff
    ? requestedStaffId ??
      (eligibleStaffIds.has(user.staffId) ? user.staffId : staffOptions[0]?.id)
    : user.staffId;

  if (!selectedStaffId) {
    return null;
  }

  if (canSelectStaff && !eligibleStaffIds.has(selectedStaffId)) {
    return null;
  }

  const selectedStaff = await prisma.staff.findUnique({
    where: {
      id: selectedStaffId,
    },
    select: {
      id: true,
      fullName: true,
      role: true,
    },
  });

  if (!selectedStaff) {
    return null;
  }

  return {
    canSelectStaff,
    selectedStaffId: selectedStaff.id,
    selectedStaffName: selectedStaff.fullName,
    staffOptions,
  };
}
