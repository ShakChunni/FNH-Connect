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
  return (
    <tr className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
      {headers.map((header, index) => (
        <td
          key={header.key}
          className="px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4"
        >
          <div
            className={`h-4 bg-gray-200 rounded animate-pulse ${
              index === 0
                ? "w-8"
                : index === 1
                ? "w-20"
                : index === 2
                ? "w-32"
                : "w-24"
            }`}
          />
        </td>
      ))}
    </tr>
  );
};

export default TableRowSkeleton;
