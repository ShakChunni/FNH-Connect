import React, { useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import ExportDropdown from "./components/ExportDropdown";
import SearchBar from "./components/SearchBar";
import AddDataButton from "./components/AddDataButton";
import TableHeader from "./components/TableHeader";
import TableRow from "./components/TableRow";
import Pagination from "./components/Pagination";
import ExcelFileUploader from "./components/ExcelFileUploaded/ExcelFileUploader";
import { useAuth } from "@/app/AuthContext";
import SkeletonContactsTable from "./components/SkeletonContactTable";

interface ContactsTableProps {
  tableData: {
    id: number;
    organization: string;
    client_position: string | null;
    client_name: string | null;
    client_email: string | null;
    client_Quality: string | null;
    client_otherEmail: string | null;
    client_phone: string | null;
    client_otherPhone: string | null;
    client_linkedinUrl: string | null;
    industry: string | null;
    address: string | null;
    ownerId: number | null;
    owner: { username: string; fullName: string | null } | null;
    assignedDate: string | null;
    assignedOrg: string | null;
    status: string | null;
    contactDate: string | null;
    notes: string | null;
    followUpDate: string | null;
    uploadedAt: string;
    isActive: boolean;
  }[];
  isLoading: boolean;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
  onDataChange: (newData?: any[]) => void;
}

const ContactsTable: React.FC<ContactsTableProps> = ({
  tableData = [],
  isLoading,
  onMessage,
  messagePopupRef,
  onDataChange,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
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

  const formatDate = (date: string | null) => {
    if (!date) return "";
    try {
      return format(new Date(date), "dd/MM/yyyy");
    } catch (error) {
      console.error("Invalid date format:", date);
      return "";
    }
  };

  const sortedData = useMemo(() => {
    const sortableData = [...tableData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (
          sortConfig.key === "assignedDate" ||
          sortConfig.key === "uploadedAt"
        ) {
          const dateA = a[sortConfig.key]
            ? new Date(a[sortConfig.key] || "").getTime()
            : Infinity;
          const dateB = b[sortConfig.key]
            ? new Date(b[sortConfig.key] || "").getTime()
            : Infinity;
          if (dateA < dateB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (dateA > dateB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        } else if (
          typeof a[sortConfig.key as keyof typeof a] === "string" &&
          typeof b[sortConfig.key as keyof typeof b] === "string"
        ) {
          const valueA = (a[sortConfig.key as keyof typeof a] as string) || "";
          const valueB = (b[sortConfig.key as keyof typeof b] as string) || "";
          if (valueA < valueB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        } else if (sortConfig.key === "id") {
          return sortConfig.direction === "ascending"
            ? a.id - b.id
            : b.id - a.id;
        }
        return 0;
      });
    }
    return sortableData;
  }, [tableData, sortConfig]);

  const filteredData = sortedData.filter((row) => {
    return (
      (row.organization &&
        row.organization.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.client_name &&
        row.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.client_email &&
        row.client_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.client_phone &&
        row.client_phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.industry &&
        row.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.client_position &&
        row.client_position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.status &&
        row.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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

  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => {
      const newPage = Math.max(prevPage - 1, 1);
      scrollToTop();
      return newPage;
    });
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => {
      const newPage = Math.min(prevPage + 1, totalPages);
      scrollToTop();
      return newPage;
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToTop();
  };

  const headers = [
    { key: "id", label: "#" },
    { key: "organization", label: "Organization" },
    { key: "client_name", label: "Contact Name" },
    { key: "client_position", label: "Position" },
    { key: "client_email", label: "Email" },
    { key: "client_Quality", label: "Quality" },
    { key: "client_phone", label: "Phone" },
    { key: "client_otherPhone", label: "Other Phone" },
    { key: "client_linkedinUrl", label: "LinkedIn" },
    { key: "industry", label: "Industry" },
    { key: "address", label: "Address" },
    { key: "owner", label: "Owner" },
    { key: "assignedOrg", label: "Assigned To" },
    { key: "status", label: "Status" },
    { key: "contactDate", label: "Contact Date" },
    { key: "followUpDate", label: "Follow-up Date" },
    { key: "notes", label: "Notes" },
    { key: "uploadedAt", label: "Upload Date" },
  ];

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleUploadSuccess = (data: any[]) => {
    // Pass uploaded data to the parent component to merge with existing data
    onDataChange(data);
    onMessage("success", `Successfully uploaded ${data.length} contacts`);
    setIsUploaderOpen(false);
    // After upload, move to the first page to see new data
    setCurrentPage(1);
    scrollToTop();
  };

  const handleUploadError = (error: string) => {
    onMessage("error", error);
  };

  const handleEditClick = (row: any) => {
    // This would be implemented later for editing functionality
    console.log("Edit row:", row);
  };

  return (
    <div className="bg-[#F4F8FC] rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex justify-end items-center mb-4">
        <div className="flex items-center space-x-2">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <AddDataButton onClick={() => setIsUploaderOpen(true)} />
        </div>
      </div>

      {isUploaderOpen && (
        <div className="mb-6">
          <ExcelFileUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>
      )}

      {isLoading ? (
        <div className="overflow-x-auto overflow-y-auto w-full">
          <SkeletonContactsTable />
        </div>
      ) : (
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
              totalRows={filteredData.length}
            />
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <TableRow
                  key={row.id}
                  row={row}
                  formatDate={formatDate}
                  onEditClick={handleEditClick}
                  index={index + (currentPage - 1) * itemsPerPage}
                  totalRows={filteredData.length}
                  currentPage={currentPage}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
};

export default ContactsTable;
