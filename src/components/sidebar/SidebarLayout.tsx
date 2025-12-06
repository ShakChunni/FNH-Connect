"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import useSidebarState, { SidebarStateProvider } from "@/hooks/useSidebarSate";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarStateProvider>
      <SidebarLayoutContent>{children}</SidebarLayoutContent>
    </SidebarStateProvider>
  );
}

function SidebarLayoutContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isPinned } = useSidebarState();

  // Calculate layout class - now we're guaranteed to have the real state from localStorage
  const desktopOffsetClass =
    isPinned || isExpanded
      ? "lg:ml-[var(--sidebar-expanded-width)]"
      : "lg:ml-[var(--sidebar-collapsed-width)]";

  return (
    <div className="flex min-h-screen w-full bg-fnh-navy-dark overflow-hidden">
      <Sidebar />
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${desktopOffsetClass}`}
      >
        <div className="flex min-h-screen min-w-0 flex-1 flex-col px-0 pb-0 pt-0 sm:px-2 sm:pb-2 sm:pt-2 lg:px-4 lg:pb-6 lg:pt-3 overflow-hidden">
          <div className="relative flex w-full min-w-0 flex-1 flex-col overflow-hidden sm:rounded-[2rem] lg:rounded-[2.5rem] bg-fnh-porcelain shadow-lg">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
