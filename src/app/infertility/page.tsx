"use client";
import React, { useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import AddNewDataInfertility from "./components/AddNewData/AddNewDataInfertility";
import EditDataInfertility from "./components/EditData/EditDataInfertility";
import PatientTable from "./components/PatientTable/PatientTable";
import ButtonContainer from "./components/ButtonContainer";
import MessagePopup from "./components/MessagePopup";
import Filters from "./components/Filters/Filters";
import { InfertilityPatientData } from "./types";
import { useFetchInfertilityData } from "./hooks";
import type { InfertilityFilters } from "./types";
import { normalizePatientData } from "./components/form-sections/utils/dataUtils";
import {
  useInfertilityFilters,
  useInfertilitySearch,
  useInfertilityUI,
  useInfertilityModals,
  useInfertilityMessage,
  useInfertilityActions,
} from "./stores";

const InfertilityManagement = React.memo(() => {
  // Zustand store selectors
  const filters = useInfertilityFilters();
  const searchParams = useInfertilitySearch();
  const ui = useInfertilityUI();
  const modals = useInfertilityModals();
  const message = useInfertilityMessage();
  const actions = useInfertilityActions();

  // Map page filters to hook filters
  const hookFilters: InfertilityFilters = useMemo(
    () => ({
      status: filters.leadsFilter !== "All" ? filters.leadsFilter : undefined,
      search: searchParams?.searchTerm || undefined,
    }),
    [filters.leadsFilter, searchParams]
  );

  const {
    data: patientData,
    isLoading,
    refetch,
  } = useFetchInfertilityData(hookFilters);

  const messagePopupRef = useRef<HTMLDivElement>(null);

  // Handle table search
  const handleTableSearch = useCallback(
    (searchTerm: string) => {
      actions.setSearchParams(
        searchTerm ? { searchTerm, searchField: "patientFullName" } : undefined
      );
    },
    [actions]
  );

  // Handle dropdown toggle
  const handleToggleDropdowns = useCallback(
    (isExpanded: boolean) => {
      actions.setShowDropdowns(isExpanded);
    },
    [actions]
  );

  // Handle filter updates
  const handleFilterUpdate = useCallback(
    (key: string, value: any) => {
      actions.updateFilter(key as keyof typeof filters, value);
    },
    [actions, filters]
  );

  // Handle edit patient
  const handleOpenEditPopup = useCallback(
    (patient: InfertilityPatientData) => {
      actions.openEditModal(patient);
    },
    [actions]
  );

  // Handle messages
  const handleMessage = useCallback(
    (type: "success" | "error", content: string) => {
      actions.showMessage(type, content);
    },
    [actions]
  );

  // Normalize patient data
  const normalizedPatientData = useMemo(
    () => normalizePatientData(patientData),
    [patientData]
  );

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-2 sm:pb-3 lg:pb-4">
      <div className="mx-auto w-full px-2 sm:px-4 lg:px-2 pt-2 sm:pt-3 lg:pt-4">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6 px-2 sm:px-4 lg:px-2 w-full max-w-full overflow-hidden">
          {/* Button Container */}
          <div className="px-2 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
            <ButtonContainer
              onToggleExpand={handleToggleDropdowns}
              isExpanded={ui.showDropdowns}
              onAddData={actions.openAddModal}
            />
          </div>

          {/* Animated dropdown filter section */}
          <AnimatePresence>
            {ui.showDropdowns && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden bg-fnh-porcelain"
              >
                <div className="px-2 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
                  <Filters
                    filters={filters}
                    onFilterUpdate={handleFilterUpdate}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table Container */}
          <div className="p-2 sm:p-4 lg:p-8">
            <PatientTable
              tableData={normalizedPatientData}
              isLoading={isLoading}
              onSearch={handleTableSearch}
              onEdit={handleOpenEditPopup}
              onMessage={handleMessage}
              messagePopupRef={
                messagePopupRef as React.RefObject<HTMLDivElement>
              }
            />
          </div>
        </div>
      </div>

      {/* Message Popup */}
      <AnimatePresence>
        <MessagePopup
          messageType={message.type}
          messageContent={message.content}
          onDismiss={actions.dismissMessage}
          messagePopupRef={messagePopupRef as React.RefObject<HTMLDivElement>}
        />
      </AnimatePresence>

      {/* Add New Data Portal */}
      {(modals.isAddOpen || modals.isAddClosing) &&
        typeof window !== "undefined" &&
        createPortal(
          <AddNewDataInfertility
            isOpen={modals.isAddOpen && !modals.isAddClosing}
            onClose={actions.closeAddModal}
            onMessage={handleMessage}
            messagePopupRef={messagePopupRef}
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
            onMessage={handleMessage}
            messagePopupRef={messagePopupRef}
            patientData={modals.selectedPatient}
          />,
          document.body
        )}
    </div>
  );
});

InfertilityManagement.displayName = "InfertilityManagement";

export default InfertilityManagement;
