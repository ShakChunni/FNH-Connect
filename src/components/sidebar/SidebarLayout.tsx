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

  // Only pinning moves the content. Hover-expanding floats the sidebar over the
  // page, so the page doesn't slide sideways every time the mouse passes by.
  const desktopOffsetClass =
    isPinned && isExpanded
      ? "lg:ml-[var(--sidebar-expanded-width)]"
      : "lg:ml-[var(--sidebar-collapsed-width)]";

  return (
    <div className="flex min-h-screen w-full bg-fnh-navy-dark overflow-hidden">
      <Sidebar />
      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-standard ${desktopOffsetClass}`}
      >
        <div className="flex lg:px-4 min-h-screen min-w-0 flex-1 flex-col pb-0 pt-0 sm:pb-2 sm:pt-2 lg:pb-6 lg:pt-3 overflow-hidden">
          <div className="relative flex w-full min-w-0 flex-1 flex-col overflow-hidden sm:rounded-[2rem] lg:rounded-[3rem] bg-fnh-porcelain shadow-lg">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
