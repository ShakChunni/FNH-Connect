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
} from "lucide-react";
import { NavigationItem } from "./types";
import { isAdminRole, isReceptionistRole } from "@/lib/roles";

// Receptionist allowed routes for sidebar filtering
const RECEPTIONIST_SIDEBAR_ROUTES = [
  "/dashboard",
  "/general-admission",
  "/pathology",
  "/patient-records",
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
    label: "Patient Records",
    href: "/patient-records",
    icon: ClipboardList,
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

  // Check if user is a receptionist - limited navigation
  if (isReceptionistRole(userRole)) {
    return navigationItems.filter(
      (item) =>
        !item.adminOnly && RECEPTIONIST_SIDEBAR_ROUTES.includes(item.href)
    );
  }

  // Use the existing isAdminRole function from roles.ts
  if (isAdminRole(userRole)) {
    return navigationItems;
  }

  return navigationItems.filter((item) => !item.adminOnly);
}
