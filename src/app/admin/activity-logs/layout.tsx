"use client";
import React, { useState, useCallback } from "react";
import Aside from "@/app/components/Aside";
import Header from "./components/Header";
import { useAuth } from "@/app/AuthContext";
import useSidebarState from "@/app/hooks/useSidebarState";
import { TableSelectorProvider } from "@/app/context/TableSelectorContext";

export default function AppLayout({
  children,
}: Readonly<{
  
  children: React.ReactNode;
}>) {
  const { isExpanded, setSidebarState } = useSidebarState();
  const { user } = useAuth();

  const handleFilterUpdate = useCallback((value: string) => {
    setTableSelectorValue(value);
    // This will trigger the data refetch
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

  // Handle table selector changes
  const handleTableSelectorChange = useCallback((value: string) => {
    setTableSelectorValue(value);
  }, []);

  return (
    <TableSelectorProvider
      value={tableSelectorValue}
      onChange={handleTableSelectorChange}
      onFilterUpdate={handleFilterUpdate}
    >
      <div className="flex h-screen w-full overflow-hidden bg-[#E3E6EB]">
        <Aside isExpanded={isExpanded} setIsExpanded={setSidebarState} />
        <div
          className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
            isExpanded ? "lg:ml-64" : "lg:ml-16"
          }`}
        >
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TableSelectorProvider>
  );
}
