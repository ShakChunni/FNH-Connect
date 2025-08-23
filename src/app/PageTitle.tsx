"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const titleMap: { [key: string]: string } = {
  "/home": "Dashboard",
  "/infertility": "Infertility",
  "/pathology": "Pathology",
  "/admin-dashboard": "Admin Dashboard",
  "/admin/user-management": "User Management",
  "/admin/activity-logs": "Activity Logs",
};

export default function PageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      document.title = titleMap[pathname] || "Dashboard";
    }
  }, [pathname]);

  return null;
}
