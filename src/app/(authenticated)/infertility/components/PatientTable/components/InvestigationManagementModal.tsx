"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Beaker,
  CalendarDays,
  Edit2,
  Loader2,
  Plus,
  TestTube2,
  X,
} from "lucide-react";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import type {
  InfertilityPatientData,
  InfertilityTestData,
} from "../../../types";

interface InvestigationManagementModalProps {
  isOpen: boolean;
  patient: InfertilityPatientData | null;
  onClose: () => void;
  onAddInvestigation: (patient: InfertilityPatientData) => void;
  onEditInvestigation: (test: InfertilityTestData) => void;
}

interface InvestigationListResponse {
  success: boolean;
  data: InfertilityTestData[];
  error?: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getTestSummary(test: InfertilityTestData): string {
  const selectedTests = test.testResults?.tests || test.selectedTests || [];

  if (selectedTests.length === 0) {
    return "No tests selected";
  }

  if (selectedTests.length <= 2) {
    return selectedTests.join(", ");
  }

  return `${selectedTests.slice(0, 2).join(", ")} +${selectedTests.length - 2} more`;
}

const InvestigationManagementModal: React.FC<
  InvestigationManagementModalProps
> = ({
  isOpen,
  patient,
  onClose,
  onAddInvestigation,
  onEditInvestigation,
}) => {
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [investigations, setInvestigations] = useState<InfertilityTestData[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  const fetchInvestigations = useCallback(async () => {
    if (!patient) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<InvestigationListResponse>(
        `/infertility-patients/tests?infertilityPatientId=${patient.id}&limit=100`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to load investigations");
      }

      setInvestigations(response.data.data);
    } catch (unknownError) {
      console.error("Failed to load patient investigations:", unknownError);
      setError("Failed to load investigations.");
      showNotification("Failed to load investigations", "error");
    } finally {
      setIsLoading(false);
    }
  }, [patient, showNotification]);

  useEffect(() => {
    if (isOpen) {
      fetchInvestigations();
    } else {
      setInvestigations([]);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, fetchInvestigations]);

  const title = useMemo(() => {
    if (!patient) return "Investigations";
    return `${patient.patientFullName} Investigations`;
  }, [patient]);

  if (!isOpen || !patient) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-100000 flex items-center justify-center bg-slate-900/70 px-3 py-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-xl bg-teal-100 p-2 text-teal-700">
              <Beaker className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900">
                {title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review existing investigation orders or add a new one.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close investigation manager"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading investigations...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
              {error}
              <button
                type="button"
                onClick={fetchInvestigations}
                className="ml-3 font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : investigations.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <TestTube2 className="mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">
                No investigations ordered yet.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add the first investigation for this patient.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {investigations.map((investigation) => (
                <div
                  key={investigation.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
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
                          {investigation.isCompleted ? "Completed" : "Pending"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        {getTestSummary(investigation)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(investigation.testDate)}
                        </span>
                        <span>Charge: ৳{investigation.grandTotal}</span>
                        <span>Paid: ৳{investigation.paidAmount}</span>
                        <span>Due: ৳{investigation.dueAmount}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditInvestigation(investigation)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-950"
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

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onAddInvestigation(patient)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" />
            Add Investigation
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InvestigationManagementModal);
