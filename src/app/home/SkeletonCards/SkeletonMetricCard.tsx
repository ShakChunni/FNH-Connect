import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Separator } from "@radix-ui/themes";

const SkeletonMetricCard: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[#F4F8FC] rounded-2xl shadow-md">
      <div className="flex flex-col sm:flex-row xl:flex-col 3xl:flex-row items-center justify-between w-full space-y-6 sm:space-y-0 xl:space-y-6 3xl:space-y-0 sm:space-x-6 xl:space-x-0 3xl:space-x-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 md:space-x-8">
          <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]">
            <Skeleton
              circle={true}
              height="100%"
              width="100%"
              baseColor="#D1D5DB"
              highlightColor="#F3F4F6"
            />
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <Skeleton
              width={80}
              height={16}
              baseColor="#D1D5DB"
              highlightColor="#F3F4F6"
              className="mb-2"
            />
            <Skeleton
              width={100}
              height={24}
              baseColor="#D1D5DB"
              highlightColor="#F3F4F6"
              className="mb-2"
            />
            <div className="flex 3xl:flex-col 3xl:items-start items-center mt-1">
              <Skeleton
                width={60}
                height={16}
                baseColor="#D1D5DB"
                highlightColor="#F3F4F6"
              />
              <Skeleton
                width={90}
                height={12}
                baseColor="#D1D5DB"
                highlightColor="#F3F4F6"
                className="ml-1 3xl:ml-0 3xl:mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Vertical separator for horizontal layouts */}
        <Separator
          orientation="vertical"
          className="hidden sm:block xl:hidden 3xl:block h-32 bg-gray-300"
        />

        {/* Horizontal separator for vertical layouts */}
        <Separator
          orientation="horizontal"
          className="block sm:hidden xl:block 3xl:hidden w-full h-px bg-gray-300"
        />

        <div className="flex flex-col items-center sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 md:space-x-8">
          <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]">
            <Skeleton
              circle={true}
              height="100%"
              width="100%"
              baseColor="#D1D5DB"
              highlightColor="#F3F4F6"
            />
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <Skeleton
              width={80}
              height={16}
              baseColor="#D1D5DB"
              highlightColor="#F3F4F6"
              className="mb-2"
            />
            <Skeleton
              width={100}
              height={24}
              baseColor="#D1D5DB"
              highlightColor="#F3F4F6"
              className="mb-2"
            />
            <div className="flex 3xl:flex-col 3xl:items-start items-center mt-1">
              <Skeleton
                width={60}
                height={16}
                baseColor="#D1D5DB"
                highlightColor="#F3F4F6"
              />
              <Skeleton
                width={90}
                height={12}
                baseColor="#D1D5DB"
                highlightColor="#F3F4F6"
                className="ml-1 3xl:ml-0 3xl:mt-0.5"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonMetricCard;
