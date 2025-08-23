import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const StagesBarChartSkeleton: React.FC = () => {
  // Create an array based on the typical number of stages shown in the actual chart
  const barCount = 5; // Adjust this based on your typical number of stages

  return (
    <div className="w-full h-full p-4">
      <div className="flex flex-col space-y-6 w-full">
        {/* Y-axis labels and bars */}
        {Array.from({ length: barCount }).map((_, index) => (
          <div key={index} className="flex items-center w-full">
            {/* Y-axis label skeleton - stages usually have longer names */}
            <div className="w-[25%] min-w-[80px] max-w-[150px] pr-4">
              <Skeleton width={Math.random() * 50 + 70} height={6} />
            </div>

            {/* Bar skeleton with varying widths to create a more realistic look */}
            <div className="flex-grow">
              <Skeleton
                height={isSmallBar(index) ? 8 : 18} // Match the varying bar thickness in the real chart
                width={`${getRandomWidth(index)}%`}
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
      <div className="mt-6 pl-[25%] min-pl-[80px] max-pl-[150px]">
        <div className="flex justify-between">
          <Skeleton width={30} height={12} />
          <Skeleton width={30} height={12} />
          <Skeleton width={30} height={12} />
          <Skeleton width={30} height={12} />
          <Skeleton width={30} height={12} />
        </div>
      </div>
    </div>
  );
};

// Helper function to determine if this should be a small bar
// Creates a more realistic effect with varied bar heights
const isSmallBar = (index: number): boolean => {
  return window.innerWidth <= 600 || index % 3 === 0;
};

// Helper function to generate random but descending widths
// Creates a more realistic effect as stages often show in descending order
const getRandomWidth = (index: number): number => {
  const baseWidth = Math.max(70 - index * 8, 20); // Descending widths based on index
  return baseWidth + Math.random() * 15; // Add some randomness
};

export default StagesBarChartSkeleton;
