import React from "react";
import { TableHeader } from "../utils/tableUtils";

interface TableRowSkeletonProps {
  headers: TableHeader[];
  rowIndex?: number;
}

// Pinned column styles for skeleton - matching actual table
const pinnedBaseStyles = "sticky z-20 bg-white";
const firstPinnedStyles = `${pinnedBaseStyles} left-0`;
const secondPinnedStyles = `${pinnedBaseStyles} left-[70px] sm:left-[80px] md:left-[90px]`;

// Skeleton widths for different column types - varied for natural look
const getSkeletonWidth = (headerKey: string, index: number): string => {
  const widthMap: Record<string, string> = {
    slNo: "w-6 sm:w-8",
    regId: "w-12 sm:w-16",
    patientName: "w-20 sm:w-28",
    age: "w-8 sm:w-10",
    gender: "w-10 sm:w-14",
    mobile: "w-16 sm:w-20",
    bloodPressure: "w-12 sm:w-16",
    gravida: "w-8 sm:w-10",
    husbandName: "w-20 sm:w-28",
    hospitalName: "w-24 sm:w-32",
    createdAt: "w-16 sm:w-20",
    actions: "w-12 sm:w-16",
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
    <tr className="border-b border-slate-100">
      {headers.map((header, index) => {
        const isFirstPinned = index === 0;
        const isSecondPinned = index === 1;

        const cellClasses = `
          px-2 py-3 sm:px-3 sm:py-4 md:px-4 md:py-4
          ${isFirstPinned ? firstPinnedStyles : ""}
          ${isSecondPinned ? secondPinnedStyles : ""}
        `;

        const skeletonWidth = getSkeletonWidth(header.key, index);

        return (
          <td key={header.key} className={cellClasses}>
            <div
              className={`rounded bg-slate-200 h-3.5 sm:h-4 ${skeletonWidth} animate-pulse`}
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
