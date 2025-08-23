"use client";
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/AuthContext";
import useSidebarState from "@/app/hooks/useSidebarState";
import {
  Home,
  ClipboardList,
  Clock,
  Users,
  Pin,
  User,
  Loader2,
  LogOut,
  Shield,
  ChevronDown,
  Baby,
  FlaskConical,
  Stethoscope,
  HeartPulse,
} from "lucide-react";

const usersWithImages = [
  "amelie",
  "amra",
  "charlotte",
  "jouya",
  "manon",
  "marwan",
  "nana",
  "russell",
  "ikhwan",
  "tanvir",
];

const COLLAPSED_WIDTH = "5rem";

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  admin?: boolean;
}

interface NavigationGroup {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  items: NavigationItem[];
}
type ExpandedSections = Record<string, boolean>;

const Aside = ({
  isExpanded,
  setIsExpanded,
  isPinned,
  setPinnedState,
  isAnimating,
  expandedSections,
  toggleSection,
}: {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  isPinned: boolean;
  setPinnedState: (pinned: boolean) => void;
  isAnimating: boolean;
  expandedSections: ExpandedSections;
  toggleSection: (sectionId: string) => void;
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-collapsed-width",
      COLLAPSED_WIDTH
    );
    return () => {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  }, [logout]);

  const handlePinToggle = useCallback(() => {
    setPinnedState(!isPinned);
  }, [isPinned, setPinnedState]);

  const handleMouseEnter = useCallback(() => {
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      setIsExpanded(true);
    });
  }, [setIsExpanded]);

  const handleMouseLeave = useCallback(() => {
    if (!isPinned) {
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      collapseTimeoutRef.current = setTimeout(() => {
        if (!isPinned) {
          animationFrameRef.current = requestAnimationFrame(() => {
            setIsExpanded(false);
          });
        }
      }, 100);
    }
  }, [isPinned, setIsExpanded]);

  const userProfileImage = useMemo(() => {
    if (user && usersWithImages.includes(user.username.toLowerCase())) {
      return `/${user.username.toLowerCase()}.jpg`;
    }
    return null;
  }, [user]);

  const navigationGroups = useMemo((): NavigationGroup[] => {
    const role = user?.role?.toLowerCase();

    // Staff navigation for all normal staff
    const staffItems: NavigationItem[] = [
      { label: "Dashboard", href: "/home", icon: Home },
      { label: "Infertility", href: "/infertility", icon: Baby },
      { label: "Pathology", href: "/pathology", icon: FlaskConical },
    ];

    // Admin-only navigation
    const adminItems: NavigationItem[] =
      role === "admin" || role === "owner"
        ? [
            {
              label: "Admin Dashboard",
              href: "/admin-dashboard",
              icon: Shield,
            },
            {
              label: "User Management",
              href: "/admin/user-management",
              icon: Users,
            },
            {
              label: "Activity Logs",
              href: "/admin/activity-logs",
              icon: Clock,
            },
          ]
        : [];

    const groups: NavigationGroup[] = [
      {
        id: "staff",
        label: "Staff Portal",
        icon: Users ,
        items: staffItems,
      },
    ];

    if (adminItems.length > 0) {
      groups.push({
        id: "admin",
        label: "Admin",
        icon: Shield,
        items: adminItems,
      });
    }

    return groups;
  }, [user]);

  return (
    <div
      id="drawer-navigation"
      className={`hidden lg:flex ${
        isPinned ? "fixed" : "fixed"
      } overflow-hidden top-0 left-0 bg-gradient-to-b from-[#0d1a2b] to-[#121d35] ${
        isExpanded ? "w-64" : "w-20"
      } h-screen overflow-y-auto transition-all duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex-col justify-between will-change-[width]`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        boxShadow: "0px 4px 12.8px 0px rgba(0, 0, 0, 0.25)",
        zIndex: isPinned ? 50 : 60, // Higher z-index when not pinned (overlay mode)
      }}
    >
      <div className="flex flex-col h-full">
        <div className="py-3 lg:py-4 ml-3 lg:ml-4 flex justify-between items-center">
          <Link className="flex items-center justify-start" href={"/home"}>
            <Image
              src="/mi-favicon-bw-copy.png"
              alt="Logo"
              width={isExpanded ? 42 : 46}
              height={isExpanded ? 42 : 46}
              className="h-auto transition-[width,height] duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            />
            <span
              className={`ml-2 text-sm 2xl:text-base font-bold text-white whitespace-nowrap transition-opacity duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                isExpanded ? "opacity-100" : "opacity-0"
              }`}
            >
              FNH-CONNECT
            </span>
          </Link>
          <button
            onClick={handlePinToggle}
            disabled={isAnimating}
            className={`${
              isExpanded ? "px-2.5 lg:px-3" : "px-0"
            } rounded-full mb-6 hover:bg-[#1e293b]/30 transition-all duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)] cursor-pointer ${
              isExpanded ? "opacity-100" : "opacity-0"
            }`}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            <Pin
              size={16}
              className={`transition-transform duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)] 2xl:text-[14px] ${
                isPinned ? "rotate-45 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 lg:py-3 pl-2 lg:pl-3">
          <div className="space-y-1.5 lg:space-y-2.5">
            {navigationGroups.map((group) => {
              const isActive = group.items.some(
                (item) => pathname === item.href
              );
              const isGroupExpanded = expandedSections[group.id] ?? isActive;

              return (
                <div key={group.id} className="mb-1 relative">
                  <button
                    onClick={() => toggleSection(group.id)}
                    className={`flex items-center w-full p-2 lg:p-2.5 rounded-lg transition-all duration-250 ease-out cursor-pointer
                    ${
                      isActive
                        ? "bg-[#1e293b]/30 backdrop-blur-sm"
                        : "hover:bg-[#1e293b]/20"
                    } group relative`}
                  >
                    <div className={`relative ${isActive ? "z-10" : ""}`}>
                      {isActive && (
                        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-[8px]"></div>
                      )}
                      <group.icon
                        className={`w-6 h-6 2xl:w-8 2xl:h-8 relative ${
                          isActive
                            ? "text-yellow-400"
                            : "text-white group-hover:text-yellow-300"
                        } transition-colors duration-200`}
                      />
                    </div>

                    {isExpanded && (
                      <>
                        <span
                          className={`ml-2 text-[13px] 2xl:text-[15px] font-medium tracking-wide transition-all duration-200 ${
                            isActive
                              ? "text-yellow-400"
                              : "text-white group-hover:text-yellow-300"
                          } whitespace-nowrap overflow-hidden`}
                        >
                          {group.label}
                        </span>
                        <div className="ml-auto">
                          <ChevronDown
                            className={`w-4 h-4 2xl:w-5 2xl:h-5 text-gray-300 group-hover:text-yellow-300 transition-transform duration-300 ${
                              isGroupExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </>
                    )}
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out relative ${
                      isExpanded && isGroupExpanded
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                    style={{
                      maxHeight:
                        isExpanded && isGroupExpanded
                          ? `${group.items.length * 40 + 16}px`
                          : "0px",
                      marginTop: isExpanded && isGroupExpanded ? "6px" : "0px",
                      transitionProperty: "max-height, opacity, margin",
                      transitionTimingFunction: "cubic-bezier(0.25, 1, 0.5, 1)",
                      willChange: "max-height, opacity, margin",
                    }}
                  >
                    <div
                      className={`absolute left-[18px] 2xl:left-[22px] top-0 w-[2px] bg-blue-300/20 z-20 transition-opacity duration-200 ${
                        isExpanded && isGroupExpanded
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                      style={{
                        height: "100%",
                        transitionDelay:
                          isExpanded && isGroupExpanded ? "100ms" : "0ms",
                      }}
                    ></div>

                    <div
                      className={`relative pl-8 2xl:pl-10 space-y-1.5 2xl:space-y-2 py-1 2xl:py-1.5 transition-opacity duration-300 ${
                        isExpanded && isGroupExpanded
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                      style={{
                        transitionDelay:
                          isExpanded && isGroupExpanded ? "50ms" : "0ms",
                      }}
                    >
                      {group.items.map((item, index) => {
                        const isItemActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center w-full py-1 2xl:py-1.5 px-2 2xl:px-2.5 transition-all duration-200 text-xs 2xl:text-sm 
                              relative overflow-hidden rounded-l-full transform ${
                                isItemActive
                                  ? "bg-gradient-to-r from-yellow-500/20 to-[#1e293b]/40 text-yellow-400"
                                  : "text-gray-200 hover:bg-[#1e293b]/20 hover:text-yellow-300"
                              } group/link`}
                            style={{
                              transitionDelay:
                                isExpanded && isGroupExpanded
                                  ? `${50 + index * 30}ms`
                                  : "0ms",
                              opacity: isExpanded && isGroupExpanded ? 1 : 0,
                              transform:
                                isExpanded && isGroupExpanded
                                  ? "translateY(0)"
                                  : "translateY(-4px)",
                            }}
                          >
                            {isItemActive && (
                              <div className="absolute right-0 top-0 h-full w-1 bg-yellow-400"></div>
                            )}

                            <div
                              className={`absolute top-1/2 h-[2px] transform -translate-y-1/2 transition-colors duration-200 z-10
                                group-hover/link:bg-yellow-300/50`}
                              style={{
                                width: "14px",
                                left: "-14px",
                                backgroundImage: isItemActive
                                  ? "linear-gradient(to right, transparent 0, transparent 1px, #facc15 1px)"
                                  : "linear-gradient(to right, transparent 0, transparent 1px, rgba(147, 197, 253, 0.3) 1px)",
                              }}
                            ></div>

                            <div className="relative">
                              {isItemActive && (
                                <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-[6px]"></div>
                              )}
                              <item.icon
                                className={`w-4 h-4 2xl:w-5 2xl:h-5 min-w-[16px] relative ${
                                  isItemActive
                                    ? "text-yellow-400"
                                    : "text-gray-300 group-hover/link:text-yellow-300"
                                } transition-colors duration-200`}
                              />
                            </div>

                            <span
                              className={`ml-2 ${
                                isItemActive
                                  ? "text-yellow-400"
                                  : "group-hover/link:text-yellow-300"
                              } transition-colors duration-200 font-medium whitespace-nowrap overflow-hidden ${
                                !isExpanded ? "hidden" : "block"
                              }`}
                              style={{ width: isExpanded ? "130px" : "0" }}
                            >
                              {item.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-2 lg:p-3 mt-auto border-t border-blue-400/10">
          <div className="flex items-center w-full p-2 lg:p-2.5 rounded-lg transition-all duration-200 group hover:bg-[#1e293b]/20">
            <div className="relative flex items-center justify-center bg-blue-500/10 rounded-full p-1.5">
              {user && userProfileImage ? (
                <Image
                  src={userProfileImage}
                  alt={`${user.username}'s profile`}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 2xl:w-7 2xl:h-7 min-w-[20px] text-white transition-colors duration-200" />
              )}
            </div>
            {isExpanded && user && (
              <div className="flex-1 ml-2 2xl:ml-3 overflow-hidden">
                <p className="text-white text-xs 2xl:text-sm font-medium truncate group-hover:text-yellow-100 transition-colors duration-200">
                  {user.fullName}
                </p>
                <p className="text-yellow-300 text-[11px] 2xl:text-xs font-medium truncate">
                  @{user.username}
                </p>
              </div>
            )}
            {isExpanded && (
              <button
                className="p-1.5 rounded-full hover:bg-red-600/70 transition-all duration-200 ml-1 cursor-pointer"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Logout"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 2xl:w-5 2xl:h-5 text-white animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 2xl:w-5 2xl:h-5 text-white hover:text-yellow-300 transition-colors duration-200" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
Aside.displayName = "Aside";
export default React.memo(Aside);
