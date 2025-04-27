import React from "react";

const HorizontalSkeletonBarChart = () => {
  return (
    <div className="bg-[#F4F8FC] p-4 rounded-2xl shadow-md h-full">
      <h3 className="text-xl font-bold mb-4">Metrics</h3>
      <div className="space-y-4">
        {[80, 65, 50, 35, 45, 70].map((width, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-16 text-right">
              <div className="h-4 w-12 bg-[#D1D5DB] rounded animate-pulse" />
            </div>
            <div className="flex-grow">
              <div
                className={`h-8 bg-[#D1D5DB] rounded animate-pulse`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalSkeletonBarChart;
