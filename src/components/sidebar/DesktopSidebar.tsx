"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Pin, Settings } from "lucide-react";
import { navigationItems, getVisibleNavigation } from "./navigation";
import { SidebarProps } from "./types";
import Image from "next/image";
import { useAuth } from "@/app/AuthContext";
import ViewSwitcher from "./ViewSwitcher";

const SIDEBAR_BG = "#F5F5F5"; // FNH Porcelain
const CONTAINER_BG = "#FFFFFF"; // FNH White

interface UserProfileSectionProps {
  user: {
    email: string;
    role: string;
    staffId: number;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  isExpanded: boolean;
  initials: string;
  displayName: string;
  onLogout: () => void;
}

function UserProfileSection({
  user,
  isExpanded,
  initials,
  displayName,
  onLogout,
}: UserProfileSectionProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative mt-auto" ref={profileRef}>
      {/* ViewSwitcher Dropdown */}
      <ViewSwitcher
        userRole={user.role}
        isExpanded={isExpanded}
        isOpen={isDropdownOpen}
        onToggle={setIsDropdownOpen}
        onLogout={onLogout}
        parentRef={profileRef}
      />

      <div
        className="px-4 py-3 border-t border-fnh-grey-light"
        style={{ background: CONTAINER_BG }}
      >
        <div
          className={`flex items-center transition-opacity hover:opacity-80 cursor-pointer ${
            isExpanded ? "gap-3" : "justify-center"
          }`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex h-12 w-12 min-w-[3rem] items-center justify-center bg-fnh-blue/10 text-base font-semibold text-fnh-navy flex-shrink-0">
            {initials}
          </div>
          {isExpanded && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-fnh-navy">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-fnh-grey">
                  @{user.staffId}
                </p>
              </div>
              <button
                type="button"
                className="ml-auto inline-flex h-8 w-8 flex-shrink-0 items-center justify-center text-fnh-grey transition-all duration-200 hover:text-fnh-navy hover:cursor-pointer"
                aria-label="View switcher"
              >
                <Settings className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DesktopSidebar({
  isExpanded,
  isPinned,
  onExpandedChange,
  onPinnedChange,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initials = useMemo(() => {
    if (!user) return "";
    const first = user.firstName?.charAt(0) ?? "";
    const last = user.lastName?.charAt(0) ?? "";
    return `${first}${last}`.toUpperCase();
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.fullName || `${user.firstName} ${user.lastName}`;
  }, [user]);

  useEffect(() => {
    return () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    onExpandedChange(true);
  }, [onExpandedChange]);

  const handleMouseLeave = useCallback(() => {
    if (!isPinned) {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      collapseTimeoutRef.current = setTimeout(() => {
        if (!isPinned) {
          onExpandedChange(false);
        }
      }, 100);
    }
  }, [isPinned, onExpandedChange]);

  const handlePinToggle = useCallback(() => {
    onPinnedChange(!isPinned);
  }, [isPinned, onPinnedChange]);

  const labelAnimationClass = isExpanded
    ? "max-w-[14rem] opacity-100 translate-x-0"
    : "max-w-0 opacity-0 -translate-x-3";

  return (
    <aside
      className={`hidden lg:flex fixed top-0 left-0 h-screen flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        isExpanded
          ? "w-[var(--sidebar-expanded-width)]"
          : "w-[var(--sidebar-collapsed-width)]"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: SIDEBAR_BG,
        zIndex: isPinned ? 70 : 60,
        borderRight: "1px solid #E8EAEF",
      }}
    >
      <div
        className={`flex flex-1 flex-col gap-5 pb-6 pt-3 text-fnh-navy transition-all duration-300 ${
          isExpanded ? "px-2" : "px-4"
        }`}
      >
        {/* First Container: Logo, Text, Pin Button, and Navigation */}
        <div
          className="p-4 border-b border-fnh-grey-light"
          style={{ background: CONTAINER_BG }}
        >
          <div
            className={`flex items-start gap-3 mb-3 ${
              isExpanded ? "justify-between" : "justify-center"
            }`}
          >
            {!isExpanded ? (
              <Image
                src="/FNH-LOGO.svg"
                alt="FNH Connect"
                width={40}
                height={40}
                className="h-10 w-10 flex-shrink-0"
                priority
              />
            ) : (
              <>
                <Link
                  href="/home"
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Image
                    src="/FNH-LOGO.svg"
                    alt="FNH Connect"
                    width={40}
                    height={40}
                    className="h-10 w-10 flex-shrink-0"
                    priority
                  />
                  <div className="flex items-center gap-1 leading-tight min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-fnh-navy whitespace-nowrap">
                      FNH
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-fnh-blue whitespace-nowrap">
                      Connect
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handlePinToggle}
                  className="inline-flex h-6 w-6 items-center justify-center text-fnh-grey transition-all duration-200 hover:text-fnh-navy hover:cursor-pointer flex-shrink-0"
                  title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                  aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                >
                  <Pin
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isPinned ? "rotate-45 text-fnh-navy" : ""
                    }`}
                  />
                </button>
              </>
            )}
          </div>

          {/* Navigation inside first container */}
          <nav className="overflow-y-auto">
            <ul className="space-y-2">
              {getVisibleNavigation(user?.role).map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                        isActive
                          ? isExpanded
                            ? "bg-fnh-blue/10 text-fnh-navy border-l-4 border-fnh-blue pl-2"
                            : "bg-fnh-blue/10 text-fnh-navy"
                          : "text-fnh-grey hover:bg-fnh-grey-light hover:text-fnh-navy"
                      } ${isExpanded ? "gap-3" : "justify-center"}`}
                    >
                      <span
                        className={`flex h-9 w-9 min-w-[2.25rem] flex-shrink-0 items-center justify-center transition-all duration-200 ${
                          isActive
                            ? "text-fnh-blue"
                            : "text-fnh-grey group-hover:text-fnh-navy"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      {isExpanded && (
                        <span className="overflow-hidden whitespace-nowrap text-sm font-medium">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Third Container: User Info - separate at bottom */}
        {user && (
          <UserProfileSection
            user={user}
            isExpanded={isExpanded}
            initials={initials}
            displayName={displayName}
            onLogout={logout}
          />
        )}
      </div>
    </aside>
  );
}
