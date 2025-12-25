import React, { useState, useRef, useMemo, useCallback } from "react";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/pagination/Pagination";
import TableRow from "./components/TableRow";
import TableRowSkeleton from "./components/TableRowSkeleton";
import AdmissionOverview from "./components/AdmissionOverview/AdmissionOverview";
import { AdmissionPatientData, SortConfig, AdmissionStatus } from "../../types";
import { getTableHeaders, TableHeader } from "./utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface AdmissionTableProps {
  tableData: AdmissionPatientData[];
  onEdit?: (patient: AdmissionPatientData) => void;
  onStatusChange?: (patientId: number, newStatus: AdmissionStatus) => void;
  isStatusUpdating?: boolean;
  isLoading?: boolean;
  startIndex?: number;
}

const AdmissionTable: React.FC<AdmissionTableProps> = ({
  tableData = [],
  onEdit,
  onStatusChange,
  isStatusUpdating = false,
  isLoading = false,
  startIndex,
}: AdmissionTableProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedPatient, setSelectedPatient] =
    useState<AdmissionPatientData | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Status change confirmation state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    patientId: number;
    patientName: string;
    currentStatus: string;
    newStatus: AdmissionStatus;
  } | null>(null);

  const handlePatientClick = (patient: AdmissionPatientData) => {
    setSelectedPatient(patient);
    setIsOverviewOpen(true);
  };

  // Handle status change request - open confirmation modal
  const handleStatusChangeRequest = useCallback(
    (patientId: number, newStatus: AdmissionStatus) => {
      const patient = tableData.find((p) => p.id === patientId);
      if (!patient) return;

      setPendingStatusChange({
        patientId,
        patientName: patient.patientFullName,
        currentStatus: patient.status,
        newStatus,
      });
      setConfirmModalOpen(true);
    },
    [tableData]
  );

  // Confirm status change
  const confirmStatusChange = useCallback(() => {
    if (pendingStatusChange && onStatusChange) {
      onStatusChange(
        pendingStatusChange.patientId,
        pendingStatusChange.newStatus
      );
    }
    setConfirmModalOpen(false);
    setPendingStatusChange(null);
  }, [pendingStatusChange, onStatusChange]);

  // Get warning message for status changes
  const getWarningMessage = () => {
    if (!pendingStatusChange) return "";
    const { currentStatus, newStatus, patientName } = pendingStatusChange;

    if (newStatus === "Canceled") {
      return `Canceling admission for ${patientName} will set all charges to ৳0. You must refund any paid amount to the patient.`;
    }
    if (currentStatus === "Canceled") {
      return `Restoring ${patientName}'s admission will set the admission fee to ৳300. Other charges will remain at ৳0.`;
    }
    return `Are you sure you want to change ${patientName}'s status from "${currentStatus}" to "${newStatus}"?`;
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
          key === "updatedAt" ||
          key === "dateAdmitted"
        ) {
          const dateA = a[key as keyof AdmissionPatientData]
            ? new Date(a[key as keyof AdmissionPatientData] as string).getTime()
            : 0;
          const dateB = b[key as keyof AdmissionPatientData]
            ? new Date(b[key as keyof AdmissionPatientData] as string).getTime()
            : 0;
          return (dateA - dateB) * dir;
        }

        if (
          typeof a[key as keyof AdmissionPatientData] === "number" &&
          typeof b[key as keyof AdmissionPatientData] === "number"
        ) {
          return (
            ((a[key as keyof AdmissionPatientData] as number) -
              (b[key as keyof AdmissionPatientData] as number)) *
            dir
          );
        }

        const valA = (a[key as keyof AdmissionPatientData] || "")
          .toString()
          .toLowerCase();
        const valB = (b[key as keyof AdmissionPatientData] || "")
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
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:z-30 lg:left-0 lg:bg-[#111827]`;
    }
    if (index === 1) {
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:z-30 lg:left-[60px] lg:bg-[#111827]`;
    }
    if (index === 2) {
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:z-30 lg:left-[160px] lg:bg-[#111827]`;
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
              No admissions found
            </p>
            <p className="text-xs sm:text-sm mt-1">
              Click &quot;New Admission&quot; to add a patient
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
                    index={(startIndex ?? (currentPage - 1) * 15) + index + 1}
                    headers={headers}
                    onEdit={onEdit}
                    onPatientClick={handlePatientClick}
                    onStatusChange={handleStatusChangeRequest}
                    isStatusUpdating={isStatusUpdating}
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

      <AdmissionOverview
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        patient={selectedPatient}
        onEdit={onEdit}
      />

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Confirm Status Change"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onClose={() => {
          setConfirmModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmStatusChange}
        isLoading={isStatusUpdating}
        variant={
          pendingStatusChange?.newStatus === "Canceled"
            ? "destructive"
            : "warning"
        }
      >
        {getWarningMessage()}
      </ConfirmModal>
    </>
  );
};

export default AdmissionTable;
