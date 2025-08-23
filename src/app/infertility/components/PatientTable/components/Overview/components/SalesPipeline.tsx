"use client";

import React, { useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useMediaQuery } from "react-responsive";

interface SalesPipelineProps {
  selectedRow: any;
  formatDate: (date: string | null) => string;
}

const SalesPipeline: React.FC<SalesPipelineProps> = ({
  selectedRow,
  formatDate,
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const isMobile = useMediaQuery({ maxWidth: 639 });
  const isMd = useMediaQuery({ minWidth: 640, maxWidth: 1023 });
  const isLg = useMediaQuery({ minWidth: 1024, maxWidth: 1279 });
  const isXl = useMediaQuery({ minWidth: 1280, maxWidth: 1536 });
  const is2xl = useMediaQuery({ minWidth: 1536 });

  // Responsive bar/point/label sizing
  const barHeight = isMobile ? 10 : isMd ? 12 : isLg ? 14 : isXl ? 16 : 18;
  const pointSize = isMobile ? 14 : isMd ? 16 : isLg ? 18 : isXl ? 20 : 22;
  const labelOffset = barHeight + 8; // px below the bar

  const getProgressPercentage = () => {
    if (selectedRow.quotation_signed) return "100%";
    if (selectedRow.proposal_sent_out) return "75%";
    if (selectedRow.proposal_in_progress) return "50%";
    if (selectedRow.meetings_conducted) return "25%";
    return "0%";
  };

  const getProgressColor = () => {
    if (selectedRow.lost_lead)
      return "bg-gradient-to-r from-red-400 to-red-500";
    if (selectedRow.quotation_signed)
      return "bg-gradient-to-r from-green-400 to-green-500";
    return "bg-gradient-to-r from-blue-400 to-blue-500";
  };

  const getPointStyle = (condition: boolean) => {
    if (condition) {
      if (selectedRow.lost_lead) {
        return "bg-gradient-to-br from-red-400 to-red-500 border-white shadow-lg";
      } else if (selectedRow.quotation_signed) {
        return "bg-gradient-to-br from-green-400 to-green-500 border-white shadow-lg";
      } else {
        return "bg-gradient-to-br from-blue-400 to-blue-500 border-white shadow-lg";
      }
    }
    return "bg-gradient-to-br from-slate-200 to-slate-300 border-slate-400 shadow-sm";
  };

  const getStepTextColor = (condition: boolean) => {
    if (!condition) return "text-slate-600";
    if (selectedRow.lost_lead) {
      return "text-red-700";
    } else if (selectedRow.quotation_signed) {
      return "text-green-700";
    } else {
      return "text-blue-700";
    }
  };

  const stepLabels = {
    prospect: { short: "Prospect", full: "Prospect" },
    meetings: { short: "Meetings", full: "Meetings Conducted" },
    inProgress: { short: "In Progress", full: "Proposal In Progress" },
    proposal: { short: "Proposal Sent", full: "Proposal Sent" },
    signed: { short: "Signed", full: "Signed Deal" },
  };

  const getResponsiveFontSize = () => {
    if (isMobile) return "11px";
    if (isMd) return "12px";
    if (isLg) return "13px";
    if (isXl) return "14px";
    if (is2xl) return "15px";
    return "12px";
  };

  const getTooltipPadding = () => {
    if (isMobile) return "8px 12px";
    if (isMd) return "10px 16px";
    if (isLg) return "10px 16px";
    if (isXl) return "12px 18px";
    if (is2xl) return "12px 20px";
    return "10px 16px";
  };

  const tooltipStyle = {
    borderRadius: "12px",
    backgroundColor: "rgb(248, 250, 252)", // matches overview bg
    color: "rgb(51, 65, 85)", // slate-700
    padding: getTooltipPadding(),
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    border: "1px solid rgb(226, 232, 240)", // slate-200
    fontWeight: "500",
    fontSize: getResponsiveFontSize(),
    maxWidth: isMobile ? "200px" : "300px",
    zIndex: 60,
  };

  return (
    <div className="w-full py-16 lg:py-3">
      <div className="mx-2 mb-2">
        <div className="relative mx-auto" style={{ width: "90%" }}>
          {/* Progress Bar Background */}
          <div
            className="bg-gradient-to-r from-slate-200 to-slate-300 rounded-full relative shadow-inner"
            style={{ height: `${barHeight}px` }}
          >
            {/* Progress Bar Fill */}
            <div
              className={`absolute top-0 left-0 h-full rounded-full ${getProgressColor()} transition-all duration-700 ease-in-out shadow-sm`}
              style={{ width: getProgressPercentage() }}
            />

            {/* Points along the track */}
            <div className="absolute top-0 left-0 w-full h-full">
              {/* Prospect Point */}
              <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2"
                style={{ width: pointSize, height: pointSize }}
              >
                <div
                  className={`rounded-full border-3 ${getPointStyle(
                    !!selectedRow.prospect_date
                  )} transition-all duration-300`}
                  style={{
                    width: pointSize,
                    height: pointSize,
                  }}
                />
              </div>

              {/* Meetings Point */}
              <div
                className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{ width: pointSize, height: pointSize }}
              >
                <div
                  className={`rounded-full border-3 ${getPointStyle(
                    selectedRow.meetings_conducted
                  )} transition-all duration-300`}
                  style={{
                    width: pointSize,
                    height: pointSize,
                  }}
                />
              </div>

              {/* In Progress Point */}
              <div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{ width: pointSize, height: pointSize }}
              >
                <div
                  className={`rounded-full border-3 ${getPointStyle(
                    selectedRow.proposal_in_progress
                  )} transition-all duration-300`}
                  style={{
                    width: pointSize,
                    height: pointSize,
                  }}
                />
              </div>

              {/* Proposal Point */}
              <div
                className="absolute left-3/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{ width: pointSize, height: pointSize }}
              >
                <div
                  className={`rounded-full border-3 ${getPointStyle(
                    selectedRow.proposal_sent_out
                  )} transition-all duration-300`}
                  style={{
                    width: pointSize,
                    height: pointSize,
                  }}
                />
              </div>

              {/* Signed Point */}
              <div
                className="absolute right-0 top-1/2 transform -translate-y-1/2"
                style={{ width: pointSize, height: pointSize }}
              >
                <div
                  className={`rounded-full border-3 ${
                    selectedRow.quotation_signed
                      ? "bg-gradient-to-br from-green-400 to-green-500 border-white shadow-lg"
                      : selectedRow.lost_lead && selectedRow.proposal_sent_out
                      ? "bg-gradient-to-br from-red-400 to-red-500 border-white shadow-lg"
                      : "bg-gradient-to-br from-slate-200 to-slate-300 border-slate-400 shadow-sm"
                  } transition-all duration-300`}
                  style={{
                    width: pointSize,
                    height: pointSize,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Step Labels */}
          <div
            className="absolute left-0 w-full"
            style={{ top: `${labelOffset}px` }}
          >
            {/* Prospect Label */}
            <div
              className="flex flex-col items-center absolute left-0"
              style={{ width: "4rem", marginLeft: "-2rem" }}
            >
              <span
                className={`text-[10px] sm:text-xs md:text-sm lg:text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-help ${
                  hovered === "prospect"
                    ? "text-blue-600"
                    : getStepTextColor(!!selectedRow.prospect_date)
                }`}
                onMouseEnter={() => setHovered("prospect")}
                onMouseLeave={() => setHovered(null)}
                data-tooltip-id="prospect-tooltip"
              >
                {stepLabels.prospect.short}
              </span>
              <ReactTooltip
                id="prospect-tooltip"
                content={stepLabels.prospect.full}
                place="top"
                style={tooltipStyle}
              />
              {selectedRow.prospect_date && (
                <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-xs text-slate-600 mt-0.5 text-center transition-all duration-300">
                  {formatDate(selectedRow.prospect_date)}
                </span>
              )}
            </div>

            {/* Meetings Label */}
            <div
              className="flex flex-col items-center absolute left-1/4 transform -translate-x-1/2"
              style={{ width: "4rem" }}
            >
              <span
                className={`text-[10px] sm:text-xs md:text-sm lg:text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-help ${
                  hovered === "meetings"
                    ? "text-blue-600"
                    : getStepTextColor(selectedRow.meetings_conducted)
                }`}
                onMouseEnter={() => setHovered("meetings")}
                onMouseLeave={() => setHovered(null)}
                data-tooltip-id="meetings-tooltip"
              >
                {stepLabels.meetings.short}
              </span>
              <ReactTooltip
                id="meetings-tooltip"
                content={stepLabels.meetings.full}
                place="top"
                style={tooltipStyle}
              />
              {selectedRow.meetings_conducted && selectedRow.meeting_date && (
                <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-xs text-slate-600 mt-0.5 text-center transition-all duration-300">
                  {formatDate(selectedRow.meeting_date)}
                </span>
              )}
            </div>

            {/* In Progress Label */}
            <div
              className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2"
              style={{ width: "4rem" }}
            >
              <span
                className={`text-[10px] sm:text-xs md:text-sm lg:text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-help ${
                  hovered === "inProgress"
                    ? "text-blue-600"
                    : getStepTextColor(selectedRow.proposal_in_progress)
                }`}
                onMouseEnter={() => setHovered("inProgress")}
                onMouseLeave={() => setHovered(null)}
                data-tooltip-id="inProgress-tooltip"
              >
                {stepLabels.inProgress.short}
              </span>
              <ReactTooltip
                id="inProgress-tooltip"
                content={stepLabels.inProgress.full}
                place="top"
                style={tooltipStyle}
              />
              {selectedRow.proposal_in_progress &&
                selectedRow.proposal_in_progress_date && (
                  <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-xs text-slate-600 mt-0.5 text-center transition-all duration-300">
                    {formatDate(selectedRow.proposal_in_progress_date)}
                  </span>
                )}
            </div>

            {/* Proposal Label */}
            <div
              className="flex flex-col items-center absolute left-3/4 transform -translate-x-1/2"
              style={{ width: "4rem" }}
            >
              <span
                className={`text-[10px] sm:text-xs md:text-sm lg:text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-help ${
                  hovered === "proposal"
                    ? "text-blue-600"
                    : getStepTextColor(selectedRow.proposal_sent_out)
                }`}
                onMouseEnter={() => setHovered("proposal")}
                onMouseLeave={() => setHovered(null)}
                data-tooltip-id="proposal-tooltip"
              >
                {stepLabels.proposal.short}
              </span>
              <ReactTooltip
                id="proposal-tooltip"
                content={stepLabels.proposal.full}
                place="top"
                style={tooltipStyle}
              />
              {selectedRow.proposal_sent_out &&
                selectedRow.proposal_sent_out_date && (
                  <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-xs text-slate-600 mt-0.5 text-center transition-all duration-300">
                    {formatDate(selectedRow.proposal_sent_out_date)}
                  </span>
                )}
            </div>

            {/* Signed Label */}
            <div
              className="flex flex-col items-center absolute right-0"
              style={{ width: "4rem", marginRight: "-2rem" }}
            >
              <span
                className={`text-[10px] sm:text-xs md:text-sm lg:text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-help ${
                  hovered === "signed"
                    ? "text-blue-600"
                    : getStepTextColor(selectedRow.quotation_signed)
                }`}
                onMouseEnter={() => setHovered("signed")}
                onMouseLeave={() => setHovered(null)}
                data-tooltip-id="signed-tooltip"
              >
                {stepLabels.signed.short}
              </span>
              <ReactTooltip
                id="signed-tooltip"
                content={stepLabels.signed.full}
                place="top"
                style={tooltipStyle}
              />
              {selectedRow.quotation_signed &&
                selectedRow.quotation_signed_date && (
                  <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-xs text-slate-600 mt-0.5 text-center transition-all duration-300">
                    {formatDate(selectedRow.quotation_signed_date)}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPipeline;