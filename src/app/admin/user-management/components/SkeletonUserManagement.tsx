import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonUserManagement: React.FC = React.memo(() => {
  const headers = [
    "Number",
    "Username",
    "Role",
    "Organizations",
    "Team Members",
    "Action",
  ];

  return (
    <div className="bg-[#E3E6EB] min-h-screen">
      <div className="flex flex-col items-center justify-center flex-grow p-4">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-950 mb-4">
          User Management Table
        </h1>
        <div className="w-full max-w-full px-4 lg:px-12 relative">
          <div className="flex justify-end">
            <Skeleton width={140} height={40} className="rounded-lg" />
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white rounded-xl overflow-hidden">
              <thead className="bg-gray-50 sticky top-0 z-30 rounded-t-xl">
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 md:px-6 md:py-3 text-start text-xs md:text-sm 2xl:text-base font-bold text-gray-900 uppercase tracking-wider"
                    >
                      <div className="flex items-center">
                        <Skeleton className="w-full" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b">
                    {headers.map((header) => (
                      <td
                        key={`${index}-${header}`}
                        className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap border-r border-gray-100"
                      >
                        <Skeleton className="w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

SkeletonUserManagement.displayName = "SkeletonUserManagement";

export default SkeletonUserManagement;
