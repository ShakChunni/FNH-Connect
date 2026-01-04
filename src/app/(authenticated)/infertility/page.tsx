"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

// Modular Components
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/pagination/Pagination";
import AddNewDataInfertility from "./components/AddNewData/AddNewDataInfertility";
import EditDataInfertility from "./components/EditData/EditDataInfertility";
import PatientTable from "./components/PatientTable/PatientTable";
import { NewPatientButton } from "./components/NewPatientButton";
import InfertilitySearch from "./components/InfertilitySearch";

// Types and Hooks
import { InfertilityPatientData } from "./types";
import { useFetchInfertilityData } from "./hooks";
import type { InfertilityFilters } from "./types";
import { normalizePatientData } from "../../../components/form-sections/utils/dataUtils";
import {
  useInfertilityModals,
  useInfertilityActions,
  usePagination,
  useFilterActions,
  useFilterValues,
} from "./stores";

const InfertilityManagement = React.memo(() => {
  // Ref for scrolling table container on pagination
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Zustand store selectors
  const modals = useInfertilityModals();
  const actions = useInfertilityActions();
  const pagination = usePagination();
  const filterActions = useFilterActions();
  const filterValues = useFilterValues();

  // Map pagination and filters to hook filters format
  const hookFilters: InfertilityFilters = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search: filterValues.search.length >= 2 ? filterValues.search : undefined,
      startDate: filterValues.startDate?.toISOString(),
      endDate: filterValues.endDate?.toISOString(),
    }),
    [pagination.page, pagination.limit, filterValues]
  );

  const { data: result, isLoading } = useFetchInfertilityData(hookFilters);

  const totalRecords = result?.total || 0;
  const totalPages = result?.totalPages || 0;

  // Handle edit patient
  const handleOpenEditPopup = useCallback(
    (patient: InfertilityPatientData) => {
      actions.openEditModal(patient);
    },
    [actions]
  );

  // Normalize patient data
  const normalizedPatientData = useMemo(
    () => normalizePatientData(result?.data ?? []),
    [result?.data]
  );

  // Pagination handlers
  const handlePageChange = useCallback(
    (page: number) => {
      filterActions.setPage(page);
    },
    [filterActions]
  );

  // Calculate pagination indices
  const startIndex = useMemo(() => {
    return totalRecords > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  }, [pagination.page, pagination.limit, totalRecords]);

  const endIndex = useMemo(() => {
    if (!result) return 0;
    return Math.min(pagination.page * pagination.limit, result.total);
  }, [pagination.page, pagination.limit, result]);

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-2 sm:pb-3 lg:pb-4 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header with Title and New Patient Button */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="Infertility Patients"
              subtitle="Manage and track infertility patient records"
              actions={
                <NewPatientButton
                  onClick={actions.openAddModal}
                  disabled={isLoading}
                />
              }
            />
          </div>

          {/* Search Bar with Date Range and Report Buttons */}
          <div className="px-0 sm:px-2 lg:px-4 pb-2 sm:pb-4 lg:pb-6">
            <InfertilitySearch
              disabled={isLoading}
              recordCount={totalRecords}
            />
          </div>

          {/* Table Container */}
          <div className="px-0 sm:px-2 lg:px-4">
            <div
              ref={tableContainerRef}
              className="bg-white rounded-xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-4 sm:mb-8"
            >
              <PatientTable
                tableData={normalizedPatientData}
                isLoading={isLoading}
                onEdit={handleOpenEditPopup}
                startIndex={startIndex}
              />

              {/* Pagination UI - Using Global Component */}
              <Pagination
                currentPage={pagination.page}
                totalPages={totalPages}
                totalResults={totalRecords}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
                scrollContainerRef={tableContainerRef}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add New Data Portal */}
      {(modals.isAddOpen || modals.isAddClosing) &&
        typeof window !== "undefined" &&
        createPortal(
          <AddNewDataInfertility
            isOpen={modals.isAddOpen && !modals.isAddClosing}
            onClose={actions.closeAddModal}
          />,
          document.body
        )}

      {/* Edit Data Portal */}
      {(modals.isEditOpen || modals.isEditClosing) &&
        modals.selectedPatient &&
        typeof window !== "undefined" &&
        createPortal(
          <EditDataInfertility
            isOpen={modals.isEditOpen && !modals.isEditClosing}
            onClose={actions.closeEditModal}
            patientData={modals.selectedPatient}
          />,
          document.body
        )}
    </div>
  );
});

InfertilityManagement.displayName = "InfertilityManagement";

export default InfertilityManagement;
