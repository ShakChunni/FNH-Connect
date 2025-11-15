import {
  Home,
  User,
  CreditCard,
  Ticket,
  Receipt,
  BookText,
} from "lucide-react";
import { NavigationItem } from "./types";

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "My Profile",
    href: "/profile",
    icon: User,
  },
  {
    label: "Digital ID Card",
    href: "/id-card",
    icon: CreditCard,
  },
  {
    label: "My Vouchers",
    href: "/vouchers",
    icon: Ticket,
  },
  {
    label: "Purchase History",
    href: "/purchase-history",
    icon: Receipt,
  },
  {
    label: "Employee Playbook",
    href: "/playbook",
    icon: BookText,
  },
];
