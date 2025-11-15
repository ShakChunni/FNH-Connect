"use client";
import React, { useState, useRef, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import AddNewDataInfertility from "./components/AddNewData/AddNewDataInfertility";
import EditDataInfertility from "./components/EditData/EditDataInfertility";
import PatientTable from "./components/PatientTable/PatientTable";
import SkeletonPatientTable from "./components/PatientTable/components/SkeletonPatientTable";
import { InfertilityPatientData } from "./components/PatientTable/PatientTable";
import { useFetchInfertilityData } from "./hooks";
import type { InfertilityFilters } from "./types";
import ButtonContainer from "./components/ButtonContainer";
import { useAuth } from "../AuthContext";

interface FilterState {
  dateSelector: {
    start: string | null;
    end: string | null;
    option: string[];
  };
  leadsFilter: string;
}

interface SearchParams {
  searchTerm: string;
  searchField: string;
}

const InfertilityManagement = React.memo(() => {
  const { user } = useAuth();

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

  // Memoized message popup content
  const messagePopupContent = useMemo(() => {
    if (!messageType) return null;

    return (
      <motion.div
        ref={messagePopupRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 flex items-center justify-center z-[99999]"
      >
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center border border-gray-100">
          {/* Title */}
          <h3
            className={`text-lg font-semibold mb-3 ${
              messageType === "success" ? "text-green-700" : "text-red-700"
            }`}
          >
            {messageType === "success" ? "Success!" : "Error!"}
          </h3>
          {/* Message */}
          <div className="mb-6 text-gray-600 leading-relaxed">
            {messageContent}
          </div>
          <button
            onClick={dismissMessage}
            className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
              messageType === "success"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Got it
          </button>
        </div>
      </motion.div>
    );
  }, [messageType, messageContent, dismissMessage]);

  const normalizedPatientData = useMemo(
    () =>
      (patientData || []).map((row) => ({
        id: row.id,
        hospitalName: row.hospital.name,
        patientFirstName: row.patient.fullName.split(" ")[0] || "",
        patientLastName:
          row.patient.fullName.split(" ").slice(1).join(" ") || null,
        patientFullName: row.patient.fullName,
        patientAge: row.patient.age,
        patientDOB: null, // Not available in current API
        husbandName: null, // Not in API
        husbandAge: null, // Not in API
        husbandDOB: null, // Not in API
        mobileNumber: row.patient.phoneNumber,
        address: null, // Not in API
        yearsMarried: row.yearsMarried,
        yearsTrying: row.yearsTrying,
        para: null, // Not in API
        alc: null, // Not in API
        weight: null, // Not in API
        bp: null, // Not in API
        infertilityType: row.infertilityType,
        notes: null, // Not in API
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    [patientData]
  );

  return (
    <div className="bg-[#f6f9fd] min-h-screen pt-6">
      <ButtonContainer
        onToggleExpand={handleToggleDropdowns}
        isExpanded={showDropdowns}
        onAddData={handleOpenAddPopup}
      />

      {/* Animated dropdown filter section */}
      <AnimatePresence>
        {showDropdowns && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          ></motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 lg:px-12 mx-auto">
        <div className="overflow-x-auto rounded-3xl shadow-lg mb-16 md:mb-8">
          {isLoading ? (
            <SkeletonPatientTable />
          ) : (
            <PatientTable
              tableData={normalizedPatientData}
              onMessage={handleMessage}
              messagePopupRef={
                messagePopupRef as React.RefObject<HTMLDivElement>
              }
              onSearch={handleTableSearch}
              onEdit={handleOpenEditPopup}
            />
          )}
        </div>
      </div>

      {/* Message Popup */}
      <AnimatePresence>{messagePopupContent}</AnimatePresence>
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
