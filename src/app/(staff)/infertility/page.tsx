"use client";

import React, { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Modular Components
import { PageHeader } from "@/components/ui/PageHeader";
import AddNewDataInfertility from "./components/AddNewData/AddNewDataInfertility";
import EditDataInfertility from "./components/EditData/EditDataInfertility";
import PatientTable from "./components/PatientTable/PatientTable";
import { NewPatientButton } from "./components/NewPatientButton";
import { InfertilitySearch } from "./components/InfertilitySearch";

// Types and Hooks
import { InfertilityPatientData } from "./types";
import { useFetchInfertilityData } from "./hooks";
import type { InfertilityFilters } from "./types";
import { normalizePatientData } from "../../../components/form-sections/utils/dataUtils";
import { useInfertilityModals, useInfertilityActions } from "./stores";

const InfertilityManagement = React.memo(() => {
  // Zustand store selectors
  const modals = useInfertilityModals();
  const actions = useInfertilityActions();

  // Local state for filters
  const [filters, setFilters] = useState<{
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }>({});

  // Map filters to hook format
  const hookFilters: InfertilityFilters = useMemo(
    () => ({
      search: filters.search,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
    }),
    [filters]
  );

  const { data: patientData, isLoading } = useFetchInfertilityData(hookFilters);

  // Handle filter changes from search component
  const handleFiltersChange = useCallback(
    (newFilters: {
      search?: string;
      department?: string;
      dateRange?: string;
      startDate?: Date;
      endDate?: Date;
    }) => {
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
    (patient: InfertilityPatientData) => {
      actions.openEditModal(patient);
    },
    [actions]
  );

  // Normalize patient data
  const normalizedPatientData = useMemo(
    () => normalizePatientData(patientData),
    [patientData]
  );

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

          {/* Search Bar */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-6">
            <InfertilitySearch
              onFiltersChange={handleFiltersChange}
              disabled={isLoading}
            />
          </div>

          {/* Table Container */}
          <div className="px-1 sm:px-2 lg:px-4">
            <PatientTable
              tableData={normalizedPatientData}
              isLoading={isLoading}
              onEdit={handleOpenEditPopup}
            />
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
