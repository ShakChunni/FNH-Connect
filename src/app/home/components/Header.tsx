import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthContext";
import TableSelector from "@/app/home/filters/TableSelector";
import HeaderNavigation from "@/app/components/HeaderNavigation";
import { useTableSelector } from "../../context/TableSelectorContext";
import useMediaQuery from "@/app/hooks/useMediaQuery";

const Header: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { tableSelectorValue } = useTableSelector();
  const isMobile = useMediaQuery("(max-width: 1023px)"); // Use media query to check screen width

  // Memoize handlers
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, router]);

  // Memoize utility functions
  const capitalizeFirstLetter = useCallback((string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }, []);

  // Memoize computed values
  const headerText = useMemo(() => {
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
  }, [tableSelectorValue]);

  const showTableSelector = useMemo(() => {
    return (
      user?.role === "admin" ||
      (user?.role &&
        ["salesperson", "manager"].includes(user.role) &&
        user?.organizations &&
        user.organizations.length > 1)
    );
  }, [user?.role, user?.organizations]);

  return (
    <div className="border-b border-b-[#C2C8D6] w-full h-16 flex-grow-0 bg-[#E3E6EB]">
      <nav className="px-4 md:px-8 lg:px-12 py-3 w-full">
        <div className="flex justify-between items-center gap-2">
          <h1 className="hidden sm:block text-xl lg:text-2xl font-bold text-gray-800">
            {headerText}
          </h1>
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            {showTableSelector && (
              <TableSelector defaultValue={tableSelectorValue} />
            )}
            {isMobile && <HeaderNavigation />}{" "}
            {/* Show HeaderNavigation on mobile */}
          </div>
        </div>
      </nav>
    </div>
  );
};

Header.displayName = "Header";

export default Header;
