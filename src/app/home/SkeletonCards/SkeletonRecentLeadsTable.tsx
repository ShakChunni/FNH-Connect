import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonRecentLeadsTable: React.FC = () => {
  const headers = [
    "ID",
    "Client's Name",
    "Client's Location",
    "Lead Source",
    "Prospect Date",
    "PIC",
    "Meetings Conducted",
    "Meeting Date",
    "Proposal In Progress",
    "Proposal In Progress Date",
    "Proposal Sent Out",
    "Proposal Sent Out Date",
    "Quotation Signed",
    "Quotation Signed Date",
    "Quotation Number",
    "Type",
    "Notes",
    "Total Proposal Value [RM]",
    "Total Closed Sale [RM]",
  ];

  return (
    <div className="bg-[#E3E6EB] rounded-2xl shadow-md p-6 mb-8">
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Skeleton
              height={40}
              width={200}
              baseColor="#D1D5DB"
              highlightColor="#F3F4F6"
              className="rounded-xl"
            />
          </div>
          <Skeleton
            height={40}
            width={100}
            baseColor="#D1D5DB"
            highlightColor="#F3F4F6"
            className="rounded-lg"
          />
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <Skeleton
                    width={100}
                    baseColor="#D1D5DB"
                    highlightColor="#F3F4F6"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 10 }).map((_, index) => (
              <tr key={index} className="hover:bg-gray-100">
                {headers.map((_, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap">
                    <Skeleton
                      width={100}
                      baseColor="#D1D5DB"
                      highlightColor="#F3F4F6"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkeletonRecentLeadsTable;
