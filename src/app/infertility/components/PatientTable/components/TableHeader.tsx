import React from "react";
import { TableHeader as TableHeaderType, SortConfig } from "../../../types";

interface TableHeaderProps {
  headers: TableHeaderType[];
  sortConfig: SortConfig | null;
  requestSort: (key: string) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  headers,
  sortConfig,
  requestSort,
}) => (
  <thead className="bg-fnh-porcelain">
    <tr>
      {headers.map((header) => (
        <th
          key={header.key}
          className="px-4 py-3 text-left text-xs font-semibold text-fnh-grey-dark uppercase tracking-wider cursor-pointer hover:bg-fnh-grey-lighter transition-colors"
          onClick={() => requestSort(header.key)}
        >
          <div className="flex items-center gap-1">
            {header.label}
            {sortConfig?.key === header.key && (
              <span className="text-fnh-blue">
                {sortConfig.direction === "ascending" ? "↑" : "↓"}
              </span>
            )}
          </div>
        </th>
      ))}
    </tr>
  </thead>
);

export default TableHeader;
