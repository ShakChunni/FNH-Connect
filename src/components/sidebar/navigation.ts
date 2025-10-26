import { Home, Heart, Microscope, BarChart3, Users, LogIn } from "lucide-react";
import { NavigationItem } from "./types";
import type { UserRole } from "@/types/auth";

export const navigationItems: NavigationItem[] = [
  {
    label: "Home",
    href: "/home",
    icon: Home,
    roles: ["SysAdmin", "Admin", "Employee"], // Visible to all roles
  },
  {
    label: "Infertility",
    href: "/infertility",
    icon: Heart,
    roles: ["SysAdmin", "Admin", "Employee"], // Visible to all roles
  },
  {
    label: "Pathology",
    href: "/pathology",
    icon: Microscope,
    roles: ["SysAdmin", "Admin", "Employee"], // Visible to all roles
  },
  {
    label: "Admin Dashboard",
    href: "/admin-dashboard",
    icon: BarChart3,
    roles: ["SysAdmin", "Admin"], // Admin and SysAdmin only
  },
  {
    label: "User Management",
    href: "/admin/user-management",
    icon: Users,
    roles: ["SysAdmin"], // SysAdmin only
  },
  {
    label: "Activity Logs",
    href: "/admin/activity-logs",
    icon: LogIn,
    roles: ["SysAdmin", "Admin"], // SysAdmin and Admin only
  },
];

/**
 * Get navigation items visible to a specific role
 * @param role User's role
 * @returns Filtered navigation items based on role
 */
export const getVisibleNavigation = (role?: UserRole): NavigationItem[] => {
  if (!role) return [];

  return navigationItems.filter(
    (item) => item.roles && item.roles.includes(role)
  );
};

/**
 * Check if a route is accessible for a given role
 * @param route The route path to check
 * @param role User's role
 * @returns true if the route is accessible
 */
export const isRouteAccessible = (route: string, role?: UserRole): boolean => {
  if (!role) return false;

  const item = navigationItems.find((nav) => nav.href === route);
  return item?.roles?.includes(role) ?? false;
};
