import React, { useState, useRef, useMemo } from "react";
import { useAuth } from "@/app/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/pagination/Pagination";
import TableRow from "./components/TableRow";
import TableRowSkeleton from "./components/TableRowSkeleton";
import { InfertilityPatientData, SortConfig } from "../../types";
import { getTableHeaders, TableHeader } from "./utils";

interface PatientTableProps {
  tableData: InfertilityPatientData[];
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
  customOptions?: any;
  onSearch?: (searchTerm: string) => void;
  onEdit?: (patient: InfertilityPatientData) => void;
  isLoading?: boolean;
  enableAutoSearch?: boolean;
  debounceMs?: number;
  minSearchLength?: number;
}

// Pinned column header styles
const pinnedHeaderBase = "sticky z-30 bg-slate-100 md:bg-slate-200/90";
const firstPinnedHeader = `${pinnedHeaderBase} left-0`;
const secondPinnedHeader = `${pinnedHeaderBase} left-[70px] sm:left-[80px] md:left-[90px]`;

const PatientTable: React.FC<PatientTableProps> = ({
  tableData = [],
  onMessage,
  messagePopupRef,
  customOptions,
  onSearch,
  onEdit,
  isLoading = false,
  enableAutoSearch = true,
  debounceMs = 500,
  minSearchLength = 2,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Sorting logic for infertility patients
  const sortedData = useMemo(() => {
    const sortableData = [...tableData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === "ascending" ? 1 : -1;
        if (key.endsWith("DOB") || key === "createdAt" || key === "updatedAt") {
          const dateA = a[key as keyof InfertilityPatientData]
            ? new Date(
                a[key as keyof InfertilityPatientData] as string
              ).getTime()
            : 0;
          const dateB = b[key as keyof InfertilityPatientData]
            ? new Date(
                b[key as keyof InfertilityPatientData] as string
              ).getTime()
            : 0;
          return (dateA - dateB) * dir;
        }
        if (
          typeof a[key as keyof InfertilityPatientData] === "number" &&
          typeof b[key as keyof InfertilityPatientData] === "number"
        ) {
          return (
            ((a[key as keyof InfertilityPatientData] as number) -
              (b[key as keyof InfertilityPatientData] as number)) *
            dir
          );
        }
        const valA = (a[key as keyof InfertilityPatientData] || "")
          .toString()
          .toLowerCase();
        const valB = (b[key as keyof InfertilityPatientData] || "")
          .toString()
          .toLowerCase();
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }
    return sortableData;
  }, [tableData, sortConfig]);

  const filteredData = sortedData;

  const {
    currentPage,
    totalPages,
    visiblePages,
    paginationMeta,
    goToPage,
    goToPrev,
    goToNext,
  } = usePagination({
    totalResults: filteredData.length,
    pageSize: 50,
    initialPage: 1,
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * 50,
    currentPage * 50
  );

  const headers = getTableHeaders();

  // Sorting
  const requestSort = (key: string) => {
    if (key === "id") return; // Don't sort by row number
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    } else if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "descending"
    ) {
      setSortConfig(null);
      return;
    }
    setSortConfig({ key, direction });
  };

  // Search
  const handleClearSearch = () => {
    setSearchTerm("");
    if (onSearch) onSearch("");
  };
  const handleSearch = () => {
    if (onSearch) onSearch(searchTerm);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (enableAutoSearch && value.length >= minSearchLength) {
      if (onSearch) onSearch(value);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Get header classes based on pinning and position
  const getHeaderClasses = (header: TableHeader, index: number) => {
    const baseClasses = `
      px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4
      text-left text-[10px] sm:text-xs md:text-xs
      font-semibold text-gray-700 uppercase tracking-wider
      transition-colors
      ${header.key !== "id" ? "cursor-pointer hover:bg-slate-200/80" : ""}
    `;

    if (index === 0) {
      return `${baseClasses} ${firstPinnedHeader}`;
    }
    if (index === 1) {
      return `${baseClasses} ${secondPinnedHeader}`;
    }
    return baseClasses;
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
      {/* Search Bar - Responsive */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search patients by name, phone, or ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm transition-all duration-200"
            />
          </div>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="px-3 py-2 sm:px-4 sm:py-2.5 md:py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      {isLoading ? (
        <div
          className="overflow-x-auto overflow-y-auto w-full"
          style={{ maxHeight: "600px" }}
          ref={tableContainerRef}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-100 sticky top-0 z-20">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={header.key}
                    className={getHeaderClasses(header, index)}
                  >
                    <div className="flex items-center gap-1 sm:gap-2 group">
                      {header.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 10 }).map((_, index) => (
                <TableRowSkeleton key={index} headers={headers} />
              ))}
            </tbody>
          </table>
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-500">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-base sm:text-lg font-medium">No patients found</p>
          <p className="text-xs sm:text-sm mt-1">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <div
          className="overflow-x-auto overflow-y-auto w-full"
          style={{ maxHeight: "600px" }}
          ref={tableContainerRef}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-100 sticky top-0 z-20">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={header.key}
                    className={getHeaderClasses(header, index)}
                    onClick={() => requestSort(header.key)}
                  >
                    <div className="flex items-center gap-1 sm:gap-2 group">
                      <span className="whitespace-nowrap">{header.label}</span>
                      {sortConfig?.key === header.key && (
                        <span className="text-blue-600">
                          {sortConfig.direction === "ascending" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <TableRow
                  key={row.id}
                  row={row}
                  index={(currentPage - 1) * 50 + index + 1}
                  headers={headers}
                  onEdit={onEdit}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination - Responsive */}
      {!isLoading && totalPages > 1 && (
        <div className="bg-gray-50 px-3 py-3 sm:px-4 sm:py-3.5 md:px-6 md:py-4 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={filteredData.length}
            startIndex={paginationMeta.startIndex}
            endIndex={paginationMeta.endIndex}
            onPageChange={goToPage}
            onPrev={goToPrev}
            onNext={goToNext}
          />
        </div>
      )}
    </div>
  );
};

export default PatientTable;
