"use client";
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/AuthContext";
import {
  X,
  Menu,
  Home,
  ClipboardList,
  Clock,
  Users,
  LogOut,
  Shield,
  ChevronDown,
  FlaskConical,
} from "lucide-react";
import Avatar from "./Avatar";
// import TableSelector from "@/app/home/filters/TableSelector";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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

interface HeaderNavigationProps {
  showTableSelector?: boolean;
  tableSelectorValue?: string;
}

const NAV_STRUCTURE = [
  {
    id: "staff",
    label: "Staff",
    icon: Users,
    items: [
      { label: "Dashboard", href: "/home", icon: Home },
      { label: "Infertility", href: "/infertility", icon: ClipboardList },
      { label: "Pathology", href: "/pathology", icon: FlaskConical },
    ],
  },
];

const getHeaderText = (pathname: string, tableSelectorValue?: string) => {
  if (pathname === "/home" && tableSelectorValue) {
    let organizationName = "";
    if (tableSelectorValue === "MAVN") {
      organizationName = "MAVN";
    } else if (tableSelectorValue === "Moving Image") {
      organizationName = "The Moving Image";
    } else if (tableSelectorValue === "All") {
      organizationName = "All Organizations";
    }
    return (
      <>
        <span className="text-blue-950 font-semibold">
          Monthly Reporting of{" "}
        </span>
        <span className="text-blue-900 font-extrabold">{organizationName}</span>
      </>
    );
  }
  if (pathname === "/goals") {
    return <span className="text-blue-950 font-semibold">Goal Dashboard</span>;
  }
  if (pathname === "/organizations") {
    return <span className="text-blue-950 font-semibold">Organizations</span>;
  }
  if (pathname === "/clients") {
    return <span className="text-blue-950 font-semibold">Clients</span>;
  }
  if (pathname === "/admin/goals-analytics") {
    return (
      <span className="text-blue-950 font-semibold">
        Goals Analytics Report
      </span>
    );
  }
  if (pathname === "/admin/goals-management") {
    return <span className="text-blue-950 font-semibold">Goal Management</span>;
  }
  if (pathname === "/admin/activity-logs") {
    return <span className="text-blue-950 font-semibold">Activity Log</span>;
  }
  if (pathname === "/admin/user-management") {
    return <span className="text-blue-950 font-semibold">User Management</span>;
  }
  if (pathname === "/admin/leads-management") {
    return (
      <span className="text-blue-950 font-semibold">Leads Management</span>
    );
  }
  if (pathname === "/admin/call-reports") {
    return <span className="text-blue-950 font-semibold">Call Reports</span>;
  }
  return null;
};

const HeaderNavigation = ({
  showTableSelector = false,
  tableSelectorValue = "",
}: HeaderNavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    setIsMobileMenuOpen(false);
  }, [logout]);

  const userProfileImage = useMemo(() => {
    if (user && usersWithImages.includes(user.username.toLowerCase())) {
      return `/${user.username.toLowerCase()}.jpg`;
    }
    return null;
  }, [user]);

  // Admin-only navigation group
  const adminGroup =
    user?.role?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "owner"
      ? {
          id: "admin",
          label: "Admin",
          icon: Shield,
          items: [
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
          ],
        }
      : null;

  // Compose navGroups in correct order
  const navGroups = useMemo(() => {
    const groups = [...NAV_STRUCTURE];
    if (adminGroup) groups.push(adminGroup);
    return groups;
  }, [adminGroup]);

  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === overlayRef.current) {
      setIsMobileMenuOpen(false);
    }
  }, []);

  const handleLinkClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const headerText = getHeaderText(pathname, tableSelectorValue);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div className="flex items-center justify-between w-full">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition-all duration-200"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="w-8 h-8 text-blue-950" strokeWidth={1.5} />
        </button>

        {headerText && (
          <div className="flex-1 text-center px-4 hidden sm:block">
            <h1 className="text-lg font-bold text-gray-800 truncate">
              {headerText}
            </h1>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* {showTableSelector && tableSelectorValue && (
            <TableSelector defaultValue={tableSelectorValue} />
          )} */}
          <Avatar
            src={user && userProfileImage ? userProfileImage : undefined}
            alt={user ? `${user.username}'s profile` : "User avatar"}
            size={40}
            className="border-gray-300"
          />
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={handleOverlayClick}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{
                type: "tween",
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-gradient-to-b from-[#0d1a2b] to-[#121d35] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <Image
                    src="/mi-favicon-bw-copy.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="h-auto"
                  />
                  <div className="text-white">
                    <h2 className="text-sm font-semibold">FNH-CONNECT </h2>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-700/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-3">
                  <ul className="space-y-1.5">
                    {navGroups.map((group) => {
                      const isGroupActive = group.items.some(
                        (item) => pathname === item.href
                      );
                      const isGroupExpanded =
                        expanded[group.id] ?? isGroupActive;
                      return (
                        <li key={group.id}>
                          <button
                            className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                              isGroupActive
                                ? "bg-yellow-400/20 text-yellow-400 font-semibold"
                                : "text-gray-200 hover:bg-gray-700/50 hover:text-yellow-300"
                            }`}
                            onClick={() => toggleExpand(group.id)}
                          >
                            <group.icon
                              className={`w-5 h-5 ${
                                isGroupActive
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                            <span className="text-sm flex-1 text-left">
                              {group.label}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 ml-auto transition-transform duration-300 ${
                                isGroupExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <ul
                            className={`pl-7 mt-1 space-y-1 transition-all duration-300 overflow-hidden ${
                              isGroupExpanded
                                ? "max-h-[500px] opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            {group.items.map((item) => {
                              const isActive = pathname === item.href;
                              return (
                                <li key={item.label}>
                                  <Link
                                    href={item.href}
                                    onClick={handleLinkClick}
                                    className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 text-xs ${
                                      isActive
                                        ? "bg-yellow-400/20 text-yellow-400 font-semibold"
                                        : "text-gray-200 hover:bg-gray-700/50 hover:text-yellow-300"
                                    }`}
                                  >
                                    <item.icon
                                      className={`w-4 h-4 ${
                                        isActive
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                    <span>{item.label}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>

              <div className="p-4 border-t border-gray-700/50">
                {user && (
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar
                      src={userProfileImage}
                      alt={`${user.username}'s profile`}
                      size={40}
                      className="border-gray-600"
                    />
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {user.fullName}
                      </p>
                      <p className="text-yellow-500 text-xs">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <LogOut className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
HeaderNavigation.displayName = "HeaderNavigation";
export default React.memo(HeaderNavigation);
