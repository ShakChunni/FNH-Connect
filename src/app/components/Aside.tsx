"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../AuthContext";

import useSidebarState from "@/app/hooks/useSidebarState";
import {
  FaHouse,
  FaBullseye,
  FaChartLine,
  FaClipboard,
  FaClockRotateLeft,
  FaUsers,
  FaAddressBook,
  FaThumbtack,
  FaUser,
  FaSpinner,
  FaArrowRight,
  FaRightFromBracket,
} from "react-icons/fa6";
import { BsArrowRight } from "react-icons/bs";

// List of users with profile images
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

// Define collapse width for CSS variable
const COLLAPSED_WIDTH = "5rem"; // 80px

const Aside = ({
  isExpanded,
  setIsExpanded,
}: {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
}) => {
  const { isPinned, isAnimating, setPinnedState } = useSidebarState();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Set CSS variables for sidebar width that can be used by other components
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-collapsed-width",
      COLLAPSED_WIDTH
    );
  }, []);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  }, [logout]);

  const handlePinToggle = useCallback(() => {
    setPinnedState(!isPinned);
    // No need to manually set expanded here anymore
    // The useSidebarState hook will handle this properly
  }, [isPinned, setPinnedState]);

  // Handle mouse events with animation state considered
  const handleMouseEnter = useCallback(() => {
    setIsExpanded(true);
  }, [setIsExpanded]);

  const handleMouseLeave = useCallback(() => {
    // Only check for isPinned, NOT isAnimating - this allows collapse during animation
    if (!isPinned) {
      setIsExpanded(false);
    }
  }, [isPinned, setIsExpanded]);
  // Determine if the user has a custom profile image
  const userProfileImage = useMemo(() => {
    if (user && usersWithImages.includes(user.username.toLowerCase())) {
      return `/${user.username.toLowerCase()}.jpg`;
    }
    return null;
  }, [user]);

  const listItems = useMemo(() => {
    const items = [
      { label: "Sales Dashboard", href: "/home", icon: FaHouse },
      { label: "Goal Dashboard", href: "/goals", icon: FaBullseye },
      {
        label: "Goal Analytics",
        href: "/admin/goals-analytics",
        icon: FaChartLine,
      },
    ];

    if (user?.role === "admin") {
      items.push(
        {
          label: "Goal Management",
          href: "/admin/goals-management",
          icon: FaClipboard,
        },
        {
          label: "Activity Log",
          href: "/admin/activity-logs",
          icon: FaClockRotateLeft,
        },
        {
          label: "User Management",
          href: "/admin/user-management",
          icon: FaUsers,
        },
        {
          label: "Leads Management",
          href: "/admin/leads-management",
          icon: FaAddressBook,
        }
      );
    }
    return items;
  }, [user]);

  const activeItem = useMemo(() => {
    return listItems.find((item) => pathname === item.href);
  }, [pathname, listItems]);

  return (
    <div
      id="drawer-navigation"
      className="hidden lg:flex fixed overflow-hidden top-0 left-0 bg-gradient-to-b from-[#0d1a2b] to-[#121d35] h-screen overflow-y-auto transition-all duration-300 ease-in-out flex-col justify-between"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isExpanded ? "16rem" : COLLAPSED_WIDTH,
        boxShadow: "0px 4px 12.8px 0px rgba(0, 0, 0, 0.25)",
        zIndex: 50,
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header section */}
        <div className="flex items-center justify-between p-4">
          <Link className="flex items-center justify-start" href={"/home"}>
            <Image
              src="/mi-favicon-bw-copy.png"
              alt="Logo"
              width={40}
              height={40}
              className="h-auto"
            />
          </Link>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? "w-8 opacity-100" : "w-0 opacity-0"
            }`}
          >
            {isExpanded && (
              <button
                onClick={handlePinToggle}
                className="p-2 rounded-full transition-all duration-300 flex items-center justify-center"
                title={isPinned ? "Collapse sidebar" : "Keep sidebar expanded"}
                disabled={isAnimating} // Disable during animation
              >
                <FaThumbtack
                  size={20}
                  className={`transform transition-all duration-500 ease-in-out ${
                    isPinned
                      ? "rotate-45 text-yellow-400"
                      : "rotate-0 text-gray-300 hover:text-white"
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Rest of component remains the same */}
        {/* ... */}

        <div className="py-6 overflow-hidden flex-1">
          <ul className="space-y-2 font-medium">
            {listItems.map((item) => {
              const isActive = activeItem?.href === item.href;
              return (
                <li key={item.label} className="relative">
                  {isActive && (
                    <div className="absolute right-0 top-0 h-full w-1 bg-[#E3E6EB]"></div>
                  )}
                  <Link
                    href={item.href}
                    className={`flex w-full p-3 ${
                      isExpanded ? "" : "justify-center"
                    } transition-all duration-300 ease-in-out relative overflow-hidden group ${
                      isActive ? "font-bold" : "font-medium"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 right-0 bg-[#E3E6EB] rounded-l-full opacity-10"></div>
                    )}
                    {/* Main content container - remove fixed height constraint */}
                    <div className="relative flex items-center z-10 pl-3 w-full">
                      {/* Icon container - adjust height */}
                      <div className="flex-shrink-0 w-8 flex items-center justify-center">
                        <item.icon
                          size={24}
                          className={`${
                            isActive
                              ? "text-yellow-400"
                              : "text-gray-200 group-hover:text-yellow-300"
                          } transition-colors duration-300`}
                        />
                      </div>

                      {/* Text container - adjust for better vertical alignment */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center ${
                          isExpanded ? "w-[180px] ml-3" : "w-0 ml-0"
                        }`}
                      >
                        <span
                          className={`whitespace-nowrap transition-all duration-300 ease-in-out ${
                            isActive
                              ? "text-yellow-400"
                              : "text-gray-200 group-hover:text-yellow-300"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>

                      {/* Arrow container - adjusted alignment */}
                      <div
                        className={`absolute right-0 top-1/2 -translate-y-1/2 mr-3 transition-all duration-300 ease-in-out ${
                          isActive && isExpanded ? "opacity-100" : "opacity-0"
                        }`}
                      ></div>
                    </div>
                  </Link>
                  {isActive && (
                    <div
                      className="absolute right-0 top-0 h-full w-[3px] bg-yellow-400"
                      style={{
                        boxShadow: "0 0 8px 1px rgba(250, 204, 21, 0.5)",
                      }}
                    ></div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer section - adjusted for better alignment */}
        <div
          className={`mt-auto p-4 ${
            isExpanded ? "px-4" : "px-2"
          } border-t border-gray-700/50`}
        >
          <div
            className={`flex items-center ${
              !isExpanded ? "justify-center" : ""
            }`}
          >
            {/* User Avatar */}
            {user && userProfileImage ? (
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
                <Image
                  src={userProfileImage}
                  alt={`${user.username}'s profile`}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                <FaUser className="w-5 h-5 text-gray-300" />
              </div>
            )}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? "w-[180px] ml-3" : "w-0 ml-0"
              }`}
            >
              {user && (
                <div className="flex flex-col justify-center">
                  <span className="text-white text-sm font-semibold truncate">
                    {user.fullName}
                  </span>
                  <span className="text-yellow-500 text-xs truncate">
                    @{user.username}
                  </span>
                </div>
              )}
            </div>

            {isExpanded && (
              <button
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800/50 hover:bg-red-600/80 transition-all duration-300 ml-2"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Logout"
              >
                {isLoggingOut ? (
                  <FaSpinner className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <FaRightFromBracket className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Aside);
