import { Metadata } from "next";

const siteConfig = {
  title: "Sales Reporting Dashboard",
  description: "Sales performance reporting and analytics dashboard",
};

export const getMetadata = (path: string): Metadata => {
  const titleMap: { [key: string]: string } = {
    "/login": siteConfig.title,
    "/home": "Performance Overview",
    "/admin": "Admin Dashboard",
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
