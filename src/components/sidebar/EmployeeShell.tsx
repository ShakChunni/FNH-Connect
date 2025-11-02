"use client";

import SidebarLayout from "./SidebarLayout";
import { Header } from "@/components/header";

interface EmployeeShellProps {
  title: string;
  children: React.ReactNode;
}

export default function EmployeeShell({ title, children }: EmployeeShellProps) {
  return (
    <SidebarLayout>
      <Header />
      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-3 sm:px-8 lg:px-12 lg:pb-8 lg:pt-4 w-full max-w-full overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl overflow-hidden">
          {children}
        </div>
      </main>
    </SidebarLayout>
  );
}
