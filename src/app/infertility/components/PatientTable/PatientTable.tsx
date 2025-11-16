import React, { useState, useRef, useMemo } from "react";
import { useAuth } from "@/app/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/pagination/Pagination";
import TableRow from "./components/TableRow";
import TableRowSkeleton from "./components/TableRowSkeleton";
import {
  InfertilityPatientData,
  SortConfig,
  TableHeader as TableHeaderType,
} from "../../types";
import { getTableHeaders } from "./utils";

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

  const headers = getTableHeaders(onEdit);

  // Sorting
  const requestSort = (key: string) => {
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

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Search Bar */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search patients by name, phone, or ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
            />
          </div>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-100">
                  Action
                </th>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => requestSort(header.key)}
                  >
                    <div className="flex items-center gap-2 group">
                      {header.label}
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
              {Array.from({ length: 10 }).map((_, index) => (
                <TableRowSkeleton key={index} headers={headers} />
              ))}
            </tbody>
          </table>
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <svg
            className="w-16 h-16 mb-4 text-gray-300"
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
          <p className="text-lg font-medium">No patients found</p>
          <p className="text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div
          className="overflow-x-auto overflow-y-auto w-full"
          style={{ maxHeight: "600px" }}
          ref={tableContainerRef}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-100">
                  Action
                </th>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => requestSort(header.key)}
                  >
                    <div className="flex items-center gap-2 group">
                      {header.label}
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

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
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
