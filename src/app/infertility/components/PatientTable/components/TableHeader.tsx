import React, { useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface TableHeaderProps {
  headers: { key: string; label: string }[];
  sortConfig: { key: string; direction: string } | null;
  requestSort: (key: string) => void;
  currentPage: number;
  totalRows: number;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  headers,
  sortConfig,
  requestSort,
  currentPage,
  totalRows,
}) => {
  // Animation transition consistent with other components
  const motionTransition = useMemo(
    () => ({
      duration: 0.3,
      ease: "easeOut",
    }),
    []
  );

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return (
      <motion.span
        initial={{
          opacity: 0,
          y: sortConfig.direction === "ascending" ? 3 : -3,
        }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="inline-flex ml-1 xs:ml-1.5 sm:ml-2"
      >
        {sortConfig.direction === "ascending" ? (
          <ChevronUp className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-blue-800" />
        ) : (
          <ChevronDown className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-blue-800" />
        )}
      </motion.span>
    );
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
    <thead className="bg-gray-100 sticky top-0 z-30 shadow-sm">
      <tr>
        {headers.map((header, index) => (
          <th
            key={header.key}
            className={`px-3 xs:px-4 sm:px-5 md:px-6 py-2.5 xs:py-3 sm:py-3.5 
              text-2xs xs:text-xs sm:text-sm font-medium text-gray-900 
              uppercase tracking-wider cursor-pointer transition-colors
              ${
                index === 0
                  ? `md:sticky md:left-0 md:top-0 md:bg-gray-100 md:z-30 
                   md:border-r md:border-gray-200 text-center font-bold`
                  : "text-start hover:bg-gray-200"
              } 
              ${
                index === 1
                  ? `md:sticky md:top-0 md:bg-gray-100 md:z-30 
                   md:border-r md:border-gray-200 hover:bg-gray-200`
                  : ""
              }`}
            style={index === 1 ? { left: getLeftValue() } : undefined}
            onClick={() => requestSort(header.key)}
          >
            <motion.div
              whileHover={{ color: "#1e40af" }}
              className="transition-colors flex items-center whitespace-nowrap"
            >
              {header.label}
              {getSortIcon(header.key)}
            </motion.div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default React.memo(TableHeader);
