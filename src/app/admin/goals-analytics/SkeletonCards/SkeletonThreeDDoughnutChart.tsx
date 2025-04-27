import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonThreeDDoughnutChart: React.FC = () => {
  return (
    <div className="bg-[#F4F8FC] p-4 rounded-2xl shadow-md h-full">
      <h3 className="text-xl text-blue-950 font-bold mb-1">
        Task Types Distribution
      </h3>
      <div className="w-full h-48 sm:h-64 md:h-80 flex justify-center items-center">
        <Skeleton
          circle={true}
          height={280}
          width={280}
          baseColor="#D1D5DB"
          highlightColor="#F3F4F6"
          className="skeleton-pulse" // Add a class for the custom animation
        />
      </div>
    </div>
  );
};

export default SkeletonThreeDDoughnutChart;
