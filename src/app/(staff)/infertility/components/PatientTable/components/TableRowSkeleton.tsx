import React from "react";
import { TableHeader } from "../utils/tableUtils";

interface TableRowSkeletonProps {
  headers: TableHeader[];
  rowIndex?: number;
}

// Fixed widths for pinned columns - must match TableRow widths
const FIRST_COL_WIDTH = "w-[90px] min-w-[90px]";
const SECOND_COL_WIDTH = "w-[180px] min-w-[180px]";

// Pinned column styles for skeleton - only on lg+ screens
const firstPinnedStyles = `lg:sticky lg:z-10 lg:left-0 lg:bg-slate-100 ${FIRST_COL_WIDTH}`;
const secondPinnedStyles = `lg:sticky lg:z-10 lg:left-[90px] lg:bg-slate-100 ${SECOND_COL_WIDTH}`;

// Skeleton widths for different column types - varied for natural look
const getSkeletonWidth = (headerKey: string, index: number): string => {
  const widthMap: Record<string, string> = {
    id: "w-8",
    patientFullName: "w-24 sm:w-32",
    patientAge: "w-10",
    husbandAge: "w-10",
    mobileNumber: "w-20",
    bloodPressure: "w-14",
    gravida: "w-8",
    para: "w-8",
    husbandName: "w-20 sm:w-28",
    hospitalName: "w-24 sm:w-32",
    createdAt: "w-16 sm:w-20",
    address: "w-24",
    infertilityType: "w-16",
  };

  return (
    widthMap[headerKey] ||
    (index % 3 === 0 ? "w-14" : index % 3 === 1 ? "w-18" : "w-20")
  );
};

const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({
  headers,
  rowIndex = 0,
}) => {
  // Staggered animation delay for smooth loading effect
  const animationDelay = rowIndex * 75;

  return (
    <tr className="border-b border-gray-100">
      {headers.map((header, index) => {
        const isFirstPinned = index === 0;
        const isSecondPinned = index === 1;

        const cellClasses = `
          px-2 py-3 sm:px-3 sm:py-4 md:px-4 md:py-4
          ${isFirstPinned ? firstPinnedStyles : ""}
          ${isSecondPinned ? secondPinnedStyles : ""}
        `;

        const skeletonWidth = getSkeletonWidth(header.key, index);

        // First column shows edit button skeleton too
        if (header.key === "id") {
          return (
            <td key={header.key} className={cellClasses}>
              <div className="flex items-center gap-2">
                <div
                  className="rounded bg-gray-200 h-4 w-6 animate-pulse"
                  style={{
                    animationDelay: `${animationDelay}ms`,
                    animationDuration: "1.5s",
                  }}
                />
                <div
                  className="rounded-lg bg-gray-200 h-7 w-7 animate-pulse"
                  style={{
                    animationDelay: `${animationDelay + 50}ms`,
                    animationDuration: "1.5s",
                  }}
                />
              </div>
            </td>
          );
        }

        return (
          <td key={header.key} className={cellClasses}>
            <div
              className={`rounded bg-gray-200 h-3.5 sm:h-4 ${skeletonWidth} animate-pulse`}
              style={{
                animationDelay: `${animationDelay}ms`,
                animationDuration: "1.5s",
              }}
            />
          </td>
        );
      })}
    </tr>
  );
};

export default TableRowSkeleton;
