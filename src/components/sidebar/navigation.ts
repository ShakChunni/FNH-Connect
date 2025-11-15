import { Home, Baby, Microscope, Shield, Users, FileText } from "lucide-react";
import { NavigationItem } from "./types";

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/home",
    icon: Home,
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
    label: "Admin Dashboard",
    href: "/admin-dashboard",
    icon: Shield,
  },
  {
    label: "User Management",
    href: "/admin/user-management",
    icon: Users,
  },
  {
    label: "Activity Logs",
    href: "/admin/activity-logs",
    icon: FileText,
  },
];
