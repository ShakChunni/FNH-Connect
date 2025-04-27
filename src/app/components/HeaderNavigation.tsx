"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/AuthContext";
import {
  MdHome,
  MdOutlineExplore,
  MdAssessment,
  MdLogout,
  MdPeople,
  MdHistory,
  MdFlag,
} from "react-icons/md";
import {
  FaUserCircle,
  FaSpinner,
  FaBullseye,
  FaClipboardList,
} from "react-icons/fa";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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
  "tanvir",
];

const HeaderNavigation = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  }, [logout]);

  // Determine if the user has a custom profile image
  const userProfileImage = useMemo(() => {
    if (user && usersWithImages.includes(user.username.toLowerCase())) {
      return `/${user.username.toLowerCase()}.jpg`;
    }
    return null;
  }, [user]);

  const listItems = useMemo(() => {
    const items = [
      { label: "Sales Dashboard", href: "/home", icon: MdHome },
      { label: "Goal Dashboard", href: "/goals", icon: FaBullseye },
    ];

    if (user?.role === "admin") {
      items.push(
        {
          label: "Goal Analytics",
          href: "/admin/goals-analytics",
          icon: MdAssessment,
        },
        {
          label: "Goal Management",
          href: "/admin/goals-management",
          icon: FaClipboardList,
        },
        {
          label: "Activity Log",
          href: "/admin/activity-logs",
          icon: MdHistory,
        },
        {
          label: "User Management",
          href: "/admin/user-management",
          icon: MdPeople,
        }
      );
    }

    return items;
  }, [user]);

  const activeItem = useMemo(() => {
    return listItems.find((item) => pathname === item.href);
  }, [pathname, listItems]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center p-2 rounded-full hover:bg-gray-200 transition-all duration-300"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {user && userProfileImage ? (
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={userProfileImage}
              alt={`${user.username}'s profile`}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <FaUserCircle className="w-8 h-8 text-customBlue" />
        )}
      </button>
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow-lg z-50"
          >
            <ul className="py-1 text-xs">
              {listItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-customBlue transition-all duration-300 ${
                      activeItem?.href === item.href
                        ? "font-bold text-customBlue"
                        : ""
                    }`}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <item.icon
                      className={`w-4 h-4 mr-1 ${
                        activeItem?.href === item.href
                          ? "text-customBlue-dark"
                          : ""
                      }`}
                      style={{
                        fontWeight:
                          activeItem?.href === item.href ? "bold" : "normal",
                      }}
                    />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-customBlue transition-all duration-300"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MdLogout className="w-4 h-4 mr-2" />
                  )}
                  Logout
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeaderNavigation;
