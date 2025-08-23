import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/AuthContext";
import HeaderNavigation from "@/app/components/HeaderNavigation";
import useMediaQuery from "@/app/hooks/useMediaQuery";

const Header: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery("(max-width: 1023px)");

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

  return (
    <div className="sticky top-0 z-40 border-b border-b-[#e5eaf3] w-full h-16 flex-shrink-0 bg-[#f6f9fd] shadow-sm">
      <nav className="px-4 md:px-8 lg:px-12 py-3 w-full h-full">
        <div className="flex justify-between items-center gap-2 h-full">
          {isMobile ? (
            <HeaderNavigation />
          ) : (
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
              Infertility Management
            </h1>
          )}
        </div>
      </nav>
    </div>
  );
};

Header.displayName = "Header";

export default Header;
