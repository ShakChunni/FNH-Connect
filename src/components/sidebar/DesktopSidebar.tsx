"use client";

import { useEffect } from "react";
import useSidebarState from "@/hooks/useSidebarSate";
import DesktopSidebar from "./DesktopSidebar";
import MobileSidebar from "./MobileSidebar";

export default function Sidebar() {
  const { isExpanded, isPinned, setSidebarState, setPinnedState } =
    useSidebarState();

  // Sync expanded state when pinned changes
  useEffect(() => {
    if (isPinned) {
      setSidebarState(true);
    }
  }, [isPinned, setSidebarState]);

  return (
    <>
      <DesktopSidebar
        isExpanded={isExpanded}
        isPinned={isPinned}
        onExpandedChange={setSidebarState}
        onPinnedChange={setPinnedState}
      />
      <MobileSidebar />
    </>
  );
}
