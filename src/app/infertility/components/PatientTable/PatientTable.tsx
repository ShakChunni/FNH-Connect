import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { format } from "date-fns";
import AddNewData from "../AddNewData/AddNewData";
import EditData from "../EditData/EditData";
import ExportDropdown from "./components/ExportDropdown";
import useCSVExport from "../../../home/RecentLeadsTable/hooks/useCSVExport";
import AddDataButton from "./components/AddDataButton";
import TableHeader from "./components/TableHeader";
import TableRow from "./components/TableRow";
import Pagination from "./components/Pagination";
import { useAuth } from "@/app/AuthContext";

interface InfertilityPatientData {
  id: number;
  hospitalName: string | null;
  patientFirstName: string;
  patientLastName: string | null;
  patientFullName: string;
  patientAge: number | null;
  patientDOB: Date | null;
  husbandName: string | null;
  husbandAge: number | null;
  husbandDOB: Date | null;
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
  createdAt: Date;
  updatedAt: Date;
}

interface PatientTableProps {
  tableData: InfertilityPatientData[];
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
  customOptions?: {
    infertilityTypes: string[];
    hospitals: string[];
    totalCount: number;
  };
  onSearch?: (searchTerm: string, searchField: string) => void;
}

const PatientTable = React.memo<PatientTableProps>(
  ({ tableData = [], onMessage, messagePopupRef, customOptions, onSearch }) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchField, setSearchField] = useState("patientName");
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
    const [editData, setEditData] = useState<InfertilityPatientData | null>(
      null
    );
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [sortConfig, setSortConfig] = useState<{
      key: string;
      direction: string;
    } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 50;

    const formatDate = useCallback((date: Date | string | null) => {
      if (!date) return "";
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy");
    }, []);

    const formatAge = useCallback(
      (dob: Date | string | null, age: number | null) => {
        if (age) return age.toString();
        if (!dob) return "";
        const dobDate = typeof dob === "string" ? new Date(dob) : dob;
        const today = new Date();
        const calculatedAge = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dobDate.getDate())
        ) {
          return (calculatedAge - 1).toString();
        }
        return calculatedAge.toString();
      },
      []
    );

    const sortedData = useMemo(() => {
      const sortableData = [...tableData];
      if (sortConfig !== null) {
        sortableData.sort((a, b) => {
          const aValue = a[sortConfig.key as keyof InfertilityPatientData];
          const bValue = b[sortConfig.key as keyof InfertilityPatientData];

          if (
            sortConfig.key.includes("DOB") ||
            sortConfig.key.includes("Date")
          ) {
            const dateA = aValue
              ? new Date(aValue as string | Date).getTime()
              : Infinity;
            const dateB = bValue
              ? new Date(bValue as string | Date).getTime()
              : Infinity;
            return sortConfig.direction === "ascending"
              ? dateA - dateB
              : dateB - dateA;
          }

          if (typeof aValue === "string" && typeof bValue === "string") {
            return sortConfig.direction === "ascending"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          if (typeof aValue === "number" && typeof bValue === "number") {
            return sortConfig.direction === "ascending"
              ? aValue - bValue
              : bValue - aValue;
          }

          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return 1;
          if (bValue === null) return -1;

          return 0;
        });
      }
      return sortableData;
    }, [tableData, sortConfig]);

    const filteredData = sortedData;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleAddData = useCallback(
      (data: any) => {
        onMessage("success", "Patient data added successfully!");
      },
      [onMessage]
    );

    const handleEditData = useCallback(
      (data: any) => {
        onMessage("success", "Patient data updated successfully!");
      },
      [onMessage]
    );

    const handleDeleteData = useCallback(
      (id: number) => {
        onMessage("success", "Patient data deleted successfully!");
      },
      [onMessage]
    );

    const { exportTableAsCSV } = useCSVExport(tableData);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      if (tableContainerRef.current) {
        setIsDragging(true);
        setStartX(e.pageX - tableContainerRef.current.offsetLeft);
        setScrollLeft(tableContainerRef.current.scrollLeft);
      }
    }, []);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        if (tableContainerRef.current) {
          const x = e.pageX - tableContainerRef.current.offsetLeft;
          const walk = (x - startX) * 2;
          tableContainerRef.current.scrollLeft = scrollLeft - walk;
        }
      },
      [isDragging, startX, scrollLeft]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    const handleEditButtonClick = useCallback((row: InfertilityPatientData) => {
      setEditData(row);
      setIsEditPopupOpen(true);
    }, []);

    const requestSort = useCallback(
      (key: string) => {
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
      },
      [sortConfig]
    );

    const scrollToTop = useCallback(() => {
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }, []);

    const handlePreviousPage = useCallback(() => {
      setCurrentPage((prevPage) => {
        const newPage = Math.max(prevPage - 1, 1);
        scrollToTop();
        return newPage;
      });
    }, [scrollToTop]);

    const handleNextPage = useCallback(() => {
      setCurrentPage((prevPage) => {
        const newPage = Math.min(prevPage + 1, totalPages);
        scrollToTop();
        return newPage;
      });
    }, [totalPages, scrollToTop]);

    const handlePageChange = useCallback(
      (page: number) => {
        setCurrentPage(page);
        scrollToTop();
      },
      [scrollToTop]
    );

    const headers = useMemo(
      () => [
        { key: "id", label: "#" },
        { key: "hospitalName", label: "Hospital" },
        { key: "patientFullName", label: "Patient Name" },
        { key: "patientAge", label: "Patient Age" },
        { key: "patientDOB", label: "Patient DOB" },
        { key: "husbandName", label: "Husband Name" },
        { key: "husbandAge", label: "Husband Age" },
        { key: "husbandDOB", label: "Husband DOB" },
        { key: "mobileNumber", label: "Mobile Number" },
        { key: "address", label: "Address" },
        { key: "yearsMarried", label: "Years Married" },
        { key: "yearsTrying", label: "Years Trying" },
        { key: "para", label: "Para" },
        { key: "alc", label: "ALC" },
        { key: "weight", label: "Weight (kg)" },
        { key: "bp", label: "Blood Pressure" },
        { key: "infertilityType", label: "Infertility Type" },
        { key: "notes", label: "Notes" },
        { key: "createdAt", label: "Created Date" },
        { key: "updatedAt", label: "Updated Date" },
      ],
      []
    );

    const paginatedData = useMemo(
      () =>
        filteredData.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        ),
      [filteredData, currentPage, itemsPerPage]
    );

    const handleSearch = useCallback(() => {
      if (onSearch && searchTerm.trim() !== "") {
        onSearch(searchTerm, searchField);
      }
    }, [onSearch, searchTerm, searchField]);

    const handleSearchFieldChange = useCallback(
      (field: string) => {
        setSearchField(field);
        if (searchTerm.trim() !== "" && onSearch) {
          onSearch(searchTerm, field);
        }
      },
      [searchTerm, onSearch]
    );

    useEffect(() => {
      if (searchTerm.trim() !== "" && searchField && onSearch) {
        const timer = setTimeout(() => {
          handleSearch();
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [searchTerm, searchField, handleSearch]);

    const renderCellValue = useCallback(
      (row: InfertilityPatientData, key: string) => {
        const value = row[key as keyof InfertilityPatientData];

        switch (key) {
          case "patientDOB":
          case "husbandDOB":
            return formatDate(value as Date | string | null);
          case "createdAt":
          case "updatedAt":
            return formatDate(value as Date | string | null);
          case "patientAge":
            return formatAge(row.patientDOB, row.patientAge);
          case "husbandAge":
            return formatAge(row.husbandDOB, row.husbandAge);
          case "weight":
            return value ? `${value} kg` : "";
          case "yearsMarried":
          case "yearsTrying":
            return value ? `${value} years` : "";
          case "hospitalName":
          case "patientFirstName":
          case "patientLastName":
          case "patientFullName":
          case "husbandName":
          case "mobileNumber":
          case "address":
          case "para":
          case "alc":
          case "bp":
          case "infertilityType":
          case "notes":
            return value || "";
          default:
            return value?.toString() || "";
        }
      },
      [formatDate, formatAge]
    );

    return (
      <div className="bg-[#F4F8FC] rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={searchField}
                onChange={(e) => handleSearchFieldChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="patientName">Patient Name</option>
                <option value="husbandName">Husband Name</option>
                <option value="mobileNumber">Mobile Number</option>
                <option value="hospitalName">Hospital</option>
                <option value="infertilityType">Infertility Type</option>
              </select>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <AddDataButton onClick={() => setIsPopupOpen(true)} />
            {user?.role === "admin" && (
              <ExportDropdown onExportCSV={exportTableAsCSV} />
            )}
          </div>
        </div>

        <div
          className="overflow-x-auto overflow-y-auto w-full"
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
              totalRows={filteredData.length + 1}
            />
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  {headers.map((header) => (
                    <td
                      key={header.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                      style={{ minWidth: "150px" }}
                    >
                      {header.key === "id" ? (
                        <div className="flex items-center space-x-2">
                          <span>
                            {index + 1 + (currentPage - 1) * itemsPerPage}
                          </span>
                          <button
                            onClick={() => handleEditButtonClick(row)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <div
                          className="max-w-xs truncate"
                          title={renderCellValue(row, header.key).toString()}
                        >
                          {(() => {
                            const value = renderCellValue(row, header.key);
                            return value instanceof Date
                              ? value.toString()
                              : value;
                          })()}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
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

        <AddNewData
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          onSubmit={handleAddData}
          onMessage={onMessage}
          messagePopupRef={messagePopupRef}
          customOptions={customOptions}
        />

        {editData && (
          <EditData
            isOpen={isEditPopupOpen}
            onClose={() => setIsEditPopupOpen(false)}
            onUpdate={handleEditData}
            onDelete={handleDeleteData}
            data={editData}
            onMessage={onMessage}
            messagePopupRef={messagePopupRef}
            customOptions={customOptions}
          />
        )}
      </div>
    );
  }
);

PatientTable.displayName = "PatientTable";

export default PatientTable;
