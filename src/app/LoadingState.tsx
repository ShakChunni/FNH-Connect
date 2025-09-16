import { useEffect, useState } from "react";

interface LoadingStateProps {
  type?: "authenticating" | "loading" | "logout";
  message?: string;
  description?: string;
  className?: string;
}

const LoadingState = ({
  type = "loading",
  message,
  description,
  className = "",
}: LoadingStateProps) => {
  // FIXED: Complete client-side only rendering to prevent SSR hydration issues
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default messages based on type
  const getDefaultMessage = () => {
    switch (type) {
      case "authenticating":
        return "Authenticating...";
      case "logout":
        return "Logging Out...";
      default:
        return "Loading...";
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case "authenticating":
        return "Please wait while we verify your credentials.";
      case "logout":
        return "Please wait while we log you out.";
      default:
        return "Please wait...";
    }
  };

  const finalMessage = message || getDefaultMessage();
  const finalDescription = description || getDefaultDescription();

  // Always return the same static content regardless of mount state
  // This prevents hydration mismatches completely
  return (
    <div
      className={`flex items-center justify-center min-h-screen bg-white p-4 sm:p-8 ${className}`}
    >
      <div className="flex flex-col items-center p-4 sm:p-8 bg-transparent">
        {/* Unified spinner without framer-motion to prevent SSR issues */}
        <div
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-t-transparent border-black mb-4 sm:mb-8 ${
            mounted ? "animate-spin" : ""
          }`}
          suppressHydrationWarning
        />

        {/* Main Message */}
        <p className="text-lg sm:text-xl text-black font-semibold">
          {finalMessage}
        </p>

        {/* Description */}
        <p className="text-sm sm:text-base text-black mt-2 sm:mt-4 text-center">
          {finalDescription}
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
