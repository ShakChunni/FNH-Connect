import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { Inter } from "next/font/google";
import "./globals.css";
import "./theme-config.css";
import QueryClientProvider from "./QueryClientProvider";
import { AuthProvider } from "./AuthContext";
import MainContent from "./MainContent";
import { metadata } from "./metadata";
import PageTitle from "./PageTitle";
import { initializeServer } from "@/lib/server-init";
import Maintenance from "./Maintenance";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Initialize server tasks in production and development
if (
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "development"
) {
  initializeServer();
}

export { metadata };

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE === "true";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      <body>
        {MAINTENANCE_MODE ? (
          <Maintenance />
        ) : (
          <>
            <PageTitle />
            <QueryClientProvider>
              <Theme accentColor="blue" radius="large">
                <AuthProvider>
                  <MainContent>{children}</MainContent>
                </AuthProvider>
              </Theme>
            </QueryClientProvider>
          </>
        )}
      </body>
    </html>
  );
}
