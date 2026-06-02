"use client";
import React, { useState, useRef, useCallback } from "react";
import { Printer, ChevronDown, Loader2, FileText } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { api } from "@/lib/axios";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";
import { generateInfertilityTestReceipt } from "../../../utils/generateReceipt";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const isDisabled = !testCount || testCount === 0;

  const fetchInvestigations = useCallback(async () => {
    if (hasFetched) return;
    setIsLoading(true);
    try {
      const response = await api.get<{
        success: boolean;
        data: InfertilityTestData[];
      }>(`/infertility-patients/tests?infertilityPatientId=${patientId}&limit=100`);

      if (response.data.success) {
        setInvestigations(response.data.data);
      }
      setHasFetched(true);
    } catch (error) {
      console.error("Failed to fetch investigations:", error);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={isDisabled}
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
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        className="min-w-[260px] z-100001"
      >
        <div className="px-2.5 py-1.5 border-b border-gray-100 bg-gray-50/50">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            Select Investigation
          </p>
        </div>

        <div className="py-1 max-h-[240px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={16} className="animate-spin text-gray-400" />
              <span className="ml-2 text-[11px] text-gray-500">Loading...</span>
            </div>
          ) : investigations.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <FileText size={16} className="mx-auto text-gray-300 mb-1" />
              <p className="text-[11px] text-gray-500">No investigations found</p>
            </div>
          ) : (
            investigations.map((investigation) => (
              <button
                key={investigation.id}
                onClick={(e) => handleSelect(e, investigation)}
                className="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Printer size={12} className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-700 truncate">
                      {investigation.testNumber}
                    </p>
                    <p className="text-[9px] text-gray-500">
                      {formatDate(investigation.testDate)}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    investigation.subjectType === "SPOUSE"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {investigation.subjectLabel}
                </span>
              </button>
            ))
          )}
        </div>
      </DropdownPortal>
    </>
  );
};

export default React.memo(InvestigationPrintDropdown);
