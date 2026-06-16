"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const titleMap: { [key: string]: string } = {
  "/dashboard": "Dashboard",
  "/patient-records": "Patient Records",
  "/general-admission": "General Admission",
  "/infertility": "HSI Center",
  "/pathology": "Pathology",
  "/medicine-inventory": "Medicine Inventory",
  "/profile": "Profile",
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
