import React from "react";

interface SkeletonGoalManagementProps {
  viewMode: string;
}

const SkeletonTaskCard = ({ viewMode }: { viewMode: string }) => (
  <div
    className={`
      bg-white rounded-2xl p-6
      border border-gray-100
      ${viewMode === "list" ? "w-full" : ""}
      shadow-[0_2px_8px_rgb(0,0,0,0.08)]
    `}
  >
    <div className="flex justify-between items-start mb-3">
      <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
      <div className="px-3 py-1 rounded-full bg-gray-200 w-16 h-5 animate-pulse"></div>
    </div>

    <div className="text-sm text-gray-600 mb-3">
      <div className="mb-1 flex items-center">
        <div className="h-4 w-10 bg-gray-200 rounded animate-pulse mr-2"></div>
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>

    <div className="mb-4">
      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-200 px-3 py-1 rounded-lg h-6 w-20 animate-pulse"
          ></div>
        ))}
      </div>
    </div>

    <div className="flex gap-3 mt-4 border-t pt-4">
      <div className="h-6 w-10 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

const SkeletonGoalManagement: React.FC<SkeletonGoalManagementProps> = ({
  viewMode,
}) => {
  return (
    <div className="min-h-[400px]">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm text-blue-950">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="bg-gray-200 h-10 w-32 rounded-xl animate-pulse"></div>
      </div>

      {/* Tasks Grid/List */}
      <div
        className={`
          ${
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-4"
          }
        `}
      >
        {/* Generate multiple skeleton cards based on the view mode */}
        {Array.from({ length: viewMode === "grid" ? 6 : 4 }).map((_, i) => (
          <SkeletonTaskCard key={i} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
};

export default SkeletonGoalManagement;
