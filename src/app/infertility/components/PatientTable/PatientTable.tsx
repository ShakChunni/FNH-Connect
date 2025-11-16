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
    <div className="rounded-3xl shadow-xl p-6">
      <div className="flex justify-end items-center mb-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            className="px-4 py-2 border border-fnh-grey-light rounded-full focus:outline-none focus:ring-2 focus:ring-fnh-blue text-sm"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="text-fnh-grey hover:text-fnh-grey-dark"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div
          className="overflow-x-auto rounded-2xl overflow-y-auto w-full max-h-[800px]"
          ref={tableContainerRef}
        >
          <table className="min-w-full divide-y divide-fnh-grey-light table-fixed">
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
            <tbody className="bg-white divide-y divide-fnh-grey-light">
              {Array.from({ length: 10 }).map((_, index) => (
                <TableRowSkeleton key={index} headers={headers} />
              ))}
            </tbody>
          </table>
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="text-center py-12 text-fnh-grey">No patients found</div>
      ) : (
        <div
          className="overflow-x-auto rounded-2xl overflow-y-auto w-full max-h-[800px]"
          ref={tableContainerRef}
        >
          <table className="min-w-full divide-y divide-fnh-grey-light table-fixed">
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
            <tbody className="bg-white divide-y divide-fnh-grey-light">
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
      {!isLoading && totalPages > 1 && (
        <div className="mt-6">
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
