import React, { useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import ExportDropdown from "./components/ExportDropdown";
import SearchBar from "./components/SearchBar";
import TableHeader from "./components/TableHeader";
import TableRow from "./components/TableRow";
import TableRowSkeleton from "./components/TableRowSkeleton";
import Pagination from "./components/Pagination";
import { useAuth } from "@/app/AuthContext";
import { createPortal } from "react-dom";

export interface InfertilityPatientData {
  id: number;
  hospitalName: string | null;
  patientFirstName: string;
  patientLastName: string | null;
  patientFullName: string;
  patientAge: number | null;
  patientDOB: string | null;
  husbandName: string | null;
  husbandAge: number | null;
  husbandDOB: string | null;
  mobileNumber: string | null;
  address: string | null;
  yearsMarried: number | null;
  yearsTrying: number | null;
  para: string | null;
  alc: string | null;
  weight: number | null;
  bp: string | null;
  infertilityType: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PatientTableProps {
  tableData: InfertilityPatientData[];
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
  customOptions?: any;
  onSearch?: (searchTerm: string) => void;
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
  isLoading = false,
  enableAutoSearch = true,
  debounceMs = 500,
  minSearchLength = 2,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<{ search: () => void }>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    try {
      return format(new Date(date), "dd/MM/yyyy");
    } catch {
      return date;
    }
  };

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
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Table headers for infertility patients
  const headers = [
    { key: "id", label: "#" },
    { key: "hospitalName", label: "Hospital" },
    { key: "patientFullName", label: "Patient Name" },
    { key: "patientAge", label: "Age" },
    { key: "patientDOB", label: "DOB" },
    { key: "husbandName", label: "Husband Name" },
    { key: "husbandAge", label: "Husband Age" },
    { key: "husbandDOB", label: "Husband DOB" },
    { key: "mobileNumber", label: "Mobile" },
    { key: "address", label: "Address" },
    { key: "yearsMarried", label: "Years Married" },
    { key: "yearsTrying", label: "Years Trying" },
    { key: "para", label: "Para" },
    { key: "alc", label: "ALC" },
    { key: "weight", label: "Weight" },
    { key: "bp", label: "BP" },
    { key: "infertilityType", label: "Infertility Type" },
    { key: "notes", label: "Notes" },
    { key: "createdAt", label: "Created" },
    { key: "updatedAt", label: "Updated" },
  ];

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Table drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tableContainerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - tableContainerRef.current.offsetLeft);
      setScrollLeft(tableContainerRef.current.scrollLeft);
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    if (tableContainerRef.current) {
      const x = e.pageX - tableContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      tableContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };
  const handleMouseUp = () => setIsDragging(false);

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

  // Pagination
  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handlePreviousPage = () => {
    setCurrentPage((prev) => {
      const newPage = Math.max(prev - 1, 1);
      scrollToTop();
      return newPage;
    });
  };
  const handleNextPage = () => {
    setCurrentPage((prev) => {
      const newPage = Math.min(prev + 1, totalPages);
      scrollToTop();
      return newPage;
    });
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToTop();
  };

  // Search
  const handleClearSearch = () => {
    setSearchTerm("");
    if (onSearch) onSearch("");
  };
  const handleSearch = () => {
    if (onSearch) onSearch(searchTerm);
  };

  // Export (optional, if you have export logic)
  // const { exportTableAsExcel } = useCSVExport(tableData);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-md p-6">
      <div className="flex justify-end items-center mb-4 space-x-2">
        <div className="justify-end">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            ref={searchBarRef}
            enableAutoSearch={enableAutoSearch}
            debounceMs={debounceMs}
            minSearchLength={minSearchLength}
          />
        </div>
        {/* {user?.role === "admin" && (
          <ExportDropdown onExportCSV={exportTableAsExcel} />
        )} */}
      </div>
      <div
        className="overflow-x-auto shadow-sm rounded-2xl overflow-y-auto w-full"
        ref={tableContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          transition: "scroll-left 0.3s ease-out",
          userSelect: "none",
          maxHeight: "800px",
        }}
      >
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <TableHeader
            headers={headers}
            sortConfig={sortConfig}
            requestSort={requestSort}
            currentPage={currentPage}
            totalRows={filteredData.length}
          />
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading
              ? Array.from({ length: 10 }).map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))
              : paginatedData.map((row, index) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    index={index + 1 + (currentPage - 1) * itemsPerPage}
                    formatDate={formatDate}
                  />
                ))}
          </tbody>
        </table>
      </div>
      {!isLoading && totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
            onPageChange={handlePageChange}
            scrollToTop={scrollToTop}
          />
        </div>
      )}
    </div>
  );
};

export default PatientTable;
