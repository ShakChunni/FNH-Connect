import { Metadata } from "next";

const siteConfig = {
  title: "Dashboard",
  description: "Patient and pathology management dashboard",
};

export const getMetadata = (path: string): Metadata => {
  const titleMap: { [key: string]: string } = {
    "/home": "Dashboard",
    "/infertility": "Infertility",
    "/pathology": "Pathology",
    "/admin-dashboard": "Admin Dashboard",
    "/admin/user-management": "User Management",
    "/admin/activity-logs": "Activity Logs",
  };

  return {
    title: titleMap[path] || siteConfig.title,
    description: siteConfig.description,
  };
};

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
};
