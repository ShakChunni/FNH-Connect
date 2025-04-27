import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonGoalsPage: React.FC = React.memo(() => {
  return (
    <div className="bg-[#E3E6EB] min-h-screen pt-6">
      <div className="py-6 px-2 xl:px-0">
        <div className="px-4 lg:px-12 mx-auto">
          <div className="bg-[#F4F8FC] rounded-2xl p-8 shadow-md mb-8">
            <h2 className="text-lg xl:text-2xl font-bold mb-8 text-blue-800">
              <Skeleton
                width={200}
                height={30}
                baseColor="#D1D5DB"
                highlightColor="#F3F4F6"
                className="animate-pulse"
              />
            </h2>
            <div className="space-y-4">
              <div className="hidden xl:flex space-y-2 xl:space-y-0 xl:space-x-6 text-center">
                <div className="min-w-[150px] font-semibold text-sm xl:text-base">
                  <Skeleton
                    width={150}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
                <div className="min-w-[200px] px-4 flex-1 font-semibold text-sm xl:text-base">
                  <Skeleton
                    width={200}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
                <div className="w-24 font-semibold px-4 text-sm xl:text-base">
                  <Skeleton
                    width={50}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
                <div className="w-40 font-semibold text-sm xl:text-base">
                  <Skeleton
                    width={80}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
                <div className="flex-1 font-semibold text-sm xl:text-base">
                  <Skeleton
                    width={100}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col xl:flex-row space-y-2 xl:space-y-0 xl:space-x-6 py-2"
                >
                  <div className="min-w-[150px] font-semibold text-sm xl:text-base">
                    <Skeleton
                      width={150}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                  <div className="min-w-[200px] px-4 flex-1 font-semibold text-sm xl:text-base">
                    <Skeleton
                      width={200}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                  <div className="w-24 font-semibold px-4 text-sm xl:text-base">
                    <Skeleton
                      width={50}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                  <div className="w-40 font-semibold text-sm xl:text-base">
                    <Skeleton
                      width={80}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                  <div className="flex-1 font-semibold text-sm xl:text-base">
                    <Skeleton
                      width={100}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#F4F8FC] rounded-2xl p-8 shadow-md">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg xl:text-2xl font-bold text-blue-800">
                <Skeleton
                  width={200}
                  height={30}
                  baseColor="#D1D5DB"
                  highlightColor="#F3F4F6"
                  className="animate-pulse"
                />
              </h2>
              <Skeleton
                width={100}
                height={40}
                baseColor="#D1D5DB"
                highlightColor="#F3F4F6"
                className="rounded-xl animate-pulse"
              />
            </div>
            <div className="space-y-4">
              <div className="hidden xl:flex space-y-2 xl:space-y-0 xl:space-x-6 text-center">
                <div className="min-w-[150px] font-semibold text-sm xl:text-base">
                  <Skeleton
                    width={150}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
                <div className="min-w-[200px] px-4 flex-1 font-semibold text-sm xl:text-base">
                  <Skeleton
                    width={200}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
                <div className="w-24 font-semibold px-4 text-sm xl:text-base">
                  <Skeleton
                    width={50}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
                <div className="w-40 font-semibold text-sm xl:text-base">
                  <Skeleton
                    width={80}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
                <div className="flex-1 font-semibold text-sm xl:text-base">
                  <Skeleton
                    width={100}
                    height={20}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                    className="animate-pulse"
                  />
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col xl:flex-row space-y-2 xl:space-y-0 xl:space-x-6 py-2"
                >
                  <div className="min-w-[150px] font-semibold text-sm xl:text-base">
                    <Skeleton
                      width={150}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                  <div className="min-w-[200px] px-4 flex-1 font-semibold text-sm xl:text-base">
                    <Skeleton
                      width={200}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                  <div className="w-24 font-semibold px-4 text-sm xl:text-base">
                    <Skeleton
                      width={50}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                  <div className="w-40 font-semibold text-sm xl:text-base">
                    <Skeleton
                      width={80}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                  <div className="flex-1 font-semibold text-sm xl:text-base">
                    <Skeleton
                      width={100}
                      height={20}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="animate-pulse"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SkeletonGoalsPage.displayName = "SkeletonGoalsPage";

export default SkeletonGoalsPage;
