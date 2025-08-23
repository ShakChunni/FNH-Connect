import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  switch (pathname) {
    case "/home":
      return {
        title: "Dashboard",
      };
    case "/infertility":
      return {
        title: "Infertility",
      };
    case "/pathology":
      return {
        title: "Pathology",
      };
    case "/admin-dashboard":
      return {
        title: "Admin Dashboard",
      };
    case "/admin/user-management":
      return {
        title: "User Management",
      };
    case "/admin/activity-logs":
      return {
        title: "Activity Logs",
      };
    default:
      return {
        title: "Dashboard",
        description: "Patient management dashboard",
      };
  }
}
