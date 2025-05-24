"use client";
import React, { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PatientTable from "./components/PatientTable/PatientTable";
import SkeletonPatientTable from "./components/SkeletonPatientTable";
import useFetchData from "./hooks/useFetchData";
import { useAuth } from "../AuthContext";

interface FilterState {
  dateSelector: {
    start: string | null;
    end: string | null;
  };
}

interface SearchParams {
  searchTerm: string;
  searchField: string;
}

const InfertilityManagement = React.memo(() => {
  const { user } = useAuth();

  const [filters, setFilters] = useState<FilterState>({
    dateSelector: { start: null, end: null },
  });

  const [shouldFetchData, setShouldFetchData] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchParams | undefined>(
    undefined
  );

  const {
    data: patientData,
    isLoading,
    customOptions,
    refetch,
  } = useFetchData(filters, shouldFetchData, searchParams);

  const handleTableSearch = useCallback(
    (searchTerm: string, searchField: string) => {
      setSearchParams({ searchTerm, searchField });
      setShouldFetchData(true);
      refetch();
    },
    [refetch]
  );

  const handleFilterUpdate = useCallback(
    (key: string, value: any) => {
      setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
      setShouldFetchData(true);

      if (searchParams) {
        setSearchParams(undefined);
      }

      refetch().catch((error: unknown) => {
        console.error("Error refetching data:", error);
      });
    },
    [refetch, searchParams]
  );

  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [messageContent, setMessageContent] = useState<string>("");

  const handleMessage = useCallback(
    (type: "success" | "error", content: string) => {
      setMessageType(type);
      setMessageContent(content);
      setShouldFetchData(true);

      setNotification({
        message: content,
        type: type,
        visible: true,
      });

      refetch();
      setTimeout(() => {
        setMessageType(null);
        setMessageContent("");
        setShouldFetchData(false);
      }, 2500);
    },
    [refetch]
  );

  const dismissMessage = useCallback(() => {
    setMessageType(null);
    setMessageContent("");
  }, []);

  const messagePopupRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  const DateFilterDropdown = React.memo(() => (
    <div className="flex justify-center items-center mb-6 py-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Start Date:</label>
          <input
            type="date"
            value={filters.dateSelector.start || ""}
            onChange={(e) =>
              handleFilterUpdate("dateSelector", {
                ...filters.dateSelector,
                start: e.target.value,
              })
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">End Date:</label>
          <input
            type="date"
            value={filters.dateSelector.end || ""}
            onChange={(e) =>
              handleFilterUpdate("dateSelector", {
                ...filters.dateSelector,
                end: e.target.value,
              })
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>
    </div>
  ));

  DateFilterDropdown.displayName = "DateFilterDropdown";

  return (
    <div className="bg-[#E3E6EB] min-h-screen pt-6">
      <div className="px-4 lg:px-12 mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Infertility Management
          </h1>
        </div>

        <DateFilterDropdown />

        <AnimatePresence>
          {messageType && (
            <motion.div
              ref={messagePopupRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-[9999]"
            >
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 text-center">
                <div className="mb-4">{messageContent}</div>
                <button
                  onClick={dismissMessage}
                  className="bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg w-full"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          {isLoading ? (
            <SkeletonPatientTable />
          ) : (
            <PatientTable
              tableData={patientData || []}
              customOptions={customOptions}
              onMessage={handleMessage}
              messagePopupRef={messagePopupRef}
              onSearch={handleTableSearch}
            />
          )}
        </div>
      </div>
    </div>
  );
});

InfertilityManagement.displayName = "InfertilityManagement";

export default InfertilityManagement;
