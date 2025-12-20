"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Settings } from "lucide-react";
import Image from "next/image";
import { getNavigationItems } from "./navigation";
import { useAuth } from "@/app/AuthContext";
import ViewSwitcher from "./ViewSwitcher";

import ConfirmModal from "@/components/ui/ConfirmModal";

const SIDEBAR_BG = "var(--fnh-black)"; // FNH Black
const CONTAINER_BG = "var(--sidebar)"; // Dark navy

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const handleLogoutClick = () => {
    // Check if user has a role that typically has shifts
    const role = user?.role?.toLowerCase();
    const staffRole = (user as any)?.staffRole?.toLowerCase() || "";

    // Check system roles that use shifts
    if (
      role === "system-admin" ||
      role === "operator" ||
      staffRole === "system-admin" ||
      staffRole === "operator"
    ) {
      setShowLogoutConfirm(true);
    } else {
      logout();
    }
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <header
        className={`lg:hidden fixed top-0 left-0 right-0 z-40 flex h-16 items-center gap-4 px-4 text-fnh-navy shadow-md transition-all duration-300 ${
          isOpen ? "bg-white/80 backdrop-blur-sm" : "bg-white"
        }`}
      >
        <button
          onClick={handleToggle}
          className="inline-flex h-12 w-12 items-center justify-center transition-colors text-jd-rich-black hover:text-jd-grey"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="flex flex-1 flex-col">
          <span className="text-sm font-semibold text-jd-rich-black">
            FNH Connect
          </span>
        </Link>
      </header>

      {isOpen && (
        <div
          ref={overlayRef}
          className="lg:hidden fixed left-0 right-0 bottom-0 top-0 z-30 bg-black/50 backdrop-blur-xs"
          onClick={handleOverlayClick}
        />
      )}

      <aside
        className={`lg:hidden fixed left-0 top-0 z-40 h-dvh w-full max-w-[20rem] transform bg-sidebar text-sidebar-foreground transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: SIDEBAR_BG }}
      >
        <nav className="flex h-full flex-col gap-3 px-3 pb-4 pt-4 overflow-y-auto">
          {/* First Container: Logo, Text, and Navigation */}
          <div
            className="rounded-2xl p-3 shrink-0"
            style={{ background: CONTAINER_BG }}
          >
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <div className="flex items-center gap-2">
                <Image
                  src="/fnh-logo.svg"
                  alt="FNH Healthcare"
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 object-contain brightness-0 invert"
                />
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80 leading-tight">
                  FNH Connect
                </div>
              </div>
              <button
                onClick={handleClose}
                className="inline-flex h-8 w-8 items-center justify-center text-white/70 transition-colors hover:text-white shrink-0"
                aria-label="Close navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
            {/* Navigation inside first container */}
            <ul className="space-y-2">
              {getNavigationItems(user?.role).map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleClose}
                      className={`group flex items-center rounded-xl px-2 py-2 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                        isActive
                          ? "bg-white/15 text-white border-r-4 border-yellow-400"
                          : "text-white/85 hover:bg-white/10 hover:text-white"
                      } gap-2`}
                    >
                      <span
                        className={`flex h-7 w-7 min-w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "text-white/70 group-hover:text-white"
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
            <div className="relative mt-auto shrink-0" ref={profileRef}>
              {/* ViewSwitcher Dropdown */}
              <ViewSwitcher
                userRole={user.role}
                isExpanded={true}
                isOpen={isDropdownOpen}
                onToggle={setIsDropdownOpen}
                onLogout={handleLogoutClick}
                parentRef={profileRef}
              />

              <div
                className="rounded-2xl px-3 py-2"
                style={{ background: CONTAINER_BG }}
              >
                <div
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="flex h-9 w-9 min-w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white shrink-0 overflow-hidden">
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">
                      {displayName}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center text-white/40 transition-all duration-200 hover:text-white"
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

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="End Shift & Logout"
        variant="warning"
        confirmLabel="Yes, I have"
        cancelLabel="No, return"
      >
        <div className="space-y-2">
          <p className="font-semibold text-fnh-navy-dark">
            Have you handed over all collected cash to the manager?
          </p>
          <p>
            You cannot logout until the cash handover is complete. Please ensure
            all finances are settled before leaving.
          </p>
        </div>
      </ConfirmModal>
    </>
  );
}
