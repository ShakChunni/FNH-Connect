import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useMediaQuery } from "react-responsive";

const SkeletonCombinedChart: React.FC = () => {
  const isSmallScreen = useMediaQuery({ query: "(max-width: 600px)" });

  return (
    <div className="w-full bg-white rounded-3xl h-full flex flex-col md:flex-row">
      {/* Left side - Pie chart skeleton */}
      <div className="w-full md:w-2/5 mb-4 md:mb-0 flex items-center justify-center">
        <div
          className="relative"
          style={{ height: isSmallScreen ? 180 : 300, width: "100%" }}
        >
          {/* Outer circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton
              circle={true}
              height={isSmallScreen ? 180 : 300}
              width={isSmallScreen ? 180 : 300}
              baseColor="#E2E8F0"
              highlightColor="#F8FAFC"
            />
          </div>

          {/* Inner circle for donut effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="bg-white rounded-full"
              style={{
                height: isSmallScreen ? 117 : 195,
                width: isSmallScreen ? 117 : 195,
                zIndex: 2,
              }}
            >
              {/* Total label */}
              <div className="h-full w-full flex items-center justify-center flex-col">
                <Skeleton
                  width={40}
                  height={16}
                  baseColor="#E2E8F0"
                  highlightColor="#F8FAFC"
                />
                <Skeleton
                  width={30}
                  height={20}
                  baseColor="#E2E8F0"
                  highlightColor="#F8FAFC"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px bg-gray-200 mx-4"></div>

      {/* Right side - Table skeleton */}
      <div className="w-full md:w-3/5 px-2">
        {/* Table header */}
        <div className="mb-3 flex justify-between border-b pb-2">
          <div className="font-semibold text-xs sm:text-sm flex-1">
            <Skeleton width={80} baseColor="#E2E8F0" highlightColor="#F8FAFC" />
          </div>
          <div className="mr-12 w-20 text-end">
            <Skeleton width={60} baseColor="#E2E8F0" highlightColor="#F8FAFC" />
          </div>
          {!isSmallScreen && (
            <div className="text-right w-24 whitespace-nowrap">
              <Skeleton
                width={80}
                baseColor="#E2E8F0"
                highlightColor="#F8FAFC"
              />
            </div>
          )}
        </div>

        {/* Table rows */}
        <div className="w-full">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center py-1 px-1 mb-2">
              <div className="flex items-center flex-1">
                <Skeleton
                  width={16}
                  height={16}
                  className="mr-2"
                  baseColor="#E2E8F0"
                  highlightColor="#F8FAFC"
                />
                <Skeleton
                  width={isSmallScreen ? 80 : 120}
                  baseColor="#E2E8F0"
                  highlightColor="#F8FAFC"
                />
              </div>
              <div className="w-20 mr-12 text-end">
                <Skeleton
                  width={30}
                  baseColor="#E2E8F0"
                  highlightColor="#F8FAFC"
                />
              </div>
              {!isSmallScreen && (
                <div className="text-right w-24">
                  <Skeleton
                    width={50}
                    baseColor="#E2E8F0"
                    highlightColor="#F8FAFC"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkeletonCombinedChart;
