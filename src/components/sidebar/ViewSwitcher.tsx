"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User, ShieldCheck, Check, LogOut } from "lucide-react";

const CONTAINER_BG =
  "linear-gradient(180deg, #433F3C 0%, #332F2D 35%, #2A2524 70%, #393434 100%)";

type ViewMode = "employee" | "hradmin";

interface ViewSwitcherProps {
  userRole: string;
  isExpanded: boolean;
  onToggle: (isOpen: boolean) => void;
  isOpen: boolean;
  onLogout?: () => void;
  parentRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ViewSwitcher({
  userRole,
  isExpanded,
  onToggle,
  isOpen,
  onLogout,
  parentRef,
}: ViewSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedView, setSelectedView] = useState<ViewMode>("employee");
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      setSelectedView("hradmin");
    } else {
      setSelectedView("employee");
    }
  }, [pathname]);

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

  const views = [
    {
      id: "employee" as ViewMode,
      label: "Employee",
      subtitle: "My Profile & Benefits",
      icon: User,
      available:
        userRole.toLowerCase() === "hradmin" ||
        userRole.toLowerCase() === "superadmin",
      action: "switch" as const,
    },
    {
      id: "hradmin" as ViewMode,
      label: "HR Admin",
      subtitle: "Admin Dashboard",
      icon: ShieldCheck,
      available:
        userRole.toLowerCase() === "hradmin" ||
        userRole.toLowerCase() === "superadmin",
      action: "switch" as const,
    },
    {
      id: "logout" as const,
      label: "Logout",
      subtitle: "Sign out of your account",
      icon: LogOut,
      available: true,
      action: "logout" as const,
    },
  ];

  const availableViews = views.filter((view) => view.available);
  const switchViews = availableViews.filter((view) => view.action === "switch");
  const logoutView = availableViews.find((view) => view.action === "logout");

  if (availableViews.length === 0) {
    return null;
  }

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
    if (viewId === "logout") {
      onLogout?.();
      handleClose();
      return;
    }

    setSelectedView(viewId);
    if (viewId === "hradmin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
    handleClose();
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div ref={dropdownRef}>
      {shouldRender && (
        <div
          className={`absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.5)] ${
            isVisible
              ? "animate-dropdown-in"
              : isClosing
              ? "animate-dropdown-out"
              : "dropdown-hidden"
          }`}
          style={{ background: CONTAINER_BG }}
        >
          <div className="p-3">
            {switchViews.length > 0 && (
              <>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Switch View
                </p>
                <div className="space-y-1 mb-3">
                  {switchViews.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => handleViewSwitch(view.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:cursor-pointer ${
                        selectedView === view.id
                          ? "bg-gradient-to-r from-white/20 to-white/5 text-white"
                          : "hover:bg-white/5 text-white/85"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                          selectedView === view.id
                            ? "bg-white/15"
                            : "bg-white/10"
                        }`}
                      >
                        <view.icon
                          className={`w-4 h-4 ${
                            selectedView === view.id
                              ? "text-white"
                              : "text-white/70"
                          }`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm">{view.label}</p>
                        <p className="text-[10px] opacity-75">
                          {view.subtitle}
                        </p>
                      </div>
                      {selectedView === view.id && (
                        <Check className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
            {logoutView && (
              <>
                {switchViews.length > 0 && (
                  <div className="border-t border-white/10 my-2"></div>
                )}
                <button
                  onClick={() => handleViewSwitch("logout")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:cursor-pointer hover:bg-red-500/10 text-red-400 hover:text-red-300"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/20">
                    <logoutView.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">{logoutView.label}</p>
                    <p className="text-[10px] opacity-75">
                      {logoutView.subtitle}
                    </p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
