"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

// Modular Components
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/pagination/Pagination";
import AddNewDataPathology from "./components/AddNewData/AddNewDataPathology";
import EditDataPathology from "./components/EditData/EditDataPathology";
import PatientTable from "./components/PatientTable/PatientTable";
import { NewPatientButton } from "./components/NewPatientButton";
import { PathologySearch } from "./components/PathologySearch";
import { Filters, ExportActionBar } from "./components/filter";

// Types and Hooks
import { PathologyPatientData } from "./types";
import { useFetchPathologyData } from "./hooks";
import type { PathologyFilters } from "./types";
import {
  useModals,
  usePathologyActions,
  usePathologyFilterValues,
  usePathologyFilterStore,
} from "./stores";

const PathologyManagement = React.memo(() => {
  // Ref for scrolling table container on pagination
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Zustand store selectors
  const modals = useModals();
  const actions = usePathologyActions();

  // Get filter values from filter store
  const filterValues = usePathologyFilterValues();
  const setPage = usePathologyFilterStore((state) => state.setPage);

  // Map filter store values to hook format - properly connect ALL filters
  const hookFilters: PathologyFilters = useMemo(
    () => ({
      // Search filter (minimum 2 characters)
      search: filterValues.search.length >= 2 ? filterValues.search : undefined,
      // Status filter - convert to API format
      status: filterValues.status !== "All" ? filterValues.status : undefined,
      // Date range filters
      startDate: filterValues.startDate?.toISOString(),
      endDate: filterValues.endDate?.toISOString(),
      // Doctor filters
      orderedById: filterValues.orderedById ?? undefined,
      doneById: filterValues.doneById ?? undefined,
      // Test name filters (multi-select)
      testNames:
        filterValues.testNames.length > 0 ? filterValues.testNames : undefined,
      // Pagination
      page: filterValues.page,
      limit: filterValues.limit,
    }),
    [filterValues]
  );

  const { data: pathologyResult, isLoading } =
    useFetchPathologyData(hookFilters);

  // Extract data and pagination from result
  const pathologyPatients = pathologyResult?.data || [];
  const pagination = pathologyResult || {
    total: 0,
    totalPages: 1,
    currentPage: 1,
  };

  // Handle edit patient
  const handleOpenEditPopup = useCallback(
    (patient: PathologyPatientData) => {
      actions.openEditModal(patient);
    },
    [actions]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
    },
    [setPage]
  );

  // Transform response data to match table format
  const tableData: PathologyPatientData[] = useMemo(() => {
    return pathologyPatients.map((patient) => ({
      id: patient.id,
      patientId: patient.patientId,
      testNumber: patient.testNumber,
      patientFullName: patient.patient.fullName,
      patientFirstName: patient.patient.fullName.split(" ")[0] || "",
      patientLastName:
        patient.patient.fullName.split(" ").slice(1).join(" ") || null,
      patientGender: patient.patient.gender,
      patientAge: patient.patient.age,
      patientDOB: patient.patient.dateOfBirth
        ? new Date(patient.patient.dateOfBirth).toISOString()
        : null,
      guardianName: patient.patient.guardianName,
      guardianAge: null,
      guardianDOB: patient.patient.guardianDOB
        ? new Date(patient.patient.guardianDOB).toISOString()
        : null,
      guardianGender: patient.patient.guardianGender || "",
      mobileNumber: patient.patient.phoneNumber,
      email: patient.patient.email,
      address: patient.patient.address,
      bloodGroup: patient.patient.bloodGroup,
      hospitalId: patient.patient.hospitalId || 0,
      hospitalName: patient.patient.hospital?.name || null,
      hospitalAddress: patient.patient.hospital?.address || null,
      hospitalPhone: patient.patient.hospital?.phoneNumber || null,
      hospitalEmail: patient.patient.hospital?.email || null,
      hospitalWebsite: patient.patient.hospital?.website || null,
      hospitalType: patient.patient.hospital?.type || null,
      testDate: patient.testDate,
      reportDate: patient.reportDate,
      testCategory: patient.testCategory,
      testResults: patient.testResults,
      remarks: patient.remarks,
      isCompleted: patient.isCompleted,
      testCharge: Number(patient.testCharge),
      discountType: patient.discountType,
      discountValue: patient.discountValue
        ? Number(patient.discountValue)
        : null,
      discountAmount: Number(patient.discountAmount),
      grandTotal: Number(patient.grandTotal),
      paidAmount: Number(patient.paidAmount),
      dueAmount: Number(patient.dueAmount),
      referredBy: patient.referredBy || null,
      orderedById: patient.orderedById,
      orderedBy: patient.orderedBy?.fullName || null,
      doneById: patient.doneById,
      doneBy: patient.doneBy?.fullName || null,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    }));
  }, [pathologyPatients]);

  // Calculate pagination display values
  const startIndex = (pagination.currentPage - 1) * filterValues.limit + 1;
  const endIndex = Math.min(
    pagination.currentPage * filterValues.limit,
    pagination.total
  );

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-2 sm:pb-3 lg:pb-4 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header with Title and New Patient Button */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="Pathology Patients"
              subtitle="Manage pathology tests, track payments, and monitor test results"
              actions={
                <NewPatientButton
                  onClick={actions.openAddModal}
                  disabled={isLoading}
                />
              }
            />
          </div>

          {/* Search Bar with Filter and Report Buttons */}
          <div className="px-0 sm:px-2 lg:px-4 pb-2 sm:pb-4 lg:pb-6">
            <PathologySearch disabled={isLoading} data={tableData} />
          </div>

          {/* Table Container */}
          <div className="px-0 sm:px-2 lg:px-4">
            <div
              ref={tableContainerRef}
              className="bg-white rounded-xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
            >
              <PatientTable
                tableData={tableData}
                isLoading={isLoading}
                onEdit={handleOpenEditPopup}
              />

              {/* Server-side Pagination */}
              {!isLoading && pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalResults={pagination.total}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onPageChange={handlePageChange}
                  onPrev={() => handlePageChange(pagination.currentPage - 1)}
                  onNext={() => handlePageChange(pagination.currentPage + 1)}
                  scrollContainerRef={tableContainerRef}
                />
              )}
            </div>
          </div>

          {/* Bottom spacing for floating bar */}
          <div className="h-20" />
        </div>
      </div>

      {/* Filter Panel (Slide-out) */}
      <Filters />

      {/* Export Action Bar (Floating) - Only shows when filters are active */}
      <ExportActionBar data={tableData} />

      {/* Add New Data Portal */}
      {(modals.isAddOpen || modals.isAddClosing) &&
        typeof window !== "undefined" &&
        createPortal(
          <AddNewDataPathology
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
          <EditDataPathology
            isOpen={modals.isEditOpen && !modals.isEditClosing}
            onClose={actions.closeEditModal}
            patientData={modals.selectedPatient}
          />,
          document.body
        )}
    </div>
  );
});

PathologyManagement.displayName = "PathologyManagement";

export default PathologyManagement;
