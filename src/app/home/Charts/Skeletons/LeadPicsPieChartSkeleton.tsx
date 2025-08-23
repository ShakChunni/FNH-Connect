import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const LeadPicsPieChartSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl h-full flex flex-col">
      <div className="flex-grow flex justify-center items-center">
        <Skeleton
          circle={true}
          height={320} // Adjusted height for larger pie chart
          width={320} // Adjusted width for larger pie chart
          baseColor="#D1D5DB"
          highlightColor="#F3F4F6"
          className="skeleton-pulse"
        />
      </div>
    </div>
  );
};

export default LeadPicsPieChartSkeleton;
