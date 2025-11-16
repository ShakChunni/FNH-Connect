"use client";
import React, { useState, useRef, useCallback, useMemo } from "react";
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
import type { InfertilityFilters, FilterState, SearchParams } from "./types";
import { normalizePatientData } from "./utils";

const InfertilityManagement = React.memo(() => {
  // Only leadsFilter and dateSelector for this page
  const [filters, setFilters] = useState<FilterState>({
    dateSelector: { start: null, end: null, option: [] },
    leadsFilter: "All",
  });

  // UI state for dropdowns
  const [showDropdowns, setShowDropdowns] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // AddNewData popup state (open/closing) to match dashboard behavior
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPopupClosing, setIsPopupClosing] = useState(false);

  // EditData popup state
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isEditPopupClosing, setIsEditPopupClosing] = useState(false);
  const [selectedPatient, setSelectedPatient] =
    useState<InfertilityPatientData | null>(null);

  const [searchParams, setSearchParams] = useState<SearchParams | undefined>(
    undefined
  );

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

  // FIX 1: Use correct ref type
  const messagePopupRef = useRef<HTMLDivElement>(null);

  // FIX 2: Update handleTableSearch to match PatientTable's expected prop
  const handleTableSearch = useCallback((searchTerm: string) => {
    setSearchParams({ searchTerm, searchField: "patientFullName" }); // Default field
  }, []);

  // Handle dropdown toggle
  const handleToggleDropdowns = useCallback((isExpanded: boolean) => {
    setShowDropdowns(isExpanded);
  }, []);

  // Handle add data popup (open/close with closing animation)
  const handleOpenAddPopup = useCallback(() => {
    setIsPopupOpen(true);
  }, []);

  const handleCloseAddPopup = useCallback(() => {
    setIsPopupClosing(true);
    setTimeout(() => {
      setIsPopupOpen(false);
      setIsPopupClosing(false);
    }, 300);
  }, []);

  // Handle edit data popup (open/close with closing animation)
  const handleOpenEditPopup = useCallback((patient: InfertilityPatientData) => {
    setSelectedPatient(patient);
    setIsEditPopupOpen(true);
  }, []);

  const handleCloseEditPopup = useCallback(() => {
    setIsEditPopupClosing(true);
    setTimeout(() => {
      setIsEditPopupOpen(false);
      setIsEditPopupClosing(false);
      setSelectedPatient(null);
    }, 300);
  }, []);

  // Update filters and trigger fetch (hook logic for new filters to be implemented later)
  const handleFilterUpdate = useCallback(
    (key: string, value: any) => {
      setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
      setIsInitialLoad(false);

      // Reset search params if filter changes
      if (searchParams) {
        setSearchParams(undefined);
      }

      // Only refetch for supported filters; dateSelector not yet implemented in hook
      // if (key === "dateSelector") {
      //   setTimeout(() => {
      //     refetch().catch((error: unknown) => {
      //       console.error("Error refetching data:", error);
      //     });
      //   }, 100);
      // }
    },
    [searchParams]
  );

  // Ref for search bar (stub)
  const searchBarRef = useRef<{ search: () => void }>({ search: () => {} });

  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [messageContent, setMessageContent] = useState<string>("");

  const handleMessage = useCallback(
    (type: "success" | "error", content: string) => {
      setMessageType(type);
      setMessageContent(content);

      // Don't trigger immediate refetch to avoid infinite loops
      setTimeout(() => {
        setMessageType(null);
        setMessageContent("");
      }, 2500);
    },
    [] // Empty dependencies to prevent infinite loops
  );

  // Memoized dismiss message callback
  const dismissMessage = useCallback(() => {
    setMessageType(null);
    setMessageContent("");
  }, []);

  // Optional: parent callback when AddNewData calls onSubmit
  const handleAddData = useCallback(
    async (data: any) => {
      try {
        // Call the actual onSubmit logic here if needed
        // For now, just show success and close
        setMessageType("success");
        setMessageContent("Patient data saved successfully!");

        // Close popup first
        handleCloseAddPopup();

        // Data will be automatically refreshed via invalidateQueries
      } catch (error) {
        console.error("Error in handleAddData:", error);
        setMessageType("error");
        setMessageContent("Failed to save patient data.");
      }
    },
    [handleCloseAddPopup]
  );

  const normalizedPatientData = useMemo(
    () => normalizePatientData(patientData),
    [patientData]
  );

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-3 lg:pb-2">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-2 pt-4 sm:pt-3 lg:pt-2">
        <div className="space-y-4 px-4 sm:space-y-6 sm:px-6 lg:px-2 w-full max-w-full overflow-hidden">
          {/* Button Container */}
          <div className="px-8 py-6">
            <ButtonContainer
              onToggleExpand={handleToggleDropdowns}
              isExpanded={showDropdowns}
              onAddData={handleOpenAddPopup}
            />
          </div>

          {/* Animated dropdown filter section */}
          <AnimatePresence>
            {showDropdowns && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden bg-fnh-porcelain"
              >
                <div className="px-8 py-6">
                  <Filters
                    filters={filters}
                    onFilterUpdate={handleFilterUpdate}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table Container with proper styling */}
          <div className="p-8">
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
          messageType={messageType}
          messageContent={messageContent}
          onDismiss={dismissMessage}
          messagePopupRef={messagePopupRef as React.RefObject<HTMLDivElement>}
        />
      </AnimatePresence>
      {/* Add New Data Portal (open while opening or closing) */}
      {(isPopupOpen || isPopupClosing) &&
        typeof window !== "undefined" &&
        createPortal(
          <AddNewDataInfertility
            isOpen={isPopupOpen && !isPopupClosing}
            onClose={handleCloseAddPopup}
            onMessage={handleMessage}
            messagePopupRef={messagePopupRef}
          />,
          document.body
        )}

      {/* Edit Data Portal (open while opening or closing) */}
      {(isEditPopupOpen || isEditPopupClosing) &&
        selectedPatient &&
        typeof window !== "undefined" &&
        createPortal(
          <EditDataInfertility
            isOpen={isEditPopupOpen && !isEditPopupClosing}
            onClose={handleCloseEditPopup}
            onMessage={handleMessage}
            messagePopupRef={messagePopupRef}
            patientData={selectedPatient}
          />,
          document.body
        )}
    </div>
  );
});

InfertilityManagement.displayName = "InfertilityManagement";

export default InfertilityManagement;
