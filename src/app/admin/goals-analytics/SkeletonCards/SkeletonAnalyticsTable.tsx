import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonAnalyticsTable: React.FC = () => {
  const headers = ["Date", "Type", "Task", "Quantity", "Time Spent"];

  return (
    <div className="bg-[#F4F8FC] rounded-2xl shadow-lg p-6 mb-8">
      <div className="overflow-x-auto overflow-y-auto w-full">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <Skeleton baseColor="#D1D5DB" highlightColor="#F3F4F6" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <tr className="bg-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                    <Skeleton
                      circle={true}
                      height={32}
                      width={32}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                      className="mr-2"
                    />
                    <Skeleton
                      width={100}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                    />
                  </td>
                  <td colSpan={4}></td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center justify-between">
                    <Skeleton
                      width={50}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                    />
                    <Skeleton
                      circle={true}
                      height={16}
                      width={16}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                    />
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Skeleton
                      width={30}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Skeleton
                      width={50}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                    />
                  </td>
                </tr>
                {[...Array(3)].map((_, subRowIndex) => (
                  <tr key={subRowIndex} className="bg-gray-200">
                    <td colSpan={1}></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                      <Skeleton
                        width={50}
                        baseColor="#D1D5DB"
                        highlightColor="#F3F4F6"
                      />
                    </td>
                    <td></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Skeleton
                        width={30}
                        baseColor="#D1D5DB"
                        highlightColor="#F3F4F6"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Skeleton
                        width={50}
                        baseColor="#D1D5DB"
                        highlightColor="#F3F4F6"
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkeletonAnalyticsTable;
