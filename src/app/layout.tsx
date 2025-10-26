import { Inter } from "next/font/google";
import "./globals.css";
import QueryClientProvider from "./QueryClientProvider";
import { AuthProvider } from "./AuthContext";
import { NotificationProvider } from "./NotificationProvider";
import MainContent from "./MainContent";
import { metadata } from "./metadata";
import PageTitle from "./PageTitle";
import { initializeServer } from "@/lib/server-init";
import Maintenance from "./Maintenance";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export { metadata };

// Initialize server tasks ONCE using global singleton pattern
// This prevents re-initialization on hot reloads and layout re-renders
if (typeof window === "undefined") {
  // Only run on server-side
  const globalForInit = globalThis as unknown as {
    serverInitialized?: boolean;
  };

  if (!globalForInit.serverInitialized) {
    initializeServer();
    globalForInit.serverInitialized = true;
  }
}

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
