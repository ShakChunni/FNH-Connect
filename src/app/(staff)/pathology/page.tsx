"use client";

import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

// Modular Components
import { PageHeader } from "@/components/ui/PageHeader";
import AddNewDataPathology from "./components/AddNewData/AddNewDataPathology";
import EditDataPathology from "./components/EditData/EditDataPathology";
import PatientTable from "./components/PatientTable/PatientTable";
import { NewPatientButton } from "./components/NewPatientButton";
import { PathologySearch } from "./components/PathologySearch";

// Types and Hooks
import { PathologyPatientData } from "./types";
import { useFetchPathologyData } from "./hooks";
import type { PathologyFilters } from "./types";
import { useModals, usePathologyActions } from "./stores";

const PathologyManagement = React.memo(() => {
  // Zustand store selectors
  const modals = useModals();
  const actions = usePathologyActions();

  // Local state for filters
  const [filters, setFilters] = useState<{
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }>({});

  // Map filters to hook format
  const hookFilters: PathologyFilters = useMemo(
    () => ({
      search: filters.search,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
    }),
    [filters]
  );

  const { data: pathologyPatients = [], isLoading } =
    useFetchPathologyData(hookFilters);

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
    (patient: PathologyPatientData) => {
      actions.openEditModal(patient);
    },
    [actions]
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

          {/* Search Bar */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-6">
            <PathologySearch
              onFiltersChange={handleFiltersChange}
              disabled={isLoading}
            />
          </div>

          {/* Table Container */}
          <div className="px-1 sm:px-2 lg:px-4">
            <PatientTable
              tableData={tableData}
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
