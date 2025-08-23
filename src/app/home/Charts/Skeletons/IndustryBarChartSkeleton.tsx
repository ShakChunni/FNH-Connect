import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const IndustryBarChartSkeleton: React.FC = () => {
  // Create an array of 15 items to match the maximum number of bars shown in the actual chart
  const barCount = 8;

  return (
    <div className="w-full h-full p-4">
      <div className="flex flex-col space-y-4 w-full">
        {/* Y-axis labels and bars */}
        {Array.from({ length: barCount }).map((_, index) => (
          <div key={index} className="flex items-center w-full">
            {/* Y-axis label skeleton */}
            <div className="w-[25%] min-w-[80px] max-w-[150px] pr-4">
              <Skeleton width={Math.random() * 40 + 60} height={14} />
            </div>

            {/* Bar skeleton with varying widths to create a more realistic look */}
            <div className="flex-grow">
              <Skeleton
                height={Math.max(16, Math.min(28, 22))}
                width={`${Math.random() * 50 + 30}%`}
                borderRadius="8px"
                style={{
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* X-axis skeleton */}
      <div className="mt-4 pl-[25%] min-pl-[80px] max-pl-[150px]">
        <div className="flex justify-between">
          <Skeleton width={30} height={12} />
          <Skeleton width={30} height={12} />
          <Skeleton width={30} height={12} />
          <Skeleton width={30} height={12} />
        </div>
      </div>
    </div>
  );
};

export default IndustryBarChartSkeleton;
