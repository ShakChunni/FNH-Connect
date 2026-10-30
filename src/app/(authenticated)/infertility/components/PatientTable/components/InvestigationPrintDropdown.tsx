"use client";
import React, { useState, useRef, useCallback } from "react";
import { Printer, ChevronDown, Loader2, FileText, Users, UserRound } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { api } from "@/lib/axios";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";
import { formatBDT } from "@/lib/timezone";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { generateInfertilityTestReceipt } from "../../../utils/generateReceipt";
import { generateInfertilityInvestigationReport } from "../../../utils/generateInvestigationReport";
import type { InfertilityTestData } from "../../../types";

interface InvestigationPrintDropdownProps {
  patientId: number;
  testCount: number | undefined;
}

const InvestigationPrintDropdown: React.FC<InvestigationPrintDropdownProps> = ({
  patientId,
  testCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [investigations, setInvestigations] = useState<InfertilityTestData[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const isDisabled = !testCount || testCount === 0;

  const fetchInvestigations = useCallback(async (force = false) => {
    if (hasFetched && !force) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await api.get<{
        success: boolean;
        data: InfertilityTestData[];
        error?: string;
      }>(`/infertility-patients/tests?infertilityPatientId=${patientId}&limit=100`);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to load investigations");
      }

      setInvestigations(response.data.data);
      setHasFetched(true);
    } catch (error) {
      console.error("Failed to fetch investigations:", error);
      setLoadError("Unable to load investigations. Try again.");
      showNotification("Failed to load investigations", "error");
    } finally {
      setIsLoading(false);
    }
  }, [patientId, hasFetched, showNotification]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    if (!isOpen) {
      fetchInvestigations();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (
    e: React.MouseEvent,
    investigation: InfertilityTestData,
  ) => {
    e.stopPropagation();
    setIsOpen(false);
    generateInfertilityTestReceipt(investigation, user?.fullName || "Staff");
    showNotification("Generating investigation receipt...", "success");
  };

  const handlePrintAll = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (investigations.length === 0 || isPrintingAll) return;

    setIsPrintingAll(true);
    try {
      await generateInfertilityInvestigationReport(
        investigations,
        "detailed",
        undefined,
        user?.fullName || "Staff",
      );
      showNotification("Generating combined investigation report...", "success");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to generate combined investigation report:", error);
      showNotification("Failed to generate combined investigation report", "error");
    } finally {
      setIsPrintingAll(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatBDT(dateStr, "MMM dd, yyyy");
  };

  const groupedInvestigations = [
    {
      key: "PATIENT",
      label: "Patient tests",
      description: "Tests ordered for the main patient",
      icon: <UserRound size={12} />,
      className: "text-indigo-700 bg-indigo-50",
      items: investigations.filter((investigation) => investigation.subjectType === "PATIENT"),
    },
    {
      key: "SPOUSE",
      label: "Husband / partner tests",
      description: "Tests tracked under the same case",
      icon: <Users size={12} />,
      className: "text-rose-700 bg-rose-50",
      items: investigations.filter((investigation) => investigation.subjectType === "SPOUSE"),
    },
    {
      key: "UNKNOWN",
      label: "Needs subject review",
      description: "Legacy test without a subject assignment",
      icon: <FileText size={12} />,
      className: "text-amber-700 bg-amber-50",
      items: investigations.filter((investigation) => investigation.subjectType === "UNKNOWN"),
    },
  ].filter((group) => group.items.length > 0);

  const getInvestigationPreview = (investigation: InfertilityTestData) => {
    const names = investigation.selectedTests;
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={isDisabled}
        aria-label={isDisabled ? "No investigations to print" : "Print infertility investigations"}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`flex h-9 items-center justify-center gap-0.5 rounded-lg px-2 transition-colors ${
          isDisabled
            ? "bg-slate-100 text-slate-500 cursor-not-allowed opacity-50"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
        }`}
        title={isDisabled ? "No investigations to print" : "Print Investigation Receipt"}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Printer size={14} />
        )}
        <ChevronDown
          size={8}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
        {testCount && testCount > 0 ? (
          <span className="min-w-3.5 rounded-full bg-slate-700 px-1 text-2xs font-bold leading-3.5 text-white">
            {testCount}
          </span>
        ) : null}
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[260px] z-100001"
      >
        <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                Investigation receipts
              </p>
              <p className="mt-0.5 text-2xs text-slate-500">
                Patient and husband tests stay under this case.
              </p>
            </div>
            {investigations.length > 0 ? (
              <button
                type="button"
                onClick={handlePrintAll}
                disabled={isPrintingAll}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-2xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPrintingAll ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Printer size={11} />
                )}
                Print all
              </button>
            ) : null}
          </div>
        </div>

        <div className="py-1 max-h-[240px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-slate-500" />
              <span className="ml-2 text-2xs text-slate-500">Loading...</span>
            </div>
          ) : loadError ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setHasFetched(false);
                setLoadError(null);
                void fetchInvestigations(true);
              }}
              className="w-full px-3 py-4 text-center text-2xs text-red-600 hover:bg-red-50"
            >
              {loadError}
            </button>
          ) : investigations.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <FileText size={16} className="mx-auto text-slate-300 mb-1" />
              <p className="text-2xs text-slate-500">No investigations found</p>
            </div>
          ) : (
            groupedInvestigations.map((group) => (
              <div key={group.key} className="border-b border-slate-100 last:border-b-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <span className={`rounded-md p-1 ${group.className}`}>{group.icon}</span>
                  <div>
                    <p className="text-2xs font-bold text-slate-700">{group.label}</p>
                    <p className="text-2xs text-slate-500">{group.description}</p>
                  </div>
                  <span className="ml-auto text-2xs font-bold text-slate-500">
                    {group.items.length}
                  </span>
                </div>
                {group.items.map((investigation) => (
                  <button
                    key={investigation.id}
                    type="button"
                    onClick={(e) => handleSelect(e, investigation)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Printer size={12} className="shrink-0 text-slate-500" />
                      <div className="min-w-0">
                        <p className="truncate text-2xs font-semibold text-slate-700">
                          {investigation.testNumber}
                        </p>
                        <p className="truncate text-2xs text-slate-500">
                          {getInvestigationPreview(investigation)} · {formatDate(investigation.testDate)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0">
                        <StatusBadge status={investigation.isCompleted ? "Completed" : "Pending"} />
                      </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </DropdownPortal>
    </>
  );
};

export default React.memo(InvestigationPrintDropdown);
