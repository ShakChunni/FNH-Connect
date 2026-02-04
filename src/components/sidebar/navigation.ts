import {
  Home,
  Baby,
  Microscope,
  Shield,
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
  isReceptionistRole,
  isReceptionistInfertilityRole,
  isPharmacistRole,
} from "@/lib/roles";

// Receptionist allowed routes for sidebar filtering
// Note: patient-records is admin-only
const RECEPTIONIST_SIDEBAR_ROUTES = [
  "/dashboard",
  "/general-admission",
  "/pathology",
];

// Receptionist-infertility allowed routes (includes infertility)
const RECEPTIONIST_INFERTILITY_SIDEBAR_ROUTES = [
  ...RECEPTIONIST_SIDEBAR_ROUTES,
  "/infertility",
];

// Pharmacist allowed routes for sidebar filtering
const PHARMACIST_SIDEBAR_ROUTES = ["/medicine-inventory"];

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
    label: "Infertility",
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
    label: "Admin Dashboard",
    href: "/admin-dashboard",
    icon: Shield,
    adminOnly: true,
  },
  {
    label: "User Management",
    href: "/admin/user-management",
    icon: Users,
    adminOnly: true,
  },
  {
    label: "Activity Logs",
    href: "/admin/activity-logs",
    icon: FileText,
    adminOnly: true,
  },
];

/**
 * Get navigation items filtered by user role
 * Uses the existing roles.ts utility functions
 */
export function getNavigationItems(userRole?: string): NavigationItem[] {
  if (!userRole) {
    // No role means no session - only return non-admin items
    return navigationItems.filter((item) => !item.adminOnly);
  }

  // Check if user is a receptionist-infertility - limited navigation + infertility
  if (isReceptionistInfertilityRole(userRole)) {
    return navigationItems.filter(
      (item) =>
        !item.adminOnly &&
        RECEPTIONIST_INFERTILITY_SIDEBAR_ROUTES.includes(item.href),
    );
  }

  // Check if user is a regular receptionist - limited navigation
  if (isReceptionistRole(userRole)) {
    return navigationItems.filter(
      (item) =>
        !item.adminOnly && RECEPTIONIST_SIDEBAR_ROUTES.includes(item.href),
    );
  }

  // Use the existing isAdminRole function from roles.ts
  if (isAdminRole(userRole)) {
    return navigationItems;
  }

  // Check if user is a pharmacist - strictly medicine inventory
  if (isPharmacistRole(userRole)) {
    return navigationItems.filter(
      (item) =>
        !item.adminOnly && PHARMACIST_SIDEBAR_ROUTES.includes(item.href),
    );
  }

  return navigationItems.filter((item) => {
    if (item.adminOnly) return false;
    // Medicine inventory is special - only for admins and pharmacists
    if (item.href === "/medicine-inventory") return false;
    return true;
  });
}
