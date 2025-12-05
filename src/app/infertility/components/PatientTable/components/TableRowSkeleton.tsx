import React from "react";
import { TableHeader } from "../utils/tableUtils";

interface TableRowSkeletonProps {
  headers: TableHeader[];
}

// Pinned column styles for skeleton
const pinnedBaseStyles = "sticky z-20 bg-slate-50";
const firstPinnedStyles = `${pinnedBaseStyles} left-0`;
const secondPinnedStyles = `${pinnedBaseStyles} left-[70px] sm:left-[80px] md:left-[90px]`;

const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({ headers }) => (
  <tr className="border-b border-gray-200">
    {headers.map((header, index) => {
      const isFirstPinned = index === 0;
      const isSecondPinned = index === 1;

      const cellClasses = `
        px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3.5
        ${isFirstPinned ? firstPinnedStyles : ""}
        ${isSecondPinned ? secondPinnedStyles : ""}
      `;

      return (
        <td key={header.key} className={cellClasses}>
          <div className="animate-pulse bg-slate-200 h-3 sm:h-4 rounded w-full max-w-[80px] sm:max-w-[100px]"></div>
        </td>
      );
    })}
  </tr>
);

export default TableRowSkeleton;
