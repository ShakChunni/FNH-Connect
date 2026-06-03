"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientPortal } from "@/components/ui/ClientPortal";

// Modular Components
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/pagination/Pagination";
import AddNewDataInfertility from "./components/AddNewData/AddNewDataInfertility";
import EditDataInfertility from "./components/EditData/EditDataInfertility";
import { EditInvestigationModal } from "./components/EditData/EditInvestigationModal";
import OrderInvestigationModal from "./components/OrderInvestigationModal";
import PatientTable from "./components/PatientTable/PatientTable";
import { NewPatientButton } from "./components/NewPatientButton";
import InfertilitySearch from "./components/InfertilitySearch";
import { Filters, ExportActionBar } from "./components/filter";

import InvestigationsTable from "./components/InvestigationsTable/InvestigationsTable";
import { useFetchInfertilityTests } from "./hooks/useFetchInfertilityTests";

// Types and Hooks
import { InfertilityPatientData, InfertilityTestData } from "./types";
import {
  useFetchInfertilityData,
  useUpdateInfertilityPatientStatus,
} from "./hooks";
import type { InfertilityFilters, InfertilityTestFilters } from "./types";
import { normalizePatientData } from "../../../components/form-sections/utils/dataUtils";
import {
  useInfertilityModals,
  useInfertilityActions,
  usePagination,
  useFilterActions,
  useFilterValues,
  useInfertilityTestFilterValues,
  useInfertilityTestFilterStore,
} from "./stores";
import { buildBDTQueryDateRange } from "@/lib/timezone";

const InfertilityManagement = React.memo(() => {
  const [activeTab, setActiveTab] = useState<"patients" | "investigations">("patients");
  const [selectedInvestigation, setSelectedInvestigation] = useState<InfertilityTestData | null>(null);
  const [isEditInvestigationOpen, setIsEditInvestigationOpen] = useState(false);
  const [selectedPatientForInvestigation, setSelectedPatientForInvestigation] =
    useState<InfertilityPatientData | null>(null);
  const [isOrderInvestigationOpen, setIsOrderInvestigationOpen] =
    useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Patient Store selectors
  const modals = useInfertilityModals();
  const actions = useInfertilityActions();
  const patientPagination = usePagination();
  const patientFilterActions = useFilterActions();
  const patientFilterValues = useFilterValues();

  // Investigation Store selectors
  const investigationFilters = useInfertilityTestFilterValues();
  const setInvestigationPage = useInfertilityTestFilterStore(
    (state) => state.setPage
  );

  // Patient Filters for hook
  const patientHookFilters: InfertilityFilters = useMemo(() => {
    const dateRangeParams = buildBDTQueryDateRange(
      patientFilterValues.startDate,
      patientFilterValues.endDate
    );

    return {
      page: patientPagination.page,
      limit: patientPagination.limit,
      search: patientFilterValues.search.length >= 2 ? patientFilterValues.search : undefined,
      ...dateRangeParams,
    };
  }, [patientPagination.page, patientPagination.limit, patientFilterValues]);

  // Investigation Filters for hook
  const investigationHookFilters: InfertilityTestFilters = useMemo(() => {
    const dateRangeParams = buildBDTQueryDateRange(
      investigationFilters.startDate,
      investigationFilters.endDate
    );

    return {
      page: investigationFilters.page,
      limit: investigationFilters.limit,
      search: investigationFilters.search,
      ...dateRangeParams,
      status: investigationFilters.status,
      orderedById: investigationFilters.orderedById || undefined,
      doneById: investigationFilters.doneById || undefined,
      testNames: investigationFilters.testNames,
    };
  }, [investigationFilters]);

  // Fetching data
  const { data: patientResult, isLoading: isPatientsLoading } = useFetchInfertilityData(patientHookFilters);
  const { data: testsResult, isLoading: isTestsLoading } = useFetchInfertilityTests(investigationHookFilters);
  const { updateStatus: updatePatientStatus, isUpdating: isUpdatingPatientStatus } =
    useUpdateInfertilityPatientStatus();

  const totalRecords = activeTab === "patients" ? (patientResult?.total || 0) : (testsResult?.total || 0);
  const totalPages = activeTab === "patients" ? (patientResult?.totalPages || 0) : (testsResult?.totalPages || 0);
  const currentPage = activeTab === "patients" ? patientPagination.page : investigationFilters.page;
  const currentLimit = activeTab === "patients" ? patientPagination.limit : investigationFilters.limit;

  const handlePageChange = useCallback(
    (page: number) => {
      if (activeTab === "patients") {
        patientFilterActions.setPage(page);
      } else {
        setInvestigationPage(page);
      }
    },
    [activeTab, patientFilterActions, setInvestigationPage]
  );

  // Normalize patient data
  const normalizedPatientData = useMemo(
    () => normalizePatientData(patientResult?.data ?? []),
    [patientResult?.data]
  );

  // Calculate pagination indices
  const startIndex = useMemo(() => {
    return totalRecords > 0 ? (currentPage - 1) * currentLimit + 1 : 0;
  }, [currentPage, currentLimit, totalRecords]);

  const endIndex = useMemo(() => {
    return Math.min(currentPage * currentLimit, totalRecords);
  }, [currentPage, currentLimit, totalRecords]);

  const handleEditInvestigation = useCallback((test: InfertilityTestData) => {
    setSelectedInvestigation(test);
    setIsEditInvestigationOpen(true);
  }, []);

  const handleOrderInvestigation = useCallback(
    (patient: InfertilityPatientData) => {
      setSelectedPatientForInvestigation(patient);
      setIsOrderInvestigationOpen(true);
    },
    []
  );

  const handleSetAdmitted = useCallback(
    (patient: InfertilityPatientData) => {
      if (patient.status?.toLowerCase() === "admitted") return;

      updatePatientStatus({
        id: patient.id,
        status: "Admitted",
      });
    },
    [updatePatientStatus]
  );

  const handleCloseOrderInvestigation = useCallback(() => {
    setIsOrderInvestigationOpen(false);
    setSelectedPatientForInvestigation(null);
  }, []);

  return (
    <div className="min-h-screen bg-emerald-50/50 pb-2 sm:pb-3 lg:pb-4 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="HSI Center Patients"
              subtitle="Manage and track HSI Center patient records"
              actions={
                <NewPatientButton
                  onClick={actions.openAddModal}
                  disabled={isPatientsLoading}
                />
              }
            />
          </div>

          {/* Tabs */}
          <div className="px-1 sm:px-2 lg:px-4 pb-2">
            <div className="flex space-x-6 border-b border-gray-200">
              <button
                className={`pb-3 text-sm font-medium transition-all ${
                  activeTab === "patients" 
                    ? "border-b-2 border-emerald-600 text-emerald-600" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setActiveTab("patients")}
              >
                Patients
              </button>
              <button
                className={`pb-3 text-sm font-medium transition-all ${
                  activeTab === "investigations" 
                    ? "border-b-2 border-emerald-600 text-emerald-600" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setActiveTab("investigations")}
              >
                Investigations
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-0 sm:px-2 lg:px-4 pb-2 sm:pb-4 lg:pb-6">
            <InfertilitySearch
              disabled={activeTab === "patients" ? isPatientsLoading : isTestsLoading}
              recordCount={totalRecords}
              activeTab={activeTab}
            />
          </div>

          {/* Table Container */}
          <div className="px-0 sm:px-2 lg:px-4">
            <div
              ref={tableContainerRef}
              className="bg-white rounded-xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-4 sm:mb-8"
            >
              {activeTab === "patients" ? (
                <PatientTable
                  tableData={normalizedPatientData}
                  isLoading={isPatientsLoading}
                  onEdit={actions.openEditModal}
                  onEditInvestigation={handleEditInvestigation}
                  onOrderInvestigation={handleOrderInvestigation}
                  onSetAdmitted={handleSetAdmitted}
                  isStatusUpdating={isUpdatingPatientStatus}
                  startIndex={startIndex}
                />
              ) : (
                <InvestigationsTable
                  tableData={(testsResult?.data as any) || []}
                  isLoading={isTestsLoading}
                  onEdit={handleEditInvestigation}
                  startIndex={startIndex}
                />
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={totalRecords}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onPageChange={handlePageChange}
                  scrollContainerRef={tableContainerRef}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel (Slide-out) */}
      <Filters />

      {/* Floating Export Bar */}
      {activeTab === "investigations" && <ExportActionBar recordCount={totalRecords} />}

      <OrderInvestigationModal
        isOpen={isOrderInvestigationOpen}
        onClose={handleCloseOrderInvestigation}
        patient={selectedPatientForInvestigation}
      />

      {/* Portals */}
      {(modals.isAddOpen || modals.isAddClosing) && (
        <ClientPortal>
          <AddNewDataInfertility
            isOpen={modals.isAddOpen && !modals.isAddClosing}
            onClose={actions.closeAddModal}
          />
        </ClientPortal>
      )}

      {(modals.isEditOpen || modals.isEditClosing) &&
        modals.selectedPatient && (
          <ClientPortal>
            <EditDataInfertility
              isOpen={modals.isEditOpen && !modals.isEditClosing}
              onClose={actions.closeEditModal}
              patientData={modals.selectedPatient}
            />
          </ClientPortal>
        )}

      {isEditInvestigationOpen && selectedInvestigation && (
        <ClientPortal>
          <EditInvestigationModal
            isOpen={isEditInvestigationOpen}
            onClose={() => setIsEditInvestigationOpen(false)}
            investigationData={selectedInvestigation}
          />
        </ClientPortal>
      )}
    </div>
  );
});

InfertilityManagement.displayName = "InfertilityManagement";

export default InfertilityManagement;
