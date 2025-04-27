import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  switch (pathname) {
    case "/login":
      return {
        title: "Login | Sales Reporting Dashboard",
        robots: {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      };
    case "/home":
      return {
        title: "Performance Overview | Sales Reporting Dashboard",
        robots: {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      };
    case "/admin":
      return {
        title: "Admin | Sales Reporting Dashboard",
        robots: {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      };
    case "/goals":
      return {
        title: "Goal Tracking | Sales Reporting Dashboard",
        robots: {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      };
    default:
      return {
        title: "Sales Reporting Dashboard",
        description: "Monthly Sales Performance Reporting System",
        robots: {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      };
  }
}
