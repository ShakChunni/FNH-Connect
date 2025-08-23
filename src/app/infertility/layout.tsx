"use client";
import React, { useState, useCallback } from "react";
import Aside from "../components/Aside";
import Header from "./components/Header";
import { useAuth } from "@/app/AuthContext";
import useSidebarState from "@/app/hooks/useSidebarState";
import { TableSelectorProvider } from "@/app/context/TableSelectorContext";
import { useMediaQuery } from "react-responsive";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    isExpanded,
    isPinned,
    isAnimating,
    expandedSections,
    setSidebarState,
    setPinnedState,
    toggleSection,
  } = useSidebarState();
  const { user } = useAuth();

  const handleFilterUpdate = useCallback((value: string) => {
    setTableSelectorValue(value);
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent("tableFilterChange", { detail: value })
      );
    }
  }, []);

  const [tableSelectorValue, setTableSelectorValue] = useState(() => {
    if (user?.role === "salesperson" || user?.role === "manager") {
      if (
        user.organizations?.includes("mavn") &&
        user.organizations?.includes("mi")
      ) {
        return "All";
      } else if (user.organizations?.includes("mavn")) {
        return "MAVN";
      } else if (user.organizations?.includes("mi")) {
        return "Moving Image";
      }
    }
    return "All";
  });

  const handleTableSelectorChange = useCallback((value: string) => {
    setTableSelectorValue(value);
  }, []);
  const isLargeScreen = useMediaQuery({ minWidth: 1024 });

  return (
    <TableSelectorProvider
      value={tableSelectorValue}
      onChange={handleTableSelectorChange}
      onFilterUpdate={handleFilterUpdate}
    >
      <div className="flex min-h-screen w-full bg-[#f6f9fd]">
        <Aside
          isExpanded={isExpanded}
          setIsExpanded={setSidebarState}
          isPinned={isPinned}
          setPinnedState={setPinnedState}
          isAnimating={isAnimating}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        />
        <div
          className="flex flex-col flex-1 min-w-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{
            marginLeft: isLargeScreen ? (isPinned ? "16rem" : "5rem") : "0rem",
          }}
        >
          <Header />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </TableSelectorProvider>
  );
}
