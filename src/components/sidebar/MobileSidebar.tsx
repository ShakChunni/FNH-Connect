"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Settings } from "lucide-react";
import Image from "next/image";
import { navigationItems, getVisibleNavigation } from "./navigation";
import { useAuth } from "@/app/AuthContext";
import ViewSwitcher from "./ViewSwitcher";

const SIDEBAR_BG = "#F5F5F5"; // FNH Porcelain
const CONTAINER_BG = "#FFFFFF"; // FNH White

const formatRoleLabel = (role?: string) => {
  if (!role) return "Employee";
  return role
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  const initials = useMemo(() => {
    if (!user) return "";
    const first = user.firstName?.charAt(0) ?? "";
    const last = user.lastName?.charAt(0) ?? "";
    const value = `${first}${last}`.toUpperCase();
    return value || "JD";
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.fullName || `${user.firstName} ${user.lastName}`;
  }, [user]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === overlayRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    handleClose();
  }, [pathname, handleClose]);

  return (
    <>
      <header
        className={`lg:hidden fixed top-0 left-0 right-0 z-40 flex h-20 items-center gap-4 px-5 text-fnh-navy shadow-sm transition-all duration-300 border-b border-fnh-grey-light ${
          isOpen ? "bg-fnh-navy/90 backdrop-blur-sm" : "bg-fnh-white/95"
        }`}
      >
        <button
          onClick={handleToggle}
          className={`inline-flex h-12 w-12 items-center justify-center transition-colors ${
            isOpen
              ? "text-fnh-white hover:text-fnh-grey"
              : "text-fnh-navy hover:text-fnh-blue"
          }`}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/home" className="flex flex-1 flex-col">
          <span
            className={`text-sm font-semibold transition-colors ${
              isOpen ? "text-fnh-white" : "text-fnh-navy"
            }`}
          >
            FNH Connect Healthcare Portal
          </span>
        </Link>
      </header>

      {isOpen && (
        <div
          ref={overlayRef}
          className="lg:hidden fixed left-0 right-0 bottom-0 top-0 z-30 bg-fnh-navy/50"
          onClick={handleOverlayClick}
        />
      )}

      <aside
        className={`lg:hidden fixed left-0 top-0 z-40 h-dvh w-[18rem] transform shadow-[0_24px_60px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: SIDEBAR_BG }}
      >
        <nav className="flex h-full flex-col gap-3 px-3 pb-4 pt-4 overflow-y-auto">
          {/* First Container: Logo, Text, and Navigation */}
          <div
            className="p-3 flex-shrink-0 border-b border-fnh-grey-light"
            style={{ background: CONTAINER_BG }}
          >
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <div className="flex items-center gap-2">
                <Image
                  src="/FNH-LOGO.svg"
                  alt="FNH Connect"
                  width={32}
                  height={32}
                  className="h-8 w-8 flex-shrink-0"
                />
                <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-fnh-navy leading-tight">
                  FNH <span className="text-fnh-blue">CONNECT</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="inline-flex h-8 w-8 items-center justify-center text-fnh-grey transition-colors hover:text-fnh-navy flex-shrink-0"
                aria-label="Close navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
            {/* Navigation inside first container */}
            <ul className="space-y-1">
              {getVisibleNavigation(user?.role).map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleClose}
                      className={`group flex items-center px-2 py-2 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                        isActive
                          ? "bg-fnh-blue/10 text-fnh-navy border-l-4 border-fnh-blue pl-0"
                          : "text-fnh-grey hover:bg-fnh-grey-light hover:text-fnh-navy"
                      } gap-2`}
                    >
                      <span
                        className={`flex h-7 w-7 min-w-[1.75rem] flex-shrink-0 items-center justify-center transition-all duration-200 ${
                          isActive
                            ? "text-fnh-blue"
                            : "text-fnh-grey group-hover:text-fnh-navy"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Third Container: User Info - separate at bottom */}
          {user && (
            <div className="relative mt-auto flex-shrink-0" ref={profileRef}>
              {/* ViewSwitcher Dropdown */}
              <ViewSwitcher
                userRole={user.role}
                isExpanded={true}
                isOpen={isDropdownOpen}
                onToggle={setIsDropdownOpen}
                onLogout={logout}
                parentRef={profileRef}
              />

              <div
                className="px-3 py-2 border-t border-fnh-grey-light"
                style={{ background: CONTAINER_BG }}
              >
                <div
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="flex h-9 w-9 min-w-[2.25rem] items-center justify-center bg-fnh-blue/10 text-sm font-semibold text-fnh-navy flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-fnh-navy">
                      {displayName}
                    </p>
                    <p className="truncate text-[10px] text-fnh-grey">
                      @{user.staffId}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ml-auto inline-flex h-7 w-7 flex-shrink-0 items-center justify-center text-fnh-grey transition-all duration-200 hover:text-fnh-navy"
                    aria-label="View switcher"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
