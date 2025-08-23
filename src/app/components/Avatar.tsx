import Image from "next/image";
import { useState } from "react";
import { UserRound } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

const Avatar = ({ src, alt, size = 40, className = "" }: AvatarProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  return (
    <div
      className={`rounded-full overflow-hidden bg-gray-200 border-2 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {src && !hasError ? (
        <div className="relative w-full h-full">
          {/* Show skeleton until image loads */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton
                circle
                height={size}
                width={size}
                baseColor="#e5e7eb"
                highlightColor="#f3f4f6"
              />
            </div>
          )}

          <Image
            src={src}
            alt={alt || "User avatar"}
            width={size}
            height={size}
            className={`object-cover w-full h-full transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={handleLoad}
            onError={handleError}
            style={{ objectFit: "cover" }}
            priority={false}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <UserRound
            className="text-gray-900"
            style={{
              width: size * 0.7,
              height: size * 0.7,
              strokeWidth: 1.5,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Avatar;
