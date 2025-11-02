import { Metadata } from "next";

const siteConfig = {
  name: "FNH Connect",
  title: "Hospital Management System",
  description:
    "Comprehensive hospital management system for patient care, admissions, pathology, and financial tracking",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  robots: {
    index: false,
    follow: false,
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
};
