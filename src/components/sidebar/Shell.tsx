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
      <main className="flex-1 overflow-y-auto px-4 pb-10 pt-8 sm:px-8 lg:px-12 lg:pb-14 lg:pt-10">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </SidebarLayout>
  );
}
