import React, { useState, useRef, useMemo } from "react";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/pagination/Pagination";
import TableRow from "./components/TableRow";
import TableRowSkeleton from "./components/TableRowSkeleton";
import PatientOverview from "./components/PatientOverview";
import { PathologyPatientData, SortConfig } from "../../types";
import { getTableHeaders, TableHeader } from "./utils";

interface PatientTableProps {
  tableData: PathologyPatientData[];
  customOptions?: any;
  onEdit?: (patient: PathologyPatientData) => void;
  isLoading?: boolean;
}

const PatientTable: React.FC<PatientTableProps> = ({
  tableData = [],
  customOptions,
  onEdit,
  isLoading = false,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedPatient, setSelectedPatient] =
    useState<PathologyPatientData | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const handlePatientClick = (patient: PathologyPatientData) => {
    setSelectedPatient(patient);
    setIsOverviewOpen(true);
  };

  // Sorting logic
  const sortedData = useMemo(() => {
    const sortableData = [...tableData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === "ascending" ? 1 : -1;

        if (
          key.endsWith("Date") ||
          key === "createdAt" ||
          key === "updated At"
        ) {
          const dateA = a[key as keyof PathologyPatientData]
            ? new Date(a[key as keyof PathologyPatientData] as string).getTime()
            : 0;
          const dateB = b[key as keyof PathologyPatientData]
            ? new Date(b[key as keyof PathologyPatientData] as string).getTime()
            : 0;
          return (dateA - dateB) * dir;
        }

        if (
          typeof a[key as keyof PathologyPatientData] === "number" &&
          typeof b[key as keyof PathologyPatientData] === "number"
        ) {
          return (
            ((a[key as keyof PathologyPatientData] as number) -
              (b[key as keyof PathologyPatientData] as number)) *
            dir
          );
        }

        const valA = (a[key as keyof PathologyPatientData] || "")
          .toString()
          .toLowerCase();
        const valB = (b[key as keyof PathologyPatientData] || "")
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
    paginationMeta,
    goToPage,
    goToPrev,
    goToNext,
  } = usePagination({
    totalResults: filteredData.length,
    pageSize: 15,
    initialPage: 1,
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * 15,
    currentPage * 15
  );

  const headers = getTableHeaders();

  // Sorting
  const requestSort = (key: string) => {
    if (key === "id" || key === "actions") return;
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

  const FIRST_COL_WIDTH = "w-[60px] min-w-[60px]";
  const SECOND_COL_WIDTH = "w-[100px] min-w-[100px]";
  const THIRD_COL_WIDTH = "w-[200px] min-w-[200px]";

  const getHeaderClasses = (header: TableHeader, index: number) => {
    const baseClasses = `
      px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4
      text-left text-[10px] sm:text-xs md:text-xs
      font-semibold text-white uppercase tracking-wider
      bg-fnh-navy
      transition-colors
      ${
        header.key !== "id" && header.key !== "actions"
          ? "cursor-pointer hover:bg-fnh-navy-dark"
          : ""
      }
    `;

    if (index === 0) {
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:z-30 lg:left-0 lg:bg-fnh-navy`;
    }
    if (index === 1) {
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:z-30 lg:left-[60px] lg:bg-fnh-navy`;
    }
    if (index === 2) {
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:z-30 lg:left-[160px] lg:bg-fnh-navy`;
    }
    return baseClasses;
  };

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div
            className="overflow-x-auto overflow-y-auto w-full"
            style={{ maxHeight: "600px" }}
            ref={tableContainerRef}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-fnh-navy sticky top-0 z-20">
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
              <tbody className="bg-white divide-y divide-gray-100">
                {Array.from({ length: 15 }).map((_, index) => (
                  <TableRowSkeleton
                    key={index}
                    headers={headers}
                    rowIndex={index}
                  />
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
            <p className="text-base sm:text-lg font-medium">
              No pathology patients found
            </p>
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
              <thead className="bg-fnh-navy sticky top-0 z-20">
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={header.key}
                      className={getHeaderClasses(header, index)}
                      onClick={() => requestSort(header.key)}
                    >
                      <div className="flex items-center gap-1 sm:gap-2 group">
                        <span className="whitespace-nowrap">
                          {header.label}
                        </span>
                        {sortConfig?.key === header.key && (
                          <span className="text-fnh-yellow font-bold">
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
                    index={(currentPage - 1) * 15 + index + 1}
                    headers={headers}
                    onEdit={onEdit}
                    onPatientClick={handlePatientClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="mt-4">
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
      <PatientOverview
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        patient={selectedPatient}
      />
    </>
  );
};

export default PatientTable;
