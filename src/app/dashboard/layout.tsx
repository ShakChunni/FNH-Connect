"use client";
import React, { useState, useCallback, useEffect } from "react";
import Aside from "../components/Aside";
import Header from "./components/Header";
import { useAuth } from "@/app/AuthContext";
import useSidebarState from "@/app/hooks/useSidebarState";
import { TableSelectorProvider } from "@/app/context/TableSelectorContext";

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

  // FIXED: Prevent hydration mismatch by using client-side only state
  const [mounted, setMounted] = useState(false);
  const [tableSelectorValue, setTableSelectorValue] = useState("All");

  // Wait for client-side hydration
  useEffect(() => {
    setMounted(true);

    // Calculate table selector value only on client
    if (user?.role === "salesperson" || user?.role === "manager") {
      if (
        user.organizations?.includes("mavn") &&
        user.organizations?.includes("mi")
      ) {
        setTableSelectorValue("All");
      } else if (user.organizations?.includes("mavn")) {
        setTableSelectorValue("MAVN");
      } else if (user.organizations?.includes("mi")) {
        setTableSelectorValue("Moving Image");
      }
    } else {
      setTableSelectorValue("All");
    }
  }, [user]);

  const handleFilterUpdate = useCallback((value: string) => {
    setTableSelectorValue(value);
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent("tableFilterChange", { detail: value })
      );
    }
  }, []);

  const handleTableSelectorChange = useCallback((value: string) => {
    setTableSelectorValue(value);
  }, []);

  if (!mounted) {
    return null;
  }

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
          className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] lg:ml-20 ${
            isPinned ? "lg:ml-64" : ""
          }`}
        >
          <Header />
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </TableSelectorProvider>
  );
}
