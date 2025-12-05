"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Pin, Settings } from "lucide-react";
import { navigationItems } from "./navigation";
import { SidebarProps } from "./types";
import Image from "next/image";
import { useAuth } from "@/app/AuthContext";
import ViewSwitcher from "./ViewSwitcher";

const SIDEBAR_BG = "#0f172a"; // FNH Black
const CONTAINER_BG = "#1e293b"; // FNH Navy - slightly lighter slate 800
const ACTIVE_BG = "#334155"; // FNH Navy Light - slate 700 for active items
const HOVER_BG = "rgba(59, 130, 246, 0.1)"; // Blue with opacity for hover
const ACTIVE_INDICATOR = "#fbbf24"; // Yellow accent for active border

interface UserProfileSectionProps {
  user: {
    email?: string;
    role: string;
    employeeId?: string;
    firstName?: string;
    lastName?: string;
    preferredName?: string;
    photoUrl?: string;
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
        className="rounded-3xl px-4 py-3"
        style={{ background: CONTAINER_BG }}
      >
        <div
          className={`flex items-center transition-opacity hover:opacity-80 cursor-pointer ${
            isExpanded ? "gap-3" : "justify-center"
          }`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex h-12 w-12 min-w-[3rem] items-center justify-center rounded-full bg-white/15 text-base font-semibold text-white flex-shrink-0 overflow-hidden">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {isExpanded && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-white">
                  {displayName}
                </p>
              </div>
              <button
                type="button"
                className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center text-white/40 transition-all duration-200 hover:text-white hover:cursor-pointer"
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
      className={`hidden lg:flex fixed top-0 left-0 h-screen flex-col overflow-hidden rounded-3xl transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        isExpanded
          ? "w-[var(--sidebar-expanded-width)]"
          : "w-[var(--sidebar-collapsed-width)]"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: SIDEBAR_BG,
        zIndex: isPinned ? 70 : 60,
      }}
    >
      <div
        className={`flex flex-1 flex-col gap-5 pb-6 pt-3 text-white transition-all duration-300 ${
          isExpanded ? "px-2" : "px-4"
        }`}
      >
        {/* First Container: Logo, Text, Pin Button, and Navigation */}
        {/* First Container: Logo, Text, Pin Button, and Navigation */}
        <div
          className="relative rounded-3xl p-4 overflow-hidden"
          style={{ background: CONTAINER_BG }}
        >
          <div
            className={`flex items-start gap-3 mb-3 relative z-10 ${
              isExpanded ? "justify-between" : "justify-center"
            }`}
          >
            {!isExpanded ? (
              <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
                <Image
                  src="/fnh-logo.svg"
                  alt="FNH Healthcare"
                  width={40}
                  height={40}
                  className="object-contain brightness-0 invert"
                  priority
                />
              </div>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Image
                    src="/fnh-logo.svg"
                    alt="FNH Healthcare"
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 object-contain brightness-0 invert"
                    priority
                  />
                  <div className="flex items-center gap-1 leading-tight min-w-0">
                    <span className="text-sm font-bold uppercase tracking-[0.25em] text-white/80 whitespace-nowrap">
                      FNH Connect
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handlePinToggle}
                  className="inline-flex h-6 w-6 items-center justify-center text-white/40 transition-all duration-200 hover:text-white hover:cursor-pointer shrink-0"
                  title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                  aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                >
                  <Pin
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isPinned ? "rotate-45 text-white" : ""
                    }`}
                  />
                </button>
              </>
            )}
          </div>

          {/* Navigation inside first container */}
          <nav className="overflow-y-auto">
            <ul className="space-y-3">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                        isActive
                          ? "text-white shadow-lg"
                          : "text-white/70 hover:text-white"
                      } ${isExpanded ? "gap-3" : "justify-center"}`}
                      style={{
                        background: isActive ? ACTIVE_BG : "transparent",
                        borderLeft: isActive
                          ? `4px solid ${ACTIVE_INDICATOR}`
                          : "4px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = HOVER_BG;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span
                        className={`flex h-9 w-9 min-w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                          isActive
                            ? "text-white"
                            : "text-white/60 group-hover:text-white"
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
