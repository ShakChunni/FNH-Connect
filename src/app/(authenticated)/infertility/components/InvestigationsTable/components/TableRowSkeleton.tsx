import React from "react";
import { TableHeader } from "../utils";

interface TableRowSkeletonProps {
  headers: TableHeader[];
  rowIndex: number;
}

const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({
  headers,
  rowIndex,
}) => {
  const FIRST_COL_WIDTH = "w-[90px] min-w-[90px]";
  const SECOND_COL_WIDTH = "w-[180px] min-w-[180px]";

  const getCellClasses = (headerIndex: number) => {
    const baseClasses = "px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4";

    if (headerIndex === 0) {
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:z-10 lg:left-0 lg:bg-white`;
    }
    if (headerIndex === 1) {
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:z-10 lg:left-[90px] lg:bg-white`;
    }
    return baseClasses;
  };

  return (
    <tr className="animate-pulse">
      {headers.map((header, index) => (
        <td key={header.key} className={getCellClasses(index)}>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
      ))}
    </tr>
  );
};

export default TableRowSkeleton;
