"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

// Modular Components
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/pagination/Pagination";
import AddNewDataAdmission from "./components/AddNewData/AddNewDataAdmission";
import EditDataAdmission from "./components/EditData/EditDataAdmission";
import { AdmissionTable } from "./components/PatientTable";
import AdmissionSearch from "./components/AdmissionSearch";
import { Filters, ExportActionBar } from "./components/filter";
import { generateAdmissionReceipt } from "./utils/generateReceipt";

// Types and Hooks
import {
  AdmissionPatientData,
  AdmissionFilters,
  AdmissionStatus,
} from "./types";
import { useFetchAdmissions, useEditAdmissionData } from "./hooks";
import {
  useModalState,
  useUIActions,
  useAdmissionActions,
  useFilterValues,
  useFilterStore,
} from "./stores";

// New Patient Button Component - Full width centered on mobile
const NewPatientButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
}> = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-linear-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
  >
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
    <span>New Admission</span>
  </button>
);

const GeneralAdmissionPage = React.memo(() => {
  // Ref for scrolling table container on pagination
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Zustand store selectors
  const modals = useModalState();
  const { openAddModal, closeAddModal, openEditModal, closeEditModal } =
    useUIActions();
  const { initializeFormForEdit, resetForm } = useAdmissionActions();

  // Get filter values from filter store
  const filterValues = useFilterValues();

  // Map filter store values to hook format
  const hookFilters: AdmissionFilters = useMemo(
    () => ({
      search: filterValues.search.length >= 2 ? filterValues.search : undefined,
      departmentId: filterValues.departmentId ?? undefined,
      doctorId: filterValues.doctorId ?? undefined,
      status: filterValues.status !== "All" ? filterValues.status : undefined,
      startDate: filterValues.startDate?.toISOString(),
      endDate: filterValues.endDate?.toISOString(),
    }),
    [filterValues]
  );

  // Fetch Admissions Data with Filters
  const {
    data: admissionsData,
    isLoading,
    error,
  } = useFetchAdmissions({
    ...hookFilters,
    page: filterValues.page,
    limit: filterValues.limit,
  });

  const admissions = admissionsData?.data || [];
  const totalRecords = admissionsData?.total || 0;
  const totalPages = admissionsData?.totalPages || 0;

  // Actions - using useShallow to prevent infinite re-renders
  const setPage = useFilterStore((state) => state.setPage);

  // Hook for quick status updates from table
  const { editAdmission, isLoading: isStatusUpdating } = useEditAdmissionData();

  // Handle edit patient
  const handleEdit = useCallback(
    (patient: AdmissionPatientData) => {
      initializeFormForEdit(patient);
      openEditModal(patient);
    },
    [initializeFormForEdit, openEditModal]
  );

  const handleAddSuccess = useCallback((data: AdmissionPatientData) => {
    // Generate admission receipt after successful add
    setTimeout(async () => {
      try {
        await generateAdmissionReceipt(data, "Staff");
      } catch (error) {
        console.error("Failed to generate admission receipt:", error);
      }
    }, 500);
  }, []);

  const handleCloseEdit = useCallback(() => {
    closeEditModal();
    resetForm();
  }, [closeEditModal, resetForm]);

  const handleCloseAdd = useCallback(() => {
    closeAddModal();
    resetForm();
  }, [closeAddModal, resetForm]);

  // Handle status change from table dropdown
  const handleStatusChange = useCallback(
    (patientId: number, newStatus: AdmissionStatus) => {
      editAdmission({
        id: patientId,
        status: newStatus,
        isDischarged: newStatus === "Discharged",
      });
    },
    [editAdmission]
  );

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-2 sm:pb-3 lg:pb-4 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header with Title and New Admission Button */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="General Admission"
              subtitle="Manage patient admissions and billing"
              actions={
                <NewPatientButton onClick={openAddModal} disabled={isLoading} />
              }
            />
          </div>

          {/* Search Bar with Filter Button */}
          <div className="px-0 sm:px-2 lg:px-4 pb-2 sm:pb-4 lg:pb-6">
            <AdmissionSearch disabled={isLoading} data={admissions} />
          </div>

          {/* Table Container */}
          <div className="px-0 sm:px-2 lg:px-4">
            <div
              ref={tableContainerRef}
              className="bg-white rounded-xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-4 sm:mb-8"
            >
              <AdmissionTable
                tableData={admissions}
                isLoading={isLoading}
                onEdit={handleEdit}
                onStatusChange={handleStatusChange}
                isStatusUpdating={isStatusUpdating}
                startIndex={(filterValues.page - 1) * filterValues.limit}
              />
            </div>

            {/* Pagination UI - Separate from table */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={filterValues.page}
                  totalPages={totalPages}
                  totalResults={totalRecords}
                  startIndex={
                    totalRecords > 0
                      ? (filterValues.page - 1) * filterValues.limit + 1
                      : 0
                  }
                  endIndex={Math.min(
                    filterValues.page * filterValues.limit,
                    totalRecords
                  )}
                  onPageChange={setPage}
                  scrollContainerRef={tableContainerRef}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel (Slide-out) */}
      <Filters />

      {/* Export Action Bar (Floating) */}
      <ExportActionBar data={admissions} />

      {/* Add New Data Portal */}

      {typeof window !== "undefined" &&
        createPortal(
          <AddNewDataAdmission
            isOpen={modals.isAddModalOpen}
            onClose={handleCloseAdd}
            onSuccess={handleAddSuccess}
          />,
          document.body
        )}

      {/* Edit Data Portal */}
      {modals.editingPatient &&
        typeof window !== "undefined" &&
        createPortal(
          <EditDataAdmission
            isOpen={modals.isEditModalOpen}
            onClose={handleCloseEdit}
            patientData={modals.editingPatient}
          />,
          document.body
        )}
    </div>
  );
});

GeneralAdmissionPage.displayName = "GeneralAdmissionPage";

export default GeneralAdmissionPage;
