import React from "react";
import { TableHeader } from "../types";

interface TableRowSkeletonProps {
  headers: TableHeader[];
}

const TableRowSkeleton: React.FC<TableRowSkeletonProps> = ({ headers }) => (
  <tr>
    <td className="px-4 py-4">
      <div className="animate-pulse bg-fnh-grey-lighter h-4 rounded"></div>
    </td>
    {headers.map((header) => (
      <td key={header.key} className="px-4 py-4">
        <div className="animate-pulse bg-fnh-grey-lighter h-4 rounded"></div>
      </td>
    ))}
  </tr>
);

export default TableRowSkeleton;
