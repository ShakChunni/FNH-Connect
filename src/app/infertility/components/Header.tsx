import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthContext";
import HeaderNavigation from "@/app/components/HeaderNavigation";
import useMediaQuery from "@/app/hooks/useMediaQuery";

const Header: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery("(max-width: 1023px)");

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
    return <span className="text-blue-950 font-extrabold">Goal Dashboard</span>;
  }, []);

  return (
    <div className="border-b border-b-[#C2C8D6] w-full h-16 flex-grow-0 bg-[#E3E6EB]">
      <nav className="px-4 md:px-8 lg:px-12 py-3 w-full">
        <div className="flex justify-between items-center gap-2">
          <h1 className="hidden sm:block text-xl md:text-2xl font-bold text-gray-800">
            {headerText}
          </h1>
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
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
