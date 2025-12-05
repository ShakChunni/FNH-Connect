"use client";
import React, { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { PlusIcon } from "lucide-react";
import AddNewDataInfertility from "./components/AddNewData/AddNewDataInfertility";
import EditDataInfertility from "./components/EditData/EditDataInfertility";
import PatientTable from "./components/PatientTable/PatientTable";
import { SearchBar } from "@/components/ui/SearchBar";
import { InfertilityPatientData } from "./types";
import { useFetchInfertilityData } from "./hooks";
import type { InfertilityFilters } from "./types";
import { normalizePatientData } from "./components/form-sections/utils/dataUtils";
import { useInfertilityModals, useInfertilityActions } from "./stores";

// Department options for infertility page
const DEPARTMENT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "infertility", label: "Infertility" },
];

// Helper to calculate date range
const getDateRangeFromOption = (
  option: string
): { start?: Date; end?: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (option) {
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case "last_week": {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return { start: lastWeek, end: now };
    }
    case "last_month": {
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return { start: lastMonth, end: now };
    }
    case "last_3_months": {
      const last3Months = new Date(today);
      last3Months.setMonth(last3Months.getMonth() - 3);
      return { start: last3Months, end: now };
    }
    case "last_6_months": {
      const last6Months = new Date(today);
      last6Months.setMonth(last6Months.getMonth() - 6);
      return { start: last6Months, end: now };
    }
    case "this_year": {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { start: startOfYear, end: now };
    }
    default:
      return {};
  }
};

const InfertilityManagement = React.memo(() => {
  // Zustand store selectors
  const modals = useInfertilityModals();
  const actions = useInfertilityActions();

  // Local state for search bar
  const [searchValue, setSearchValue] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");

  // Calculate date range for API
  const dateRange = useMemo(
    () => getDateRangeFromOption(selectedDateRange),
    [selectedDateRange]
  );

  // Map filters to hook format
  const hookFilters: InfertilityFilters = useMemo(
    () => ({
      search: searchValue.length >= 2 ? searchValue : undefined,
      startDate: dateRange.start?.toISOString(),
      endDate: dateRange.end?.toISOString(),
    }),
    [searchValue, dateRange]
  );

  const { data: patientData, isLoading } = useFetchInfertilityData(hookFilters);

  // Handle search value change with debounced API call
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  // Handle explicit search (Enter key)
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  // Handle department change
  const handleDepartmentChange = useCallback((value: string) => {
    setSelectedDepartment(value);
  }, []);

  // Handle date range change
  const handleDateRangeChange = useCallback((value: string) => {
    setSelectedDateRange(value);
  }, []);

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
      <div className="mx-auto w-full max-w-full px-2 sm:px-4 lg:px-6 pt-2 sm:pt-3 lg:pt-4">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Top: New Patient Button - Right aligned */}
          <div className="flex justify-end px-2 sm:px-4 lg:px-8">
            <button
              onClick={actions.openAddModal}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-linear-to-r from-fnh-blue to-blue-600 hover:from-blue-500 hover:to-fnh-blue text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm sm:text-base cursor-pointer"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>New Patient</span>
            </button>
          </div>

          {/* Center: Search Bar */}
          <div className="px-2 sm:px-4 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <SearchBar
                departments={DEPARTMENT_OPTIONS}
                selectedDepartment={selectedDepartment}
                onDepartmentChange={handleDepartmentChange}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                onSearch={handleSearch}
                placeholder="Search by patient name or mobile number..."
                showDateFilter={true}
                selectedDateRange={selectedDateRange}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="px-2 sm:px-4 lg:px-8">
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
