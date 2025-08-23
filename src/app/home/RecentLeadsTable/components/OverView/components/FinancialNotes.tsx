"use client";

import React from "react";
import {
  DollarSign,
  FileText,
  StickyNote,
  Archive,
  Minus,
  Copy,
} from "lucide-react";

interface FinancialNotesProps {
  selectedRow: any;
  onCopy: (text: string, fieldName: string) => void;
}

const FinancialNotes: React.FC<FinancialNotesProps> = ({
  selectedRow,
  onCopy,
}) => {
  const hasProposalValue =
    selectedRow.total_proposal_value != null &&
    selectedRow.total_proposal_value !== undefined &&
    Number(selectedRow.total_proposal_value) > 0 &&
    !isNaN(Number(selectedRow.total_proposal_value));

  const hasClosedSale =
    selectedRow.total_closed_sale != null &&
    selectedRow.total_closed_sale !== undefined &&
    Number(selectedRow.total_closed_sale) > 0 &&
    !isNaN(Number(selectedRow.total_closed_sale));

  const hasQuotationNumber =
    selectedRow.quotation_number && selectedRow.quotation_number.trim() !== "";
  const hasNotes = selectedRow.notes && selectedRow.notes.trim() !== "";

  const isLostLead = selectedRow.lost_lead;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-3 lg:p-4 shadow-sm flex-1 flex flex-col">
      <h3 className="text-sm md:text-base lg:text-lg font-medium text-slate-800 mb-2 md:mb-3 flex items-center border-b border-slate-200 pb-2">
        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-600" />
        Financial & Notes
      </h3>
      <div className="flex-1 flex flex-col space-y-3">
        {/* Financial Values - Fixed Height */}
        <div className="grid grid-cols-2 gap-3" style={{ minHeight: "80px" }}>
          <div
            className={`group rounded-2xl p-2 sm:p-3 transition-all duration-200 shadow-sm ${
              hasProposalValue
                ? "bg-gradient-to-r from-green-50 to-green-100 border border-green-200 hover:from-green-100 hover:to-green-150"
                : "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 hover:from-yellow-100 hover:to-yellow-150"
            }`}
          >
            <div className="flex items-start justify-between h-full">
              <div className="flex items-start space-x-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs sm:text-sm font-medium mb-1 ${
                      hasProposalValue ? "text-green-800" : "text-yellow-800"
                    }`}
                  >
                    Proposal Value
                  </p>
                  {hasProposalValue ? (
                    <p className="text-xs sm:text-sm text-green-900 font-semibold">
                      RM{" "}
                      {new Intl.NumberFormat().format(
                        Number(selectedRow.total_proposal_value)
                      )}
                    </p>
                  ) : (
                    <div className="flex items-center text-yellow-600">
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm ml-1">No data</span>
                    </div>
                  )}
                </div>
              </div>
              {hasProposalValue && (
                <button
                  onClick={() =>
                    onCopy(
                      `RM ${new Intl.NumberFormat().format(
                        Number(selectedRow.total_proposal_value)
                      )}`,
                      "Proposal Value"
                    )
                  }
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-green-200 rounded flex-shrink-0"
                  title="Copy Proposal Value"
                >
                  <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                </button>
              )}
            </div>
          </div>

          <div
            className={`group rounded-2xl p-2 sm:p-3 transition-all duration-200 shadow-sm ${
              isLostLead
                ? "bg-gradient-to-r from-red-50 to-red-100 border border-red-200 hover:from-red-100 hover:to-red-150"
                : hasClosedSale
                ? "bg-gradient-to-r from-green-50 to-green-100 border border-green-200 hover:from-green-100 hover:to-green-150"
                : "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 hover:from-yellow-100 hover:to-yellow-150"
            }`}
          >
            <div className="flex items-start justify-between h-full">
              <div className="flex items-start space-x-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs sm:text-sm font-medium mb-1 ${
                      isLostLead
                        ? "text-red-800"
                        : hasClosedSale
                        ? "text-green-800"
                        : "text-yellow-800"
                    }`}
                  >
                    Closed Sale
                  </p>
                  {hasClosedSale ? (
                    <p className="text-xs sm:text-sm text-green-900 font-semibold">
                      RM{" "}
                      {new Intl.NumberFormat().format(
                        Number(selectedRow.total_closed_sale)
                      )}
                    </p>
                  ) : (
                    <div
                      className={`flex items-center ${
                        isLostLead ? "text-red-600" : "text-yellow-600"
                      }`}
                    >
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm ml-1">
                        {isLostLead ? "Lost Lead" : "No data"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {hasClosedSale && (
                <button
                  onClick={() =>
                    onCopy(
                      `RM ${new Intl.NumberFormat().format(
                        Number(selectedRow.total_closed_sale)
                      )}`,
                      "Closed Sale"
                    )
                  }
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-green-200 rounded flex-shrink-0"
                  title="Copy Closed Sale"
                >
                  <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quotation Number - Flexible Height */}
        <div
          className={`group border border-slate-200 rounded-2xl p-2 sm:p-3 transition-colors shadow-sm duration-200 ${
            hasQuotationNumber
              ? "bg-white hover:bg-blue-50"
              : "bg-slate-100/50 hover:bg-slate-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 mt-0.5">
                <FileText
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    hasQuotationNumber ? "text-slate-500" : "text-slate-400"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs sm:text-sm font-medium mb-1 ${
                    hasQuotationNumber ? "text-slate-700" : "text-slate-500"
                  }`}
                >
                  Quotation Number
                </p>
                {hasQuotationNumber ? (
                  <p className="text-xs sm:text-sm text-slate-900 break-words">
                    {selectedRow.quotation_number}
                  </p>
                ) : (
                  <div className="flex items-center justify-center text-slate-400 h-full">
                    <div className="flex flex-col items-center">
                      <Minus className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
                      <span className="text-xs sm:text-sm">
                        No quotation number
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {hasQuotationNumber && (
                <button
                  onClick={() =>
                    onCopy(selectedRow.quotation_number, "Quotation Number")
                  }
                  className="p-1 rounded group/button"
                  title="Copy Quotation Number"
                >
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover/button:text-blue-900 transition-colors duration-200" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notes - Flexible Height with Max Height and Scrollbar */}
        <div
          className={`group border border-slate-200 rounded-2xl p-2 sm:p-3 transition-colors shadow-sm duration-200 flex-1 flex flex-col ${
            hasNotes
              ? "bg-white hover:bg-blue-50"
              : "bg-slate-100/50 hover:bg-slate-200"
          } 
              max-h-auto
              lg:max-h-[280px] 
              2xl:max-h-[220px]`}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <StickyNote
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    hasNotes ? "text-slate-500" : "text-slate-400"
                  }`}
                />
              </div>
              <p
                className={`text-xs sm:text-sm font-medium ${
                  hasNotes ? "text-slate-700" : "text-slate-500"
                }`}
              >
                Notes
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {hasNotes && (
                <button
                  onClick={() => onCopy(selectedRow.notes, "Notes")}
                  className="p-1 rounded group/button"
                  title="Copy Notes"
                >
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover/button:text-blue-900 transition-colors duration-200" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {hasNotes ? (
              <div className="h-full overflow-y-auto pr-1">
                <p className="text-xs sm:text-sm text-slate-900 whitespace-pre-wrap break-words">
                  {selectedRow.notes}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center text-slate-400 h-full">
                <div className="flex flex-col items-center">
                  <Minus className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
                  <span className="text-xs sm:text-sm">No notes available</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Archive Reason - If exists */}
        {selectedRow.isInactive && selectedRow.inactiveReason && (
          <div
            className="group bg-orange-50 border border-orange-200 rounded-2xl p-2 md:p-3 lg:p-4 hover:bg-orange-100 transition-colors duration-200 shadow-sm"
            style={{ minHeight: "80px" }}
          >
            <div className="flex items-start justify-between w-full h-full">
              <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0 pr-2">
                <div className="flex-shrink-0 mt-0.5">
                  <Archive className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 mb-2">
                    Archive Reason
                  </p>
                  <p className="text-xs sm:text-sm text-orange-800 break-words">
                    {selectedRow.inactiveReason.charAt(0).toUpperCase() +
                      selectedRow.inactiveReason.slice(1)}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  onCopy(selectedRow.inactiveReason, "Archive Reason")
                }
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-orange-200 rounded flex-shrink-0"
                title="Copy Archive Reason"
              >
                <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialNotes;
