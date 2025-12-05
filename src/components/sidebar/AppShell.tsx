"use client";

import SidebarLayout from "./SidebarLayout";
import { Header } from "@/components/header";

interface AppShellProps {
  title: string;
  children: React.ReactNode;
}

export default function AppShell({ title, children }: AppShellProps) {
  return (
    <SidebarLayout>
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 pb-8 pt-6 lg:px-8 lg:pb-10 lg:pt-8 w-full max-w-full overflow-x-hidden min-w-0">
          <div className="mx-auto w-full max-w-[1400px] overflow-hidden min-w-0">
            {children}
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
}
