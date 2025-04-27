import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonThreeDPieChart: React.FC = () => {
  return (
    <div className="bg-[#F4F8FC] p-4 rounded-2xl shadow-md h-full flex flex-col">
      <h3 className="text-xl text-blue-950 font-bold mb-4 self-start">
        Lead Source
      </h3>
      <div className="flex-grow flex justify-center items-center">
        <Skeleton
          circle={true}
          height={400}
          width={400}
          baseColor="#D1D5DB"
          highlightColor="#F3F4F6"
          className="skeleton-pulse"
        />
      </div>
    </div>
  );
};

export default SkeletonThreeDPieChart;
