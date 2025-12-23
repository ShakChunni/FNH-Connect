"use client";
import React, { useState } from "react";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PathologyPatientData } from "../../../../../types";
import { cn } from "@/lib/utils";
import {
  PATHOLOGY_TESTS,
  getTestByCode,
} from "../../../../../constants/pathologyTests";

interface TestDetailsProps {
  patient: PathologyPatientData;
  variant?: "all" | "info" | "investigations";
}

export const TestDetails: React.FC<TestDetailsProps> = ({
  patient,
  variant = "all",
}) => {
  const [showAllTests, setShowAllTests] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not Scheduled";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get test codes from testResults
  const testCodes: string[] =
    patient.testResults?.tests || patient.testResults || [];

  // Map test codes to full test objects
  const tests = testCodes
    .map((codeOrName: string) => {
      const test =
        getTestByCode(codeOrName) ||
        PATHOLOGY_TESTS.find((t) => t.name === codeOrName);
      return (
        test || {
          code: codeOrName,
          name: codeOrName,
          price: 0,
          category: "Unknown",
        }
      );
    })
    .filter(Boolean);

  // Show max tests based on layout
  const limit = variant === "investigations" ? 8 : 4;
  const visibleTests = showAllTests ? tests : tests.slice(0, limit);
  const hasMoreTests = tests.length > limit;

  const details = [
    {
      label: "Test Category",
      value: patient.testCategory,
      icon: Activity,
      color: "bg-teal-50 text-teal-600 border-teal-100",
    },
    {
      label: "Report Status",
      value: patient.isCompleted ? "Completed" : "Pending",
      icon: CheckCircle2,
      color: patient.isCompleted
        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
        : "bg-amber-50 text-amber-600 border-amber-100",
      isBadge: true,
    },
    {
      label: "Report Delivery",
      value: patient.isCompleted
        ? formatDate(patient.updatedAt)
        : formatDate(patient.reportDate),
      icon: Calendar,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
  ];

  const renderInfoCard = () => (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
      {/* Header */}
      <div className="bg-teal-600 px-3 py-2.5 sm:px-5 sm:py-4 flex items-center gap-2">
        <ClipboardList size={14} className="text-white sm:w-4 sm:h-4" />
        <h4 className="text-[11px] sm:text-sm font-bold text-white uppercase tracking-wide">
          Test Info
        </h4>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 space-y-2 sm:space-y-4">
        {details.map((item, idx) => (
          <div
            key={idx}
            className="group flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div
              className={cn(
                "p-1.5 sm:p-2 rounded-md sm:rounded-lg border shrink-0 transition-transform group-hover:scale-110",
                item.color
              )}
            >
              <item.icon
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                strokeWidth={2.5}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5 sm:mb-1">
                {item.label}
              </p>
              {item.isBadge ? (
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold uppercase",
                    patient.isCompleted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {item.value}
                </span>
              ) : (
                <p
                  className="text-xs sm:text-sm font-bold text-gray-800 truncate"
                  title={item.value}
                >
                  {item.value}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInvestigationsCard = () => (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
      {/* Header */}
      <div className="bg-indigo-600 px-3 py-2.5 sm:px-5 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical size={14} className="text-white sm:w-4 sm:h-4" />
          <h4 className="text-[11px] sm:text-sm font-bold text-white uppercase tracking-wide">
            Investigations Ordered
          </h4>
        </div>
        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/20 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold text-white">
          {tests.length} {tests.length === 1 ? "Test" : "Tests"}
        </span>
      </div>

      {/* Tests List */}
      <div className="p-3 sm:p-5">
        <div
          className={cn(
            "grid gap-2 sm:gap-3",
            variant === "investigations"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
              : "grid-cols-1"
          )}
        >
          {visibleTests.map((test, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-indigo-50/50 border border-indigo-100/50 hover:bg-indigo-50 transition-colors"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] sm:text-xs font-bold text-indigo-600">
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug wrap-break-word">
                  {test.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] sm:text-[10px] font-medium text-indigo-500 uppercase">
                    {test.category}
                  </span>
                  {test.price > 0 && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-500">
                        ৳{test.price.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {hasMoreTests && (
          <button
            onClick={() => setShowAllTests(!showAllTests)}
            className="mt-3 sm:mt-4 w-full flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-4 rounded-lg sm:rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-[10px] sm:text-xs transition-colors"
          >
            {showAllTests ? (
              <>
                <ChevronUp size={14} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Show {tests.length - limit} More Tests
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
      {(variant === "all" || variant === "info") && renderInfoCard()}
      {(variant === "all" || variant === "investigations") &&
        tests.length > 0 &&
        renderInvestigationsCard()}
    </div>
  );
};
