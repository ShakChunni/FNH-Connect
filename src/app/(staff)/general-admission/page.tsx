"use client";

import React, { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

// Modular Components
import { PageHeader } from "@/components/ui/PageHeader";
import AddNewDataAdmission from "./components/AddNewData/AddNewDataAdmission";
import EditDataAdmission from "./components/EditData/EditDataAdmission";
import PatientTable from "./components/PatientTable";
import { AdmissionSearch } from "./components/AdmissionSearch";
import {
  generateAdmissionReceipt,
  generateAdmissionInvoice,
} from "./utils/generateReceipt";

// Types and Hooks
import { AdmissionPatientData, AdmissionFilters } from "./types";
import { useFetchAdmissions } from "./hooks";
import { useModalState, useUIActions, useAdmissionActions } from "./stores";

// New Patient Button Component
const NewPatientButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
}> = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
  // Zustand store selectors
  const modals = useModalState();
  const { openAddModal, closeAddModal, openEditModal, closeEditModal } =
    useUIActions();
  const { initializeFormForEdit, resetForm } = useAdmissionActions();

  // Local state for filters
  const [filters, setFilters] = useState<{
    search?: string;
    departmentId?: number;
    startDate?: Date;
    endDate?: Date;
  }>({});

  // Map filters to hook format
  const hookFilters: AdmissionFilters = useMemo(
    () => ({
      search: filters.search,
      departmentId: filters.departmentId,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
    }),
    [filters]
  );

  const { data: admissions = [], isLoading } = useFetchAdmissions(hookFilters);

  // Handle filter changes from search component
  const handleFiltersChange = useCallback(
    (newFilters: {
      search?: string;
      departmentId?: number;
      dateRange?: string;
      startDate?: Date;
      endDate?: Date;
    }) => {
      setFilters({
        search: newFilters.search,
        departmentId: newFilters.departmentId,
        startDate: newFilters.startDate,
        endDate: newFilters.endDate,
      });
    },
    []
  );

  // Handle edit patient
  const handleEdit = useCallback(
    (patient: AdmissionPatientData) => {
      initializeFormForEdit(patient);
      openEditModal(patient);
    },
    [initializeFormForEdit, openEditModal]
  );

  // Use jsPDF-based receipt generation directly
  const handlePrintAdmission = useCallback(
    async (patient: AdmissionPatientData) => {
      try {
        await generateAdmissionReceipt(patient, "Staff");
      } catch (error) {
        console.error("Failed to generate admission receipt:", error);
      }
    },
    []
  );

  const handlePrintFull = useCallback(async (patient: AdmissionPatientData) => {
    try {
      await generateAdmissionInvoice(patient, "Staff");
    } catch (error) {
      console.error("Failed to generate invoice:", error);
    }
  }, []);

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

          {/* Search Bar */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-6">
            <AdmissionSearch
              onFiltersChange={handleFiltersChange}
              disabled={isLoading}
            />
          </div>

          {/* Table Container */}
          <div className="px-1 sm:px-2 lg:px-4">
            <PatientTable
              data={admissions}
              isLoading={isLoading}
              onEdit={handleEdit}
              onPrintAdmission={handlePrintAdmission}
              onPrintFull={handlePrintFull}
            />
          </div>
        </div>
      </div>

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
