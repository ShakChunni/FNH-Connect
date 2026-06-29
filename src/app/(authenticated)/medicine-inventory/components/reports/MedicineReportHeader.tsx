"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  Layers,
  List,
  Loader2,
  Package,
  Printer,
  ShoppingCart,
} from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import type { MedicineReportMode, MedicineReportTarget } from "./types";

interface MedicineReportHeaderProps {
  disabled?: boolean;
  isLoading?: boolean;
  onGenerateReport: (
    mode: MedicineReportMode,
    target: MedicineReportTarget,
  ) => void;
}

const reportOptions: Array<{
  target: MedicineReportTarget;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    target: "available",
    label: "Available Stock",
    description: "Current in-stock medicines",
    icon: Package,
  },
  {
    target: "lowStock",
    label: "Low Stock",
    description: "Medicines at or below threshold",
    icon: AlertTriangle,
  },
  {
    target: "purchases",
    label: "Purchases",
    description: "Supplier purchase records",
    icon: ClipboardList,
  },
  {
    target: "sales",
    label: "Sales",
    description: "Patient medicine sales",
    icon: ShoppingCart,
  },
  {
    target: "combined",
    label: "Combined",
    description: "All inventory sections",
    icon: Layers,
  },
];

/**
 * Print report dropdown for the medicine inventory page.
 *
 * Follows the same pattern as the dashboard cash tracker header:
 * a single print button that opens a portal dropdown with summary
 * and detailed report options.
 */
export const MedicineReportHeader: React.FC<MedicineReportHeaderProps> = ({
  disabled = false,
  isLoading = false,
  onGenerateReport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleReport = (
    mode: MedicineReportMode,
    target: MedicineReportTarget,
  ) => {
    onGenerateReport(mode, target);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-fnh-navy hover:bg-fnh-navy-dark text-white rounded-xl transition-all shadow-sm text-xs sm:text-sm font-semibold cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap"
        title="Print Report"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
        ) : (
          <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
        <span>Print Report</span>
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        buttonRef={buttonRef}
        matchButtonWidth={false}
        className="w-[min(22rem,calc(100vw-1rem))] max-h-[min(78vh,34rem)] overflow-hidden p-0"
      >
        <div className="border-b border-gray-100 px-3 py-2.5">
          <p className="text-xs font-bold text-fnh-navy-dark">Print Report</p>
          <p className="text-[10px] text-gray-500">
            Choose a section, then print summary or detailed.
          </p>
        </div>

        <div className="max-h-[calc(min(78vh,34rem)-3.5rem)] overflow-y-auto p-2">
          {reportOptions.map((option, index) => {
            const Icon = option.icon;

            return (
              <div key={option.target}>
                {index > 0 ? (
                  <div className="h-px bg-gray-100 mx-1 my-1" />
                ) : null}

                <div className="rounded-lg px-2 py-2 hover:bg-gray-50">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-fnh-navy/5 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-fnh-navy" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-fnh-navy-dark">
                          {option.label}
                        </p>
                        <p className="truncate text-[10px] text-gray-500">
                          {option.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleReport("summary", option.target)}
                        disabled={isLoading}
                        className="flex h-8 w-9 items-center justify-center rounded-lg border border-fnh-navy/10 bg-fnh-navy/5 text-fnh-navy hover:bg-fnh-navy/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`${option.label} summary`}
                        aria-label={`${option.label} summary report`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReport("detailed", option.target)}
                        disabled={isLoading}
                        className="flex h-8 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`${option.label} detailed`}
                        aria-label={`${option.label} detailed report`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default MedicineReportHeader;
