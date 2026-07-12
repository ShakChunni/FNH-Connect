"use client";
import React, { useState, useRef, useCallback } from "react";
import { Printer, ChevronDown, Loader2, FileText, Users, UserRound } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { api } from "@/lib/axios";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";
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
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
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
        className={`p-1.5 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-0.5 ${
          isDisabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
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
          <span className="min-w-3.5 rounded-full bg-gray-700 px-1 text-[9px] font-bold leading-3.5 text-white">
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
        <div className="border-b border-gray-100 bg-gray-50/70 px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Investigation receipts
              </p>
              <p className="mt-0.5 text-[9px] text-gray-400">
                Patient and husband tests stay under this case.
              </p>
            </div>
            {investigations.length > 0 ? (
              <button
                type="button"
                onClick={handlePrintAll}
                disabled={isPrintingAll}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-700 px-2 py-1 text-[9px] font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
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
              <Loader2 size={16} className="animate-spin text-gray-400" />
              <span className="ml-2 text-[11px] text-gray-500">Loading...</span>
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
              className="w-full px-3 py-4 text-center text-[11px] text-red-600 hover:bg-red-50"
            >
              {loadError}
            </button>
          ) : investigations.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <FileText size={16} className="mx-auto text-gray-300 mb-1" />
              <p className="text-[11px] text-gray-500">No investigations found</p>
            </div>
          ) : (
            groupedInvestigations.map((group) => (
              <div key={group.key} className="border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <span className={`rounded-md p-1 ${group.className}`}>{group.icon}</span>
                  <div>
                    <p className="text-[10px] font-bold text-gray-700">{group.label}</p>
                    <p className="text-[9px] text-gray-400">{group.description}</p>
                  </div>
                  <span className="ml-auto text-[9px] font-bold text-gray-400">
                    {group.items.length}
                  </span>
                </div>
                {group.items.map((investigation) => (
                  <button
                    key={investigation.id}
                    type="button"
                    onClick={(e) => handleSelect(e, investigation)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Printer size={12} className="shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-gray-700">
                          {investigation.testNumber}
                        </p>
                        <p className="truncate text-[9px] text-gray-500">
                          {getInvestigationPreview(investigation)} · {formatDate(investigation.testDate)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        investigation.isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {investigation.isCompleted ? "Done" : "Pending"}
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
