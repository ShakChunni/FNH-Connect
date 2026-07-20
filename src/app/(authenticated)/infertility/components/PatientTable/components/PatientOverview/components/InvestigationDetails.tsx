"use client";
import React, { useMemo, useState } from "react";
import {
  Beaker,
  CheckCircle2,
  ChevronDown,
  Edit2,
  ChevronUp,
  Heart,
  Printer,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/timezone";
import { InfertilityTestData } from "../../../../../types";
import { INFERTILITY_TESTS } from "../../../../../constants/infertilityTests";
import { generateInfertilityTestReceipt } from "../../../../../utils/generateReceipt";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";

interface InvestigationDetailsProps {
  tests: InfertilityTestData[];
  onEditInvestigation?: (test: InfertilityTestData) => void;
}

interface InvestigationGroup {
  key: "PATIENT" | "SPOUSE";
  title: string;
  description: string;
  icon: React.ReactNode;
  accentClassName: string;
  badgeClassName: string;
  borderClassName: string;
  items: InfertilityTestData[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) {
    return "Not Scheduled";
  }

  return formatBDT(dateStr, "d MMM yyyy");
}

function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

function getResolvedTestNames(test: InfertilityTestData): Array<{
  name: string;
  price: number;
}> {
  const testNames = test.testResults?.tests || [];

  return testNames.map((name) => {
    const definition = INFERTILITY_TESTS.find(
      (item) => item.name === name || item.code === name,
    );

    return {
      name: definition?.name || name,
      price: definition?.price || 0,
    };
  });
}

export const InvestigationDetails: React.FC<InvestigationDetailsProps> = ({
  tests,
  onEditInvestigation,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    PATIENT: true,
    SPOUSE: true,
  });
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const groupedInvestigations = useMemo<InvestigationGroup[]>(() => {
    const patientItems = tests.filter((test) => test.subjectType === "PATIENT");
    const spouseItems = tests.filter((test) => test.subjectType === "SPOUSE");

    return [
      {
        key: "PATIENT" as const,
        title: "Patient Investigations",
        description: "Tests ordered directly for the infertility patient.",
        icon: <UserRound size={14} className="text-indigo-700" />,
        accentClassName: "bg-indigo-50 text-indigo-700",
        badgeClassName: "bg-indigo-100 text-indigo-700",
        borderClassName: "border-indigo-100",
        items: patientItems,
      },
      {
        key: "SPOUSE" as const,
        title: "Spouse Investigations",
        description: "Tests ordered for the husband or partner under the same case.",
        icon: <Heart size={14} className="text-rose-700" />,
        accentClassName: "bg-rose-50 text-rose-700",
        badgeClassName: "bg-rose-100 text-rose-700",
        borderClassName: "border-rose-100",
        items: spouseItems,
      },
    ].filter((group) => group.items.length > 0);
  }, [tests]);

  const handleDownloadReceipt = (
    test: InfertilityTestData,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    generateInfertilityTestReceipt(test, user?.fullName || "Staff");
    showNotification("Generating receipt document...", "success");
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm sm:rounded-2xl">
      <div className="flex items-center justify-between bg-emerald-800 px-3 py-2.5 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2">
          <Beaker size={14} className="text-white sm:h-4 sm:w-4" />
          <h4 className="text-[11px] font-bold uppercase tracking-wide text-white sm:text-sm">
            Investigations Ordered
          </h4>
        </div>
        <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs">
          {tests.length} {tests.length === 1 ? "Record" : "Records"}
        </span>
      </div>

      <div className="space-y-4 p-3 sm:p-5">
        {groupedInvestigations.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            No investigations ordered yet.
          </div>
        ) : null}

        {groupedInvestigations.map((group) => {
          const isExpanded = expandedGroups[group.key];

          return (
            <div
              key={group.key}
              className={cn(
                "overflow-hidden rounded-2xl border",
                group.borderClassName,
              )}
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="flex w-full items-start justify-between gap-3 bg-slate-50/70 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl",
                        group.accentClassName,
                      )}
                    >
                      {group.icon}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {group.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {group.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                      group.badgeClassName,
                    )}
                  >
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "Order" : "Orders"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-slate-500" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-500" />
                  )}
                </div>
              </button>

              {isExpanded ? (
                <div className="space-y-3 p-3 sm:p-4">
                  {group.items.map((test, index) => {
                    const resolvedTests = getResolvedTestNames(test);
                    const calculatedDueAmount = Math.max(
                      0,
                      Number(test.grandTotal) - Number(test.paidAmount),
                    );
                    const isPaid = calculatedDueAmount <= 0;

                    return (
                      <div
                        key={test.id}
                        className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                                #{index + 1}
                              </span>
                              <span className="font-mono text-sm font-bold text-slate-900">
                                {test.testNumber}
                              </span>
                              <span className="text-xs text-slate-500">
                                {formatDate(test.testDate)}
                              </span>
                              <span
                                className={cn(
                                  "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                  test.isCompleted
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700",
                                )}
                              >
                                {test.isCompleted ? "Completed" : "Pending"}
                              </span>
                            </div>

                            <p className="mt-2 text-xs font-semibold text-slate-500">
                              {test.subjectLabel}:{" "}
                              <span className="text-slate-700">
                                {test.subjectName || test.patientFullName}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {onEditInvestigation ? (
                              <button
                                type="button"
                                onClick={() => onEditInvestigation(test)}
                                className="inline-flex items-center justify-center rounded-lg bg-emerald-100 p-2 text-emerald-700 transition-colors hover:bg-emerald-200"
                                title="Edit Investigation"
                              >
                                <Edit2 size={14} />
                              </button>
                            ) : null}
                            <button
                              onClick={(event) => handleDownloadReceipt(test, event)}
                              className="inline-flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-700 transition-colors hover:bg-slate-200"
                              title="Download Receipt"
                            >
                              <Printer size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {resolvedTests.map((resolvedTest) => (
                            <span
                              key={`${test.id}-${resolvedTest.name}`}
                              className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-slate-700 sm:text-xs"
                            >
                              {resolvedTest.name}
                              {resolvedTest.price > 0 ? (
                                <span className="ml-1 font-bold text-emerald-700">
                                  ৳{resolvedTest.price.toLocaleString()}
                                </span>
                              ) : null}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-[10px] sm:text-xs">
                          <span className="font-bold text-slate-600">
                            Total: {formatCurrency(test.grandTotal)}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="font-bold text-blue-600">
                            Paid: {formatCurrency(test.paidAmount)}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span
                            className={cn(
                              "font-bold",
                              isPaid ? "text-slate-400" : "text-red-600",
                            )}
                          >
                            Due: {formatCurrency(calculatedDueAmount)}
                          </span>
                          {test.isCompleted ? (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                                <CheckCircle2 size={12} />
                                Ready
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvestigationDetails;
