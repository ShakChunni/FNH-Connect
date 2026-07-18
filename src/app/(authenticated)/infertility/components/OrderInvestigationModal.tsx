"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Beaker,
  CalendarDays,
  Edit2,
  Loader2,
  Save,
  TestTube2,
} from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { useNotification } from "@/hooks/useNotification";
import { InvestigationInformation } from "./form-sections/InvestigationInformation";
import { InfertilityPatientData, InfertilityTestData } from "../types";
import { useInfertilityTestFormStore } from "../stores/testFormStore";
import { INFERTILITY_ORDERING_DOCTOR_ID } from "../stores/testFormStore";
import { useAddInfertilityTest } from "../hooks/useAddInfertilityTest";
import { useUpdateInfertilityPatientStatus } from "../hooks/useUpdateInfertilityPatientStatus";
import { buildInvestigationSubjectCards } from "../utils/investigationSubjects";
import { api } from "@/lib/axios";
import { formatBDT } from "@/lib/timezone";

interface OrderInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: InfertilityPatientData | null;
  onEditInvestigation?: (test: InfertilityTestData) => void;
}

interface InvestigationListResponse {
  success: boolean;
  data: InfertilityTestData[];
  error?: string;
}

function formatInvestigationDate(value: string): string {
  return formatBDT(value, "MMM dd, yyyy");
}

function getInvestigationTestSummary(test: InfertilityTestData): string {
  const selectedTests = test.testResults?.tests || test.selectedTests || [];

  if (selectedTests.length === 0) {
    return "No tests selected";
  }

  if (selectedTests.length <= 2) {
    return selectedTests.join(", ");
  }

  return `${selectedTests.slice(0, 2).join(", ")} +${selectedTests.length - 2} more`;
}

export const OrderInvestigationModal: React.FC<OrderInvestigationModalProps> = ({
  isOpen,
  onClose,
  patient,
  onEditInvestigation,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();
  const [existingInvestigations, setExistingInvestigations] = useState<
    InfertilityTestData[]
  >([]);
  const [isLoadingExistingInvestigations, setIsLoadingExistingInvestigations] =
    useState(false);
  const [existingInvestigationsError, setExistingInvestigationsError] =
    useState<string | null>(null);

  const testInfo = useInfertilityTestFormStore((state) => state.testInfo);
  const resetTestForm = useInfertilityTestFormStore((state) => state.resetForm);

  const { addTestAsync, isLoading: isSubmitting } = useAddInfertilityTest();
  const { updateStatusAsync } = useUpdateInfertilityPatientStatus();
  const subjectCards = useMemo(
    () =>
      patient
        ? buildInvestigationSubjectCards({
            patientName: patient.patientFullName,
            patientGender: patient.patientGender,
            patientAge: patient.patientAge,
            patientDateOfBirth: patient.patientDOB,
            patientPhone: patient.mobileNumber,
            spouseName: patient.husbandName,
            spouseGender: patient.spouseGender,
            spouseAge: patient.husbandAge,
            spouseDateOfBirth: patient.husbandDOB,
            spousePhone: patient.husbandPhone,
          })
        : null,
    [patient],
  );

  const isFormValid = useMemo(
    () =>
      testInfo.selectedTests.length > 0 &&
      testInfo.subjectType !== "UNKNOWN" &&
      (testInfo.subjectType !== "SPOUSE" || Boolean(subjectCards?.spouse.isAvailable)),
    [
      subjectCards?.spouse.isAvailable,
      testInfo.selectedTests.length,
      testInfo.subjectType,
    ]
  );

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    resetTestForm();
    onClose();
  }, [isSubmitting, onClose, resetTestForm]);

  const fetchExistingInvestigations = useCallback(async () => {
    if (!patient) return;

    setIsLoadingExistingInvestigations(true);
    setExistingInvestigationsError(null);

    try {
      const response = await api.get<InvestigationListResponse>(
        `/infertility-patients/tests?infertilityPatientId=${patient.id}&limit=100`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to load investigations");
      }

      setExistingInvestigations(response.data.data);
    } catch (error) {
      console.error("Failed to load existing investigations:", error);
      setExistingInvestigationsError("Failed to load existing investigations.");
      showNotification("Failed to load existing investigations", "error");
    } finally {
      setIsLoadingExistingInvestigations(false);
    }
  }, [patient, showNotification]);

  const handleEditExistingInvestigation = useCallback(
    (investigation: InfertilityTestData) => {
      if (!onEditInvestigation || isSubmitting) return;

      resetTestForm();
      onClose();
      onEditInvestigation(investigation);
    },
    [isSubmitting, onClose, onEditInvestigation, resetTestForm],
  );

  const handleSubmit = useCallback(async () => {
    if (!patient) {
      showNotification("No patient selected for investigation", "error");
      return;
    }

    if (!isFormValid) {
      showNotification(
        "Please select at least one investigation, an ordering doctor, and a valid investigation subject",
        "error"
      );
      return;
    }

    if (testInfo.subjectType === "UNKNOWN") {
      showNotification(
        "Choose Patient or Spouse before saving this investigation",
        "error",
      );
      return;
    }

    if (testInfo.subjectType === "SPOUSE" && !subjectCards?.spouse.isAvailable) {
      showNotification(
        "Spouse details are missing. Update the case before ordering spouse investigations.",
        "error",
      );
      return;
    }

    try {
      await addTestAsync({
        infertilityPatientId: patient.id,
        subjectType: testInfo.subjectType,
        subjectNameSnapshot:
          testInfo.subjectType === "SPOUSE"
            ? subjectCards?.spouse.displayName || null
            : null,
        selectedTests: testInfo.selectedTests,
        testCharge: testInfo.testCharge,
        discountType: testInfo.discountType,
        discountValue: testInfo.discountValue,
        discountAmount: testInfo.discountAmount || 0,
        grandTotal: testInfo.grandTotal,
        paidAmount: testInfo.paidAmount,
        dueAmount: testInfo.dueAmount,
        orderedById: INFERTILITY_ORDERING_DOCTOR_ID,
        doneById: testInfo.doneById || null,
        remarks: testInfo.remarks || "",
        testDate: testInfo.testDate || undefined,
        isCompleted: testInfo.isCompleted,
      });

      try {
        await updateStatusAsync({
          id: patient.id,
          status: "Investigation Ordered",
        });
      } catch {
        // Status update failure is already surfaced by the hook notification.
      }

      handleClose();
    } catch {
      // Errors are surfaced by mutation hooks.
    }
  }, [
    patient,
    isFormValid,
    addTestAsync,
    testInfo,
    updateStatusAsync,
    handleClose,
    subjectCards,
    showNotification,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    resetTestForm();
    fetchExistingInvestigations();
  }, [fetchExistingInvestigations, isOpen, resetTestForm]);

  useEffect(() => {
    if (isOpen) return;

    setExistingInvestigations([]);
    setExistingInvestigationsError(null);
    setIsLoadingExistingInvestigations(false);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!patient) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-[95%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] h-[90%] rounded-3xl overflow-hidden flex flex-col"
    >
      <div ref={popupRef} className="flex h-full flex-col">
        <ModalHeader
          icon={Beaker}
          iconColor="green"
          title="Order Investigation"
          subtitle={`Create investigation order for ${patient.patientFullName}`}
          onClose={handleClose}
          isDisabled={isSubmitting}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Patient Name
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {patient.patientFullName}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Case Number
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {patient.caseNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Status
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {patient.status || "Active"}
                </p>
              </div>
            </div>
          </div>

          {subjectCards ? (
            <>
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Current Investigations
                    </h3>
                    <p className="text-xs text-slate-500">
                      Edit an existing order here, or use the form below to add
                      a new one.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {existingInvestigations.length} found
                  </span>
                </div>

                {isLoadingExistingInvestigations ? (
                  <div className="flex min-h-[110px] items-center justify-center text-sm text-slate-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading current investigations...
                  </div>
                ) : existingInvestigationsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {existingInvestigationsError}
                    <button
                      type="button"
                      onClick={fetchExistingInvestigations}
                      className="ml-3 font-semibold underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : existingInvestigations.length === 0 ? (
                  <div className="flex min-h-[110px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                    <TestTube2 className="mb-2 h-6 w-6 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">
                      No investigations ordered yet.
                    </p>
                    <p className="text-xs text-slate-500">
                      Add the first investigation using the form below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {existingInvestigations.map((investigation) => (
                      <div
                        key={investigation.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {investigation.testNumber}
                              </span>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  investigation.subjectType === "SPOUSE"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                {investigation.subjectLabel}
                              </span>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  investigation.isCompleted
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {investigation.isCompleted
                                  ? "Completed"
                                  : "Pending"}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                              {getInvestigationTestSummary(investigation)}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {formatInvestigationDate(
                                  investigation.testDate,
                                )}
                              </span>
                              <span>Charge: ৳{investigation.grandTotal}</span>
                              <span>Due: ৳{investigation.dueAmount}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleEditExistingInvestigation(investigation)
                            }
                            disabled={!onEditInvestigation || isSubmitting}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <InvestigationInformation
                patientSubject={subjectCards.patient}
                spouseSubject={subjectCards.spouse}
              />
            </>
          ) : null}
        </div>

        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isDisabled={!isFormValid}
          cancelText="Cancel"
          submitText="Order Investigation"
          loadingText="Ordering..."
          submitIcon={Save}
          theme="green"
        />
      </div>
    </ModalShell>
  );
};

export default OrderInvestigationModal;
