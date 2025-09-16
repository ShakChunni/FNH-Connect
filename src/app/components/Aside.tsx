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
import {
  Home,
  Target,
  LineChart,
  ClipboardList,
  Clock,
  Users,
  Pin,
  User,
  Loader2,
  Phone,
  LogOut,
  Building2,
  Contact2,
  NotebookPen,
  ChevronDown,
  Shield,
  MailCheck,
  UserCheck,
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
  subItems?: NavigationItem[];
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
    if (role === "leadsmanager") {
      return [
        {
          id: "directory",
          label: "Directory",
          icon: Users,
          items: [
            {
              label: "Leads Management",
              href: "/admin/leads-management",
              icon: NotebookPen,
            },
            {
              label: "Duplicate Checker",
              href: "/admin/leads-management/duplicate-checker",
              icon: UserCheck,
            },
          ],
        },
      ];
    }
    const dashboardsGroup: NavigationGroup = {
      id: "dashboards",
      label: "Dashboards",
      icon: ClipboardList,
      items: [
        { label: "Sales Dashboard", href: "/home", icon: Home },
        { label: "Goal Dashboard", href: "/goals", icon: Target },
      ],
    };

    // Directory group logic (matches directoryGroup in HeaderNavigation)
    const directoryItems: NavigationItem[] = [
      { label: "Clients", href: "/clients", icon: Contact2 },
      {
        label: "Email Verification",
        href: "/clients/email-verification",
        icon: MailCheck,
      },
      { label: "Organizations", href: "/organizations", icon: Building2 },
      ...(role === "admin"
        ? [
            {
              label: "Leads Management",
              href: "/admin/leads-management",
              icon: NotebookPen,
            },
            {
              label: "Duplicate Checker",
              href: "/admin/leads-management/duplicate-checker",
              icon: UserCheck,
            },
            { label: "Call Reports", href: "/admin/call-reports", icon: Phone },
          ]
        : []),
    ];
    const directoryGroup: NavigationGroup = {
      id: "directory",
      label: "Directory",
      icon: Users,
      items: directoryItems,
    };

    const analyticsGroup: NavigationGroup = {
      id: "analytics",
      label: "Analytics",
      icon: LineChart,
      items: [
        {
          label: "Goal Analytics",
          href: "/admin/goals-analytics",
          icon: LineChart,
        },
      ],
    };

    const adminGroup: NavigationGroup | null =
      role === "admin"
        ? {
            id: "administration",
            label: "Administration",
            icon: Shield,
            items: [
              {
                label: "Goal Management",
                href: "/admin/goals-management",
                icon: ClipboardList,
              },
              {
                label: "User Management",
                href: "/admin/user-management",
                icon: Users,
              },
              {
                label: "Activity Log",
                href: "/admin/activity-logs",
                icon: Clock,
              },
            ],
          }
        : null;

    const groups: NavigationGroup[] = [
      dashboardsGroup,
      directoryGroup,
      analyticsGroup,
    ];
    if (adminGroup) groups.push(adminGroup);

    return groups;
  }, [user]);

  return (
    <div
      id="drawer-navigation"
      className={`hidden lg:flex ${
        isPinned ? "fixed" : "fixed"
      } overflow-hidden top-0 left-0 bg-gradient-to-br from-[#0a1425] via-[#0f1b2e] to-[#1a2332] ${
        isExpanded ? "w-64" : "w-20"
      } h-screen overflow-y-auto transition-all duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex-col justify-between will-change-[width] border-r border-blue-500/10`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        boxShadow:
          "0px 4px 24px 0px rgba(0, 0, 0, 0.35), inset 1px 0 0 rgba(59, 130, 246, 0.1)",
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
              className={`ml-2 text-sm 2xl:text-base font-bold text-white whitespace-nowrap transition-opacity duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)] 2xl:tracking-tight 2xl:font-extrabold text-shadow-sm ${
                isExpanded ? "opacity-100" : "opacity-0"
              }`}
            >
              Sales Platform
            </span>
          </Link>
          <button
            onClick={handlePinToggle}
            disabled={isAnimating}
            className={`${
              isExpanded ? "px-2.5 lg:px-3" : "px-0"
            } rounded-full mb-6 hover:bg-[#1e293b]/40 hover:shadow-lg transition-all duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)] cursor-pointer ${
              isExpanded ? "opacity-100" : "opacity-0"
            } group`}
            title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            <Pin
              size={16}
              className={`transition-all duration-250 ease-[cubic-bezier(0.25,0.1,0.25,1)] 2xl:text-[14px] ${
                isPinned
                  ? "rotate-45 text-yellow-400 drop-shadow-sm"
                  : "text-gray-300 group-hover:text-yellow-300"
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
                    className={`flex items-center w-full p-2 lg:p-2.5 rounded-lg transition-all duration-250 ease-out cursor-pointer backdrop-blur-sm border border-transparent
                    ${
                      isActive
                        ? "bg-gradient-to-r from-[#1e293b]/40 to-[#1e293b]/20 shadow-inner border-blue-500/20"
                        : "hover:bg-gradient-to-r hover:from-[#1e293b]/25 hover:to-[#1e293b]/10 hover:shadow-md hover:border-blue-500/10"
                    } group relative overflow-hidden`}
                  >
                    <div className={`relative ${isActive ? "z-10" : ""}`}>
                      {isActive && (
                        <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-[10px] animate-pulse"></div>
                      )}
                      <group.icon
                        className={`w-6 h-6 2xl:w-8 2xl:h-8 relative transition-all duration-200 ${
                          isActive
                            ? "text-yellow-400 drop-shadow-lg"
                            : "text-white group-hover:text-yellow-300"
                        }`}
                      />
                    </div>

                    {isExpanded && (
                      <>
                        <span
                          className={`ml-2 text-[13px] 2xl:text-[15px] font-medium tracking-wide 2xl:tracking-tight 2xl:font-semibold transition-all duration-200 ${
                            isActive
                              ? "text-yellow-400 text-shadow-sm"
                              : "text-white group-hover:text-yellow-300"
                          } whitespace-nowrap overflow-hidden`}
                        >
                          {group.label}
                        </span>
                        <div className="ml-auto">
                          <ChevronDown
                            className={`w-4 h-4 2xl:w-5 2xl:h-5 text-gray-300 group-hover:text-yellow-300 transition-all duration-300 ${
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
                      className={`absolute left-[18px] 2xl:left-[22px] top-0 w-[2px] bg-gradient-to-b from-blue-400/30 to-blue-300/10 z-20 transition-opacity duration-200 shadow-sm ${
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
                        const hasSubItems =
                          item.subItems && item.subItems.length > 0;
                        const isSubItemActive =
                          hasSubItems &&
                          item.subItems?.some(
                            (subItem) => pathname === subItem.href
                          );
                        const shouldShowSubItems =
                          isExpanded &&
                          isGroupExpanded &&
                          hasSubItems &&
                          (isItemActive || isSubItemActive);

                        return (
                          <div key={item.href}>
                            <Link
                              href={item.href}
                              className={`flex items-center w-full py-1 2xl:py-1.5 px-2 2xl:px-2.5 transition-all duration-200 text-xs 2xl:text-sm 2xl:tracking-tight
                                relative overflow-hidden rounded-l-full transform backdrop-blur-sm ${
                                  isItemActive || isSubItemActive
                                    ? "bg-gradient-to-r from-yellow-500/25 to-[#1e293b]/50 text-yellow-400 shadow-md border-r-2 border-yellow-400/60"
                                    : "text-gray-200 hover:bg-gradient-to-r hover:from-[#1e293b]/30 hover:to-[#1e293b]/10 hover:text-yellow-300 hover:shadow-sm"
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
                              {(isItemActive || isSubItemActive) && (
                                <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-yellow-400 to-yellow-500 shadow-lg"></div>
                              )}

                              <div
                                className={`absolute top-1/2 h-[2px] transform -translate-y-1/2 transition-all duration-200 z-10
                                  group-hover/link:bg-yellow-300/60 group-hover/link:shadow-sm`}
                                style={{
                                  width: "14px",
                                  left: "-14px",
                                  backgroundImage:
                                    isItemActive || isSubItemActive
                                      ? "linear-gradient(to right, transparent 0, transparent 1px, #facc15 1px)"
                                      : "linear-gradient(to right, transparent 0, transparent 1px, rgba(147, 197, 253, 0.3) 1px)",
                                }}
                              ></div>

                              <div className="relative">
                                {(isItemActive || isSubItemActive) && (
                                  <div className="absolute inset-0 bg-yellow-400/40 rounded-full blur-[8px] animate-pulse"></div>
                                )}
                                <item.icon
                                  className={`w-4 h-4 2xl:w-5 2xl:h-5 min-w-[16px] relative transition-all duration-200 group-hover/link:scale-110 ${
                                    isItemActive || isSubItemActive
                                      ? "text-yellow-400 drop-shadow-md"
                                      : "text-gray-300 group-hover/link:text-yellow-300"
                                  }`}
                                />
                              </div>

                              <span
                                className={`ml-2 ${
                                  isItemActive || isSubItemActive
                                    ? "text-yellow-400 text-shadow-sm"
                                    : "group-hover/link:text-yellow-300"
                                } transition-colors duration-200 font-medium 2xl:font-semibold 2xl:tracking-tight whitespace-nowrap overflow-hidden ${
                                  !isExpanded ? "hidden" : "block"
                                }`}
                                style={{ width: isExpanded ? "130px" : "0" }}
                              >
                                {item.label}
                              </span>
                            </Link>

                            {/* Sub-items */}
                            {shouldShowSubItems && (
                              <div className="ml-6 mt-1 space-y-1">
                                {item.subItems!.map((subItem, subIndex) => {
                                  const isSubActive = pathname === subItem.href;
                                  return (
                                    <Link
                                      key={subItem.href}
                                      href={subItem.href}
                                      className={`flex items-center w-full py-1 px-2 transition-all duration-200 text-xs 2xl:tracking-tight
                                        relative overflow-hidden rounded-l-full transform backdrop-blur-sm ${
                                          isSubActive
                                            ? "bg-gradient-to-r from-blue-500/25 to-[#1e293b]/50 text-blue-400 shadow-md border-r-2 border-blue-400/60"
                                            : "text-gray-300 hover:bg-gradient-to-r hover:from-[#1e293b]/25 hover:to-[#1e293b]/10 hover:text-blue-300 hover:shadow-sm"
                                        } group/sublink`}
                                      style={{
                                        transitionDelay: `${
                                          100 + subIndex * 20
                                        }ms`,
                                        opacity: 1,
                                      }}
                                    >
                                      {isSubActive && (
                                        <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-blue-400 to-blue-500 shadow-lg"></div>
                                      )}

                                      <div className="relative">
                                        <subItem.icon
                                          className={`w-3 h-3 min-w-[12px] relative transition-all duration-200 group-hover/sublink:scale-110 ${
                                            isSubActive
                                              ? "text-blue-400 drop-shadow-md"
                                              : "text-gray-400 group-hover/sublink:text-blue-300"
                                          }`}
                                        />
                                      </div>

                                      <span
                                        className={`ml-2 ${
                                          isSubActive
                                            ? "text-blue-400 text-shadow-sm"
                                            : "group-hover/sublink:text-blue-300"
                                        } transition-colors duration-200 font-medium 2xl:font-semibold 2xl:tracking-tight whitespace-nowrap overflow-hidden`}
                                      >
                                        {subItem.label}
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-2 lg:p-3 mt-auto border-t border-blue-400/20 bg-gradient-to-r from-[#0a1425]/50 to-[#1a2332]/30 backdrop-blur-sm">
          <div className="flex items-center w-full p-2 lg:p-2.5 rounded-lg transition-all duration-200 group hover:bg-gradient-to-r hover:from-[#1e293b]/30 hover:to-[#1e293b]/10 hover:shadow-md hover:backdrop-blur-md">
            <div className="relative flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-full p-1.5 shadow-inner border border-blue-500/20">
              {user && userProfileImage ? (
                <Image
                  src={userProfileImage}
                  alt={`${user.username}'s profile`}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-400/30 group-hover:ring-yellow-400/50 transition-all duration-200"
                />
              ) : (
                <User className="w-5 h-5 2xl:w-7 2xl:h-7 min-w-[20px] text-white transition-all duration-200 group-hover:text-yellow-300" />
              )}
            </div>
            {isExpanded && user && (
              <div className="flex-1 ml-2 2xl:ml-3 overflow-hidden">
                <p className="text-white text-xs 2xl:text-sm font-medium 2xl:font-semibold 2xl:tracking-tight truncate group-hover:text-yellow-100 transition-colors duration-200 text-shadow-sm">
                  {user.fullName}
                </p>
                <p className="text-yellow-300 text-[11px] 2xl:text-xs font-medium 2xl:font-semibold 2xl:tracking-tight truncate group-hover:text-yellow-200 transition-colors duration-200">
                  @{user.username}
                </p>
              </div>
            )}
            {isExpanded && (
              <button
                className="p-1.5 rounded-full hover:bg-gradient-to-r hover:from-red-600/70 hover:to-red-500/50 hover:shadow-lg transition-all duration-200 ml-1 cursor-pointer group/logout backdrop-blur-sm border border-transparent hover:border-red-400/30"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Logout"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 2xl:w-5 2xl:h-5 text-white animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 2xl:w-5 2xl:h-5 text-white hover:text-yellow-300 group-hover/logout:scale-110 transition-all duration-200 drop-shadow-sm" />
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
