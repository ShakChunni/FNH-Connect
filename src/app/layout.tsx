import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import QueryClientProvider from "./QueryClientProvider";
import { AuthProvider } from "./AuthContext";
import { NotificationProvider } from "./NotificationProvider";
import MainContent from "./MainContent";
import { metadata } from "./metadata";
import PageTitle from "./PageTitle";
import Maintenance from "./Maintenance"; // <-- Import the new component

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const gotham = localFont({
  src: [
    {
      path: "../fonts/fonts-gotham/Gotham.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/fonts-gotham/Gotham_bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-gotham",
});

import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export { metadata };

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE === "true";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${gotham.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      <body className="font-sans">
        {MAINTENANCE_MODE ? (
          <Maintenance />
        ) : (
          <>
            <PageTitle />
            <QueryClientProvider>
              <AuthProvider>
                <NotificationProvider>
                  <MainContent>{children}</MainContent>
                </NotificationProvider>
              </AuthProvider>
            </QueryClientProvider>
          </>
        )}
      </body>
    </html>
  );
}
