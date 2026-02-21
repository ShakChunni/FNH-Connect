"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const titleMap: { [key: string]: string } = {
  "/dashboard": "Dashboard",
  "/patient-records": "Patient Records",
  "/general-admission": "General Admission",
  "/infertility": "Infertility",
  "/pathology": "Pathology",
  "/medicine-inventory": "Medicine Inventory",
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
