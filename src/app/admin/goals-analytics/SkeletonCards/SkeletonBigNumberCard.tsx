import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { FaUsers } from "react-icons/fa6";

interface SkeletonBigNumberCardProps {
  icon?: React.ReactNode;
  backgroundColor?: string;
}

const SkeletonBigNumberCard: React.FC<SkeletonBigNumberCardProps> = ({
  icon = <FaUsers size={130} />,
  backgroundColor = "#85CE96",
}) => {
  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-lg p-6 min-h-[180px] h-full flex flex-col justify-center"
      style={{ backgroundColor }}
    >
      {/* Icon at top right with opacity */}
      <div className="absolute right-4 top-4 text-[#fff] opacity-20">
        {icon}
      </div>

      <div className="relative z-10">
        {/* Title skeleton */}
        <div className="text-white text-sm sm:text-base md:text-lg font-medium mb-3">
          <Skeleton
            width={180}
            height={20}
            baseColor="rgba(255, 255, 255, 0.2)"
            highlightColor="rgba(255, 255, 255, 0.3)"
          />
        </div>

        {/* Value skeleton */}
        <div className="text-white text-2xl sm:text-3xl md:text-4xl font-bold">
          <Skeleton
            width={80}
            height={40}
            baseColor="rgba(255, 255, 255, 0.2)"
            highlightColor="rgba(255, 255, 255, 0.3)"
          />
        </div>
      </div>
    </div>
  );
};

export default SkeletonBigNumberCard;
