import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TableHeaderProps {
  headers: { key: string; label: string }[];
  sortConfig: { key: string; direction: string } | null;
  requestSort: (key: string) => void;
  currentPage: number; // Add this
  totalRows: number; // Add this
}

const TableHeader: React.FC<TableHeaderProps> = ({
  headers,
  sortConfig,
  requestSort,
  currentPage,
  totalRows,
}) => {
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    if (sortConfig.direction === "ascending") {
      return <ChevronUp className="w-4 h-4 inline" />;
    }
    if (sortConfig.direction === "descending") {
      return <ChevronDown className="w-4 h-4 inline" />;
    }
    return null;
  };

  const getLeftValue = () => {
    const startIndex = (currentPage - 1) * 50 + 1;
    const length = (totalRows - startIndex).toString().length;
    if (length >= 4) {
      return "8rem";
    } else if (length > 2) {
      return "7rem";
    } else {
      return "6rem";
    }
  };

  return (
    <thead className="bg-gray-100 sticky top-0 z-30">
      <tr>
        {headers.map((header, index) => (
          <th
            key={header.key}
            className={`px-6 py-3 text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer ${
              index === 0
                ? `md:sticky md:left-0 md:top-0 md:bg-gray-100 md:z-30 md:border-r md:border-gray-200 text-center text-lg font-extrabold`
                : "text-start"
            } ${
              index === 1
                ? `md:sticky md:left-[${getLeftValue()}] md:top-0 md:bg-gray-100 md:z-30 md:border-r-2 md:border-gray-200`
                : ""
            }`}
            onClick={() => requestSort(header.key)}
            style={index === 1 ? { left: getLeftValue() } : undefined}
          >
            {header.label} {getSortIcon(header.key)}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
