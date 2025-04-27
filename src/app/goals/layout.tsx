"use client";
import React from "react";
import Aside from "../components/Aside";
import Header from "./components/Header";
import useSidebarState from "@/app/hooks/useSidebarState";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isExpanded, setSidebarState } = useSidebarState();

  return (
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
  );
}
