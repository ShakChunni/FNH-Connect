import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  // Base robots configuration for all pages
  const baseRobots = {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  };

  switch (pathname) {
    case "/login":
      return {
        title: "Login | FNH Connect",
        description: "Login to access the FNH Connect Healthcare Portal",
        robots: baseRobots,
      };

    case "/register":
      return {
        title: "Register | FNH Connect",
        description: "Register for access to the FNH Connect Healthcare Portal",
        robots: baseRobots,
      };

    case "/home":
      return {
        title: "Dashboard | FNH Connect",
        description: "Dashboard for FNH Connect Healthcare Portal",
        robots: baseRobots,
      };

    case "/infertility":
      return {
        title: "Infertility | FNH Connect",
        description: "Infertility services and patient management",
        robots: baseRobots,
      };

    case "/pathology":
      return {
        title: "Pathology | FNH Connect",
        description: "Pathology services and test management",
        robots: baseRobots,
      };

    case "/admin-dashboard":
      return {
        title: "Admin Dashboard | FNH Connect",
        description: "Administrative dashboard for system management",
        robots: baseRobots,
      };

    case "/admin/user-management":
      return {
        title: "User Management | FNH Connect",
        description: "Manage user accounts and staff records",
        robots: baseRobots,
      };

    case "/admin/activity-logs":
      return {
        title: "Activity Logs | FNH Connect",
        description: "System activity logs and audit trail",
        robots: baseRobots,
      };

    default:
      return {
        title: "FNH Connect",
        description: "FNH Connect Healthcare Portal for staff and services",
        robots: baseRobots,
      };
  }
}
