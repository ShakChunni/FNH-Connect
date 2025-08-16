import React, { useState, useCallback } from "react";
import { Button } from "@radix-ui/themes";
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

  return (
    <div className="border-b border-b-[#C2C8D6] w-full h-16 flex-grow-0 bg-[#E3E6EB]">
      <nav className="px-4 md:px-8 lg:px-12 py-3 w-full">
        <div className="flex justify-between items-center gap-2">
          <h1 className="hidden sm:block text-xl md:text-2xl font-bold text-gray-800">
            <span className="text-blue-950 font-semibold">
              Prospecting Platform
            </span>
          </h1>
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            {isMobile && <HeaderNavigation />}
          </div>
        </div>
      </nav>
    </div>
  );
};

Header.displayName = "Header";

export default React.memo(Header);
