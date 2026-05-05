"use client";
import React, { useState } from "react";
import {
  Activity,
  Beaker,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Printer,
} from "lucide-react";
import { InfertilityTestData } from "../../../../../types";
import { cn } from "@/lib/utils";
import { INFERTILITY_TESTS } from "../../../../../constants/infertilityTests";
import { generateInfertilityTestReceipt } from "../../../../../utils/generateReceipt";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";

interface InvestigationDetailsProps {
  tests: InfertilityTestData[];
}

export const InvestigationDetails: React.FC<InvestigationDetailsProps> = ({
  tests,
}) => {
  const [showAllTests, setShowAllTests] = useState(false);
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not Scheduled";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString("en-BD")}`;
  };

  // Map test names to full test objects
  const getTestList = (testData: InfertilityTestData) => {
    const testNames: string[] = testData.testResults?.tests || [];
    return testNames.map((name) => {
      const test = INFERTILITY_TESTS.find(
        (t) => t.name === name || t.code === name
      );
      return (
        test || {
          code: name,
          name: name,
          price: 0,
          category: "Investigation",
        }
      );
    });
  };

  const limit = 4;
  const visibleTests = showAllTests ? tests : tests.slice(0, limit);
  const hasMoreTests = tests.length > limit;

  const handleDownloadReceipt = (test: InfertilityTestData, e: React.MouseEvent) => {
    e.stopPropagation();
    generateInfertilityTestReceipt(test, user?.fullName || "Staff");
    showNotification("Generating receipt document...", "success");
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full">
      {/* Header */}
      <div className="bg-emerald-800 px-3 py-2.5 sm:px-5 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Beaker size={14} className="text-white sm:w-4 sm:h-4" />
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
        <div className="grid gap-3 sm:gap-4 grid-cols-1">
          {visibleTests.map((test, idx) => {
            const testList = getTestList(test);
            const isPaid = Number(test.dueAmount) <= 0;

            return (
              <div
                key={test.id}
                className="flex flex-col gap-2 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-50/50 border border-emerald-100/50 hover:bg-emerald-50 transition-colors"
              >
                {/* Top Row: Test Number + Status + Download */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-700">
                        {idx + 1}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-gray-800">
                        {test.testNumber}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">
                        {formatDate(test.testDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md",
                        test.isCompleted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {test.isCompleted ? "Completed" : "Pending"}
                    </span>
                    <button
                      onClick={(e) => handleDownloadReceipt(test, e)}
                      className="p-1.5 bg-white text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all cursor-pointer shadow-sm"
                      title="Download Receipt"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>

                {/* Test Names */}
                <div className="flex flex-wrap gap-1.5">
                  {testList.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="inline-flex items-center px-2 py-0.5 bg-white border border-emerald-200 rounded-md text-[10px] sm:text-xs font-medium text-gray-700"
                    >
                      {t.name}
                      {t.price > 0 && (
                        <span className="text-emerald-600 font-bold ml-1">
                          ৳{t.price.toLocaleString()}
                        </span>
                      )}
                    </span>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="flex items-center gap-3 text-[10px] sm:text-xs pt-1 border-t border-emerald-100/50">
                  <span className="font-bold text-gray-500">
                    Total: {formatCurrency(test.grandTotal)}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="font-bold text-blue-600">
                    Paid: {formatCurrency(test.paidAmount)}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span
                    className={cn(
                      "font-bold",
                      isPaid ? "text-gray-400" : "text-red-600"
                    )}
                  >
                    Due: {formatCurrency(test.dueAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More/Less Button */}
        {hasMoreTests && (
          <button
            onClick={() => setShowAllTests(!showAllTests)}
            className="mt-3 sm:mt-4 w-full flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-4 rounded-lg sm:rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] sm:text-xs transition-colors"
          >
            {showAllTests ? (
              <>
                <ChevronUp size={14} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Show {tests.length - limit} More
              </>
            )}
          </button>
        )}

        {tests.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            No investigations ordered yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigationDetails;
