import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const LeadSourcePieChartSkeleton: React.FC = () => {
  return (
    <div className=" rounded-3xl h-full flex flex-col">
      <div className="flex-grow flex justify-center items-center">
        <Skeleton
          circle={true}
          height={580} // Adjusted height for larger pie chart
          width={580}  // Adjusted width for larger pie chart
          baseColor="#D1D5DB"
          highlightColor="#F3F4F6"
          className="skeleton-pulse"
        />
      </div>
    </div>
  );
};

export default LeadSourcePieChartSkeleton;