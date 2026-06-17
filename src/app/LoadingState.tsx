import type { PortalType } from "@/types/auth";

interface LoadingStateProps {
  type?: "authenticating" | "loading" | "logout" | "switching";
  message?: string;
  description?: string;
  className?: string;
  portal?: PortalType;
}

const LoadingState = ({
  type = "loading",
  message,
  description,
  className = "",
  portal = "general",
}: LoadingStateProps) => {
  const isInfertility = portal === "infertility";
  const logoSrc = isInfertility ? "/hsi-logo.png" : "/fnh-logo.svg";
  const logoAlt = isInfertility ? "HSI Center Logo" : "FNH Logo";
  const footerLabel = isInfertility ? "HSI Center" : "FNH Connect";

  // Default messages based on type
  const getDefaultMessage = () => {
    switch (type) {
      case "authenticating":
        return "Authenticating";
      case "logout":
        return "Signing Out";
      case "switching":
        return "Switching Portal";
      default:
        return "Loading";
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case "authenticating":
        return "Verifying your credentials";
      case "logout":
        return "See you soon";
      case "switching":
        return "Preparing the selected workspace";
      default:
        return "Preparing your experience";
    }
  };

  const finalMessage = message || getDefaultMessage();
  const finalDescription = description || getDefaultDescription();

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-fnh-porcelain overflow-hidden ${className}`}
    >
      {/* Main content container - fixed height to prevent layout shift */}
      <div className="flex flex-col items-center justify-center flex-1 px-4">
        {/* Logo container with fixed dimensions to prevent layout shift */}
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 mb-8 sm:mb-12">
          {/* Glow background - pure CSS animation with FNH blue */}
          <div className="absolute inset-0 rounded-full bg-fnh-blue/30 blur-3xl scale-[2] animate-loading-glow-in" />

          {/* Portal logo - pure CSS light-up animation */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={logoAlt}
            className="absolute inset-0 w-full h-full object-contain animate-loading-logo-light-up"
          />
        </div>

        {/* Text content - pure CSS fade in with delay */}
        <div className="flex flex-col items-center animate-loading-text-fade-in">
          {/* Description */}
          <p className="text-sm sm:text-base text-gray-500 text-center">
            {finalDescription}
          </p>
        </div>
      </div>

      {/* Footer branding - pure CSS fade in with longer delay */}
      <div className="pb-6 sm:pb-8 animate-loading-footer-fade-in">
        <p className="text-[10px] sm:text-xs text-gray-400 tracking-wider uppercase">
          {footerLabel}
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
