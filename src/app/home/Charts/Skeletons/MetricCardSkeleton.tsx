import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full divide-y md:divide-y-0 md:divide-x divide-gray-300">
        {/* First metric skeleton */}
        <div className="flex flex-col items-center pb-8 md:pb-0 md:pr-8">
          {/* Circle skeleton */}
          <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] relative">
            <Skeleton circle width="100%" height="100%" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] rounded-full"></div>
            </div>
          </div>

          {/* Metric text content */}
          <div className="flex flex-col items-center mt-4">
            <Skeleton width={100} height={16} className="mb-2" />
            <Skeleton width={140} height={24} className="mb-2" />
            <div className="flex items-center mt-1">
              <Skeleton width={120} height={14} />
            </div>
          </div>
        </div>

        {/* Second metric skeleton */}
        <div className="flex flex-col items-center py-8 md:py-0 md:px-8">
          {/* Circle skeleton */}
          <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] relative">
            <Skeleton circle width="100%" height="100%" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] rounded-full "></div>
            </div>
          </div>

          {/* Metric text content */}
          <div className="flex flex-col items-center mt-4">
            <Skeleton width={100} height={16} className="mb-2" />
            <Skeleton width={140} height={24} className="mb-2" />
            <div className="flex items-center mt-1">
              <Skeleton width={120} height={14} />
            </div>
          </div>
        </div>

        {/* Third metric skeleton */}
        <div className="flex flex-col items-center pt-8 md:pt-0 md:pl-8">
          {/* Circle skeleton */}
          <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] relative">
            <Skeleton circle width="100%" height="100%" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] rounded-full"></div>
            </div>
          </div>

          {/* Metric text content */}
          <div className="flex flex-col items-center mt-4">
            <Skeleton width={100} height={16} className="mb-2" />
            <Skeleton width={140} height={24} className="mb-2" />
            <div className="flex items-center mt-1">
              <Skeleton width={120} height={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCardSkeleton;
