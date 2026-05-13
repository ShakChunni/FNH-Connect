"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Baby, Building2, Check, LogOut } from "lucide-react";
import type { PortalType } from "@/types/auth";

const CONTAINER_BG = "var(--sidebar)"; // Dark navy

type ViewMode = "general" | "infertility" | "logout";

interface ViewSwitcherProps {
  userRole: string;
  isExpanded: boolean;
  onToggle: (isOpen: boolean) => void;
  isOpen: boolean;
  portal: PortalType | null;
  availablePortals: PortalType[];
  isSwitchingPortal?: boolean;
  onSwitchPortal?: (portal: PortalType) => void | Promise<void>;
  onLogout?: () => void;
  parentRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ViewSwitcher({
  userRole: _userRole,
  isExpanded,
  onToggle,
  isOpen,
  portal,
  availablePortals,
  isSwitchingPortal = false,
  onSwitchPortal,
  onLogout,
  parentRef,
}: ViewSwitcherProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeouts
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    if (isOpen) {
      // Force close any ongoing animation first
      setIsVisible(false);
      setIsClosing(false);

      // Opening animation sequence
      setIsAnimating(true);
      setShouldRender(true);

      // Start animation after render - use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        openTimeoutRef.current = setTimeout(() => {
          setIsVisible(true);
        }, 10);
      });

      // Animation complete
      setTimeout(() => {
        setIsAnimating(false);
      }, 320);
    } else if (shouldRender) {
      // Only animate close if it was actually rendered
      // Closing animation sequence
      setIsAnimating(true);
      setIsClosing(true);
      setIsVisible(false);

      // Remove from DOM after animation
      closeTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setIsAnimating(false);
        setIsClosing(false);
      }, 270);
    }

    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [isOpen, shouldRender]);

  const portalViews = availablePortals.map((availablePortal) => ({
    id: availablePortal,
    label:
      availablePortal === "infertility" ? "HSI Center" : "Hospital Portal",
    subtitle:
      availablePortal === "infertility"
        ? "Infertility patients and cash"
        : "Admissions, pathology, and hospital operations",
    icon: availablePortal === "infertility" ? Baby : Building2,
  }));

  const handleClose = useCallback(() => {
    if (!isAnimating) {
      onToggle(false);
    }
  }, [isAnimating, onToggle]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const refToCheck = parentRef?.current || dropdownRef.current;
      if (refToCheck && !refToCheck.contains(event.target as Node)) {
        handleClose();
      }
    }

    if (isOpen && !isAnimating) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isAnimating, parentRef, handleClose]);

  const handleViewSwitch = (viewId: ViewMode | "logout") => {
    if (viewId === "general" || viewId === "infertility") {
      handleClose();

      if (viewId !== portal) {
        queueMicrotask(() => {
          Promise.resolve(onSwitchPortal?.(viewId)).catch((error) => {
            console.error("[ViewSwitcher] Portal switch failed:", error);
          });
        });
      }
      return;
    }

    if (viewId === "logout") {
      onLogout?.();
      handleClose();
      return;
    }
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div ref={dropdownRef}>
      {shouldRender && (
        <div
          className={`absolute bottom-full left-0 right-0 mb-2 overflow-hidden border border-sidebar-border bg-sidebar rounded-3xl ${
            isVisible
              ? "animate-dropdown-in"
              : isClosing
              ? "animate-dropdown-out"
              : "dropdown-hidden"
          }`}
          style={{ background: CONTAINER_BG }}
        >
          <div className="p-3">
            {portalViews.length > 1 && (
              <div className="mb-2">
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Switch Portal
                </p>
                <div className="space-y-1">
                  {portalViews.map((view) => {
                    const isActive = portal === view.id;
                    const Icon = view.icon;

                    return (
                      <button
                        key={view.id}
                        onClick={() => handleViewSwitch(view.id)}
                        disabled={isSwitchingPortal || isActive}
                        className={`w-full flex items-center gap-3 px-2 py-2 sm:p-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-white/12 text-white"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        } ${isSwitchingPortal ? "cursor-wait opacity-70" : "hover:cursor-pointer"}`}
                      >
                        <div
                          className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${
                            view.id === "infertility"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-xs sm:text-sm">
                            {view.label}
                          </p>
                          <p className="text-[9px] sm:text-[10px] opacity-75">
                            {view.subtitle}
                          </p>
                        </div>
                        {isActive && (
                          <Check className="h-4 w-4 text-white/80" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <button
              onClick={() => handleViewSwitch("logout")}
              className="w-full flex items-center gap-3 px-2 py-2 sm:p-3 rounded-xl transition-all duration-200 hover:cursor-pointer hover:bg-white/15 text-red-400 hover:text-red-300"
            >
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-red-500/20">
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-xs sm:text-sm">
                  Logout
                </p>
                <p className="text-[9px] sm:text-[10px] opacity-75">
                  Sign out of your account
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
