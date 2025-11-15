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
    <div className="flex min-h-screen w-full bg-jd-porcelain lg:bg-jd-black">
      <Sidebar />
      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${desktopOffsetClass}`}
      >
        <div className="flex min-h-screen flex-1 flex-col px-0 pb-6 pt-20 sm:px-6 sm:pt-24 lg:px-3 lg:pt-3">
          <div className="relative flex w-full flex-1 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)]">
            <div className="relative flex flex-1 flex-col overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
