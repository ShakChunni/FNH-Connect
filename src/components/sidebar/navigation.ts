import {
  Home,
  Baby,
  Microscope,
  Users,
  FileText,
  ClipboardList,
  Building2,
  Wallet,
  Pill,
} from "lucide-react";
import { NavigationItem } from "./types";
import {
  isAdminRole,
  isSystemAdminRole,
  isReceptionistRole,
  isPharmacistRole,
  isReceptionistInfertilityRole,
} from "@/lib/roles";
import type { PortalType } from "@/types/auth";

// Receptionist allowed routes for sidebar filtering
const RECEPTIONIST_SIDEBAR_ROUTES = [
  "/dashboard",
  "/general-admission",
  "/pathology",
  "/patient-records",
];

// Pharmacist allowed routes for sidebar filtering
const PHARMACIST_SIDEBAR_ROUTES = ["/medicine-inventory"];

// Infertility portal sidebar routes
const INFERTILITY_SIDEBAR_ROUTES = [
  "/infertility",
  "/infertility/cash-tracking",
];

// Full navigation items - will be filtered based on user role
export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "General Admission",
    href: "/general-admission",
    icon: Building2,
  },
  {
    label: "HSI Center",
    href: "/infertility",
    icon: Baby,
  },
  {
    label: "Pathology",
    href: "/pathology",
    icon: Microscope,
  },
  {
    label: "Medicine Inventory",
    href: "/medicine-inventory",
    icon: Pill,
  },
  {
    label: "Patient Records",
    href: "/patient-records",
    icon: ClipboardList,
    adminOnly: true,
  },
  {
    label: "Cash Tracking",
    href: "/admin/cash-tracking",
    icon: Wallet,
    adminOnly: true,
  },
  {
    label: "HSI Center Cash",
    href: "/admin/infertility-cash-tracking",
    icon: Wallet,
    adminOnly: true,
  },
  {
    label: "User Management",
    href: "/admin/user-management",
    icon: Users,
    adminOnly: true,
    systemAdminOnly: true,
  },
  {
    label: "Activity Logs",
    href: "/admin/activity-logs",
    icon: FileText,
    adminOnly: true,
  },
];

// Infertility-specific navigation items
export const infertilityNavigationItems: NavigationItem[] = [
  {
    label: "HSI Center Patients",
    href: "/infertility",
    icon: Baby,
  },
  {
    label: "Cash Tracking",
    href: "/infertility/cash-tracking",
    icon: Wallet,
  },
];

/**
 * Get navigation items filtered by user role and portal
 * Uses the existing roles.ts utility functions
 */
export function getNavigationItems(
  userRole?: string,
  portal?: PortalType | null
): NavigationItem[] {
  // Infertility portal: always show only infertility routes
  if (portal === "infertility") {
    // Admin/system-admin in infertility: see infertility items + shared admin items
    if (userRole && isAdminRole(userRole)) {
      const items: NavigationItem[] = [
        {
          label: "HSI Center Patients",
          href: "/infertility",
          icon: Baby,
        },
        {
          label: "HSI Center Cash",
          href: "/admin/infertility-cash-tracking",
          icon: Wallet,
        },
        {
          label: "Activity Logs",
          href: "/admin/activity-logs",
          icon: FileText,
        },
      ];

      if (userRole && isSystemAdminRole(userRole)) {
        items.push({
          label: "User Management",
          href: "/admin/user-management",
          icon: Users,
        });
      }

      return items;
    }
    // Receptionists (any type) in infertility: only infertility nav items
    return infertilityNavigationItems;
  }

  // ── GENERAL PORTAL ──
  // All general portal views exclude infertility-specific items

  if (!userRole) {
    return navigationItems.filter(
      (item) =>
        !item.adminOnly &&
        item.href !== "/infertility" &&
        item.href !== "/admin/infertility-cash-tracking"
    );
  }

  // Infertility-only receptionist should never reach general portal
  // (enforced by middleware); defensive fallback
  if (isReceptionistInfertilityRole(userRole)) {
    return navigationItems.filter(
      (item) =>
        !item.adminOnly && INFERTILITY_SIDEBAR_ROUTES.includes(item.href)
    );
  }

  // Regular receptionist in general portal
  if (isReceptionistRole(userRole)) {
    return navigationItems.filter(
      (item) =>
        (item.href === "/patient-records" || !item.adminOnly) &&
        RECEPTIONIST_SIDEBAR_ROUTES.includes(item.href)
    );
  }

  // Admin in general portal: all items except infertility-specific ones
  // User Management is further restricted to system-admin only
  if (isAdminRole(userRole)) {
    return navigationItems.filter(
      (item) =>
        item.href !== "/infertility" &&
        item.href !== "/admin/infertility-cash-tracking" &&
        !(item.systemAdminOnly && !isSystemAdminRole(userRole))
    );
  }

  // Pharmacist: strictly medicine inventory
  if (isPharmacistRole(userRole)) {
    return navigationItems.filter(
      (item) =>
        !item.adminOnly && PHARMACIST_SIDEBAR_ROUTES.includes(item.href)
    );
  }

  // Fallback: non-admin, non-receptionist, non-pharmacist (staff, etc.)
  return navigationItems.filter((item) => {
    if (item.adminOnly) return false;
    if (item.href === "/medicine-inventory") return false;
    if (item.href === "/infertility") return false;
    if (item.href === "/admin/infertility-cash-tracking") return false;
    return true;
  });
}
