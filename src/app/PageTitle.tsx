"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const titleMap: { [key: string]: string } = {
  "/login": "Sales Reporting Dashboard",
  "/Home": "Performance Overview",
  "/Admin": "Admin",
};

export default function PageTitle() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      document.title = titleMap[pathname] || "Sales Reporting Dashboard";
    }
  }, [pathname]);

  return null;
}
