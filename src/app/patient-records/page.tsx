"use client";

import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

// Modular Components
import { PageHeader } from "@/components/ui/PageHeader";
import { PatientSearch, PatientTable, EditPatientModal } from "./components";

// Types and Hooks
import type { PatientData, PatientFilters } from "./types";
import { useFetchPatients } from "./hooks";
import { usePatientModals, usePatientActions } from "./stores";

const PatientRecordsPage = React.memo(() => {
  // Zustand store selectors
  const modals = usePatientModals();
  const actions = usePatientActions();

  // Local state for filters
  const [filters, setFilters] = useState<{
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }>({});

  // Map filters to hook format
  const hookFilters: PatientFilters = useMemo(
    () => ({
      search: filters.search,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
    }),
    [filters]
  );

  const { data: patientData, isLoading } = useFetchPatients(hookFilters);

  // Handle filter changes from search component
  const handleFiltersChange = useCallback(
    (newFilters: { search?: string; startDate?: Date; endDate?: Date }) => {
      setFilters({
        search: newFilters.search,
        startDate: newFilters.startDate,
        endDate: newFilters.endDate,
      });
    },
    []
  );

  // Handle edit patient
  const handleOpenEditPopup = useCallback(
    (patient: PatientData) => {
      actions.openEditModal(patient);
    },
    [actions]
  );

  // Normalize patient data (ensure dates are Date objects)
  const normalizedPatientData = useMemo(() => {
    if (!patientData) return [];
    return patientData.map((p) => ({
      ...p,
      dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
      spouseDOB: p.spouseDOB ? new Date(p.spouseDOB) : null,
      createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
    }));
  }, [patientData]);

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-2 sm:pb-3 lg:pb-4 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="Patient Records"
              subtitle="View and manage all patient information"
            />
          </div>

          {/* Search Bar */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-6">
            <PatientSearch
              onFiltersChange={handleFiltersChange}
              disabled={isLoading}
            />
          </div>

          {/* Patient Table */}
          <div className="px-1 sm:px-2 lg:px-4">
            <PatientTable
              tableData={normalizedPatientData}
              isLoading={isLoading}
              onEdit={handleOpenEditPopup}
            />
          </div>
        </div>
      </div>

      {/* Edit Patient Modal Portal */}
      {(modals.isEditOpen || modals.isEditClosing) &&
        modals.selectedPatient &&
        typeof window !== "undefined" &&
        createPortal(
          <EditPatientModal
            isOpen={modals.isEditOpen && !modals.isEditClosing}
            onClose={actions.closeEditModal}
            patientData={modals.selectedPatient}
          />,
          document.body
        )}
    </div>
  );
});

PatientRecordsPage.displayName = "PatientRecordsPage";

export default PatientRecordsPage;
