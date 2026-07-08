"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { ClientPortal } from "@/components/ui/ClientPortal";

// Modular Components
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/pagination/Pagination";
import {
  PatientRecordsSearch,
  PatientTable,
  EditPatientModal,
} from "../../patient-records/components";

// Types, Hooks and Stores (shared with the general Patient Records page)
import type { PatientData, PatientFilters } from "../../patient-records/types";
import { useFetchPatients } from "../../patient-records/hooks";
import {
  usePatientModals,
  usePatientActions,
  usePagination,
  useFilters,
} from "../../patient-records/stores";
import { parseDateOfBirth } from "@/lib/dateOfBirth";

const InfertilityPatientRecordsPage = React.memo(() => {
  // Zustand store selectors (shared store)
  const modals = usePatientModals();
  const actions = usePatientActions();
  const pagination = usePagination();
  const filters = useFilters();

  // Reset shared store state on mount so state doesn't leak in from the
  // general Patient Records page (admins can switch between portals).
  useEffect(() => {
    actions.resetFilters();
    return () => {
      actions.resetFilters();
    };
  }, [actions]);

  // Map pagination and filters to hook filters format.
  // `infertilityOnly` scopes results to HSI Center patients regardless of role.
  const hookFilters: PatientFilters = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search.length >= 2 ? filters.search : undefined,
      infertilityOnly: true,
    }),
    [pagination.page, pagination.limit, filters.search],
  );

  const { data: result, isLoading } = useFetchPatients(hookFilters);

  // Handle edit patient
  const handleOpenEditPopup = useCallback(
    (patient: PatientData) => {
      actions.openEditModal(patient);
    },
    [actions],
  );

  // Normalize patient data (ensure dates are Date objects)
  const normalizedPatientData = useMemo(() => {
    if (!result?.data) return [];
    return result.data.map((p) => ({
      ...p,
      dateOfBirth: parseDateOfBirth(p.dateOfBirth),
      guardianDOB: parseDateOfBirth(p.guardianDOB),
      guardianGender: p.guardianGender || null,
      createdByName: p.createdByName || null,
      lastEditedByName: p.lastEditedByName || null,
      lastEditedAt: p.lastEditedAt ? new Date(p.lastEditedAt) : null,
      createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
    }));
  }, [result?.data]);

  // Pagination handlers
  const handlePageChange = useCallback(
    (page: number) => {
      actions.setPage(page);
    },
    [actions],
  );

  const handlePrevPage = useCallback(() => {
    if (pagination.page > 1) {
      actions.setPage(pagination.page - 1);
    }
  }, [actions, pagination.page]);

  const handleNextPage = useCallback(() => {
    if (result && pagination.page < result.totalPages) {
      actions.setPage(pagination.page + 1);
    }
  }, [actions, pagination.page, result]);

  // Calculate pagination indices
  const startIndex = useMemo(() => {
    return (pagination.page - 1) * pagination.limit + 1;
  }, [pagination.page, pagination.limit]);

  const endIndex = useMemo(() => {
    if (!result) return 0;
    return Math.min(pagination.page * pagination.limit, result.total);
  }, [pagination.page, pagination.limit, result]);

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-2 sm:pb-3 lg:pb-4 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-4 lg:pb-8">
            <PageHeader
              title="Patient Records"
              subtitle="View and manage HSI Center patient information"
            />
          </div>

          {/* Search Bar */}
          <div className="px-0 sm:px-2 lg:px-4 pb-2 sm:pb-4 lg:pb-6">
            <PatientRecordsSearch
              disabled={isLoading}
              recordCount={result?.total || 0}
            />
          </div>

          {/* Patient Table */}
          <div className="px-1 sm:px-2 lg:px-4">
            <PatientTable
              tableData={normalizedPatientData}
              isLoading={isLoading}
              onEdit={handleOpenEditPopup}
              startIndex={startIndex}
            />

            {/* Server-Side Pagination */}
            {!isLoading && result && result.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={result.totalPages}
                  totalResults={result.total}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onPageChange={handlePageChange}
                  onPrev={handlePrevPage}
                  onNext={handleNextPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Patient Modal Portal */}
      {(modals.isEditOpen || modals.isEditClosing) &&
        modals.selectedPatient && (
          <ClientPortal>
            <EditPatientModal
              isOpen={modals.isEditOpen && !modals.isEditClosing}
              onClose={actions.closeEditModal}
              patientData={modals.selectedPatient}
            />
          </ClientPortal>
        )}
    </div>
  );
});

InfertilityPatientRecordsPage.displayName = "InfertilityPatientRecordsPage";

export default InfertilityPatientRecordsPage;
