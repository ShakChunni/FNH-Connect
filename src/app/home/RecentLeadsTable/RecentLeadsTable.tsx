import React, { useState, useRef, useMemo, useEffect } from "react";
import { format } from "date-fns";
import AddNewData from "../AddNewData/AddNewData";
import EditData from "../EditData/EditData";
import ExportDropdown from "./components/ExportDropdown";
import useCSVExport from "./hooks/useExcelExport";
import SearchBar from "./components/SearchBar";
import AddDataButton from "./components/AddDataButton";
import TableHeader from "./components/TableHeader";
import TableRow from "./components/TableRow";
import TableRowSkeleton from "./components/TableRowSkeleton";
import Pagination from "./components/Pagination";
import { useAuth } from "../../AuthContext";
import { createPortal } from "react-dom";

interface RecentLeadsTableProps {
  tableData: {
    id: number;
    client_name: string;
    organization_name: string;
    organization_website: string;
    client_contact_number: string;
    client_contact_email: string;
    industry_name: string;
    organization_location: string;
    lead_source: string;
    prospect_date: string;
    PIC: string;
    meetings_conducted: boolean | null;
    meeting_date: string | null;
    proposal_in_progress: boolean | null;
    proposal_in_progress_date: string | null;
    proposal_sent_out: boolean | null;
    proposal_sent_out_date: string | null;
    quotation_signed: boolean | null;
    quotation_signed_date: string | null;
    quotation_number: string | null;
    lost_lead: boolean | null;
    type: string | null;
    notes: string | null;
    total_proposal_value: number | null;
    total_closed_sale: number | null;
    source_table: string;
    isInactive?: boolean;
    inactiveReason?: string;
    source_organization?: string;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
  }[];
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
  customOptions?: any;
  tableSelectorValue?: string;
  onSearch?: (searchTerm: string) => void;
  isLoading?: boolean;
  picList?: string[];
  enableAutoSearch?: boolean;
  debounceMs?: number;
  minSearchLength?: number;
}

const RecentLeadsTable: React.FC<RecentLeadsTableProps> = ({
  tableData = [],
  onMessage,
  messagePopupRef,
  customOptions,
  tableSelectorValue,
  onSearch,
  isLoading = false,
  picList,
  enableAutoSearch = true,
  debounceMs = 500,
  minSearchLength = 2,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPopupClosing, setIsPopupClosing] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isEditPopupClosing, setIsEditPopupClosing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<{ search: () => void }>(null);
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
    return date ? date.slice(0, 10).split("-").reverse().join("/") : "";
  };

  const sortedData = useMemo(() => {
    const sortableData = [...tableData];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (
          sortConfig.key === "prospect_date" ||
          sortConfig.key === "meeting_date" ||
          sortConfig.key === "proposal_in_progress_date" ||
          sortConfig.key === "proposal_sent_out_date" ||
          sortConfig.key === "quotation_signed_date"
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
          sortConfig.key === "PIC" ||
          sortConfig.key === "client_name" ||
          sortConfig.key === "organization_name" ||
          sortConfig.key === "organization_website" ||
          sortConfig.key === "client_contact_number" ||
          sortConfig.key === "client_contact_email" ||
          sortConfig.key === "organization_location" ||
          sortConfig.key === "lead_source" ||
          sortConfig.key === "quotation_number" ||
          sortConfig.key === "type" ||
          sortConfig.key === "notes" ||
          sortConfig.key === "industry_name"
        ) {
          const valueA = a[sortConfig.key] || "";
          const valueB = b[sortConfig.key] || "";
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
        } else if (
          sortConfig.key === "meetings_conducted" ||
          sortConfig.key === "lost_lead" ||
          sortConfig.key === "proposal_in_progress" ||
          sortConfig.key === "proposal_sent_out" ||
          sortConfig.key === "quotation_signed"
        ) {
          if (a[sortConfig.key] === b[sortConfig.key]) {
            return 0;
          }
          if (a[sortConfig.key] === null) {
            return 1;
          }
          if (b[sortConfig.key] === null) {
            return -1;
          }
          return sortConfig.direction === "ascending"
            ? a[sortConfig.key]
              ? -1
              : 1
            : a[sortConfig.key]
            ? 1
            : -1;
        } else if (
          sortConfig.key === "total_proposal_value" ||
          sortConfig.key === "total_closed_sale"
        ) {
          return sortConfig.direction === "ascending"
            ? (a[sortConfig.key] || 0) - (b[sortConfig.key] || 0)
            : (b[sortConfig.key] || 0) - (a[sortConfig.key] || 0);
        }
        return 0;
      });
    }
    return sortableData;
  }, [tableData, sortConfig]);

  const filteredData = sortedData;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleAddData = (data: any) => {
    onMessage("success", "Data added successfully!");
  };

  const handleEditData = (data: any) => {
    onMessage("success", "Data updated successfully!");
  };

  const handleDeleteData = (id: number, sourceTable: string) => {
    onMessage("success", "Data deleted successfully!");
  };

  const handleInactive = (
    id: number,
    sourceTable: string,
    pic: string,
    reason: string
  ) => {
    onMessage("success", "Data marked as inactive successfully!");
  };

  const { exportTableAsExcel } = useCSVExport(tableData);
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

  const handleEditButtonClick = (row: any) => {
    setEditData(row);
    setIsEditPopupOpen(true);
  };

  const handleCloseEditPopup = () => {
    setIsEditPopupClosing(true);
    // Allow animation to complete before actually closing
    setTimeout(() => {
      setIsEditPopupOpen(false);
      setIsEditPopupClosing(false);
      setEditData(null);
    }, 300); // Match the exit animation duration
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
    { key: "organization_name", label: "Organization Name" },
    { key: "campaign_name", label: "Campaign Name" },
    { key: "client_name", label: "Client's Name" },
    { key: "client_contact_number", label: "Contact Phone" },
    { key: "client_contact_email", label: "Contact Email" },
    { key: "organization_website", label: "Website" },
    { key: "industry_name", label: "Industry Name" },
    { key: "organization_location", label: "Location" },
    { key: "lead_source", label: "Lead Source" },
    { key: "prospect_date", label: "Prospect Date" },
    { key: "PIC", label: "PIC" },
    { key: "meetings_conducted", label: "Meetings Conducted" },
    { key: "meeting_date", label: "Meeting Date" },
    { key: "proposal_in_progress", label: "Proposal In Progress" },
    { key: "proposal_in_progress_date", label: "Proposal In Progress Date" },
    { key: "proposal_sent_out", label: "Proposal Sent Out" },
    { key: "proposal_sent_out_date", label: "Proposal Sent Out Date" },
    { key: "quotation_signed", label: "Quotation Signed" },
    { key: "quotation_signed_date", label: "Quotation Signed Date" },
    { key: "quotation_number", label: "Quotation Number" },
    { key: "lost_lead", label: "Lost Lead" },
    { key: "type", label: "Type" },
    { key: "notes", label: "Notes" },
    { key: "total_proposal_value", label: "Total Proposal Value [RM]" },
    { key: "total_closed_sale", label: "Total Closed Sale [RM]" },
    { key: "source_table", label: "Source" },
  ];

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const handleClearSearch = () => {
    setSearchTerm("");
    if (onSearch) {
      onSearch("");
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleCloseAddPopup = () => {
    setIsPopupClosing(true);
    // Allow animation to complete before actually closing
    setTimeout(() => {
      setIsPopupOpen(false);
      setIsPopupClosing(false);
    }, 300); // Match the exit animation duration
  };

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
        {user?.role === "admin" && (
          <ExportDropdown onExportCSV={exportTableAsExcel} />
        )}
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
            totalRows={filteredData.length + 1}
          />
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading
              ? Array.from({ length: 10 }).map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))
              : paginatedData.map((row, index) => (
                  <TableRow
                    key={`${row.source_table}-${row.id}`}
                    row={row}
                    index={index + 1 + (currentPage - 1) * itemsPerPage}
                    totalRows={filteredData.length + 1}
                    formatDate={formatDate}
                    onEditClick={handleEditButtonClick}
                    currentPage={currentPage}
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

      {/* Use createPortal for AddNewData - similar to Overview */}

      {editData &&
        (isEditPopupOpen || isEditPopupClosing) &&
        typeof window !== "undefined" &&
        createPortal(
          <EditData
            isOpen={isEditPopupOpen && !isEditPopupClosing}
            onClose={handleCloseEditPopup}
            onUpdate={handleEditData}
            onDelete={handleDeleteData}
            onInactive={handleInactive}
            data={editData}
            onMessage={onMessage}
            messagePopupRef={messagePopupRef}
            customOptions={customOptions}
            picList={picList}
          />,
          document.body
        )}
    </div>
  );
};

export default RecentLeadsTable;
