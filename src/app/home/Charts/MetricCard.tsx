"use client";
import React, { useState, useEffect } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import PercentageChange from "./PercentageChange";
import { differenceInDays, parseISO, format } from "date-fns";
import MetricCardSkeleton from "./Skeletons/MetricCardSkeleton";
import useMetricVisibility from "@/app/hooks/useMetricVisibility";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useMediaQuery } from "react-responsive";

interface MetricCardProps {
  title1: string;
  value1: string;
  percentage1: number;
  color1: string;
  title2: string;
  value2: string;
  percentage2: number;
  color2: string;
  title3: string;
  value3: string;
  percentage3: number;
  color3: string;
  percentageChange1: number;
  percentageChange2: number;
  percentageChange3: number;
  direction1: "up" | "down";
  direction2: "up" | "down";
  direction3: "up" | "down";
  previousValue1: string;
  previousValue2: string;
  previousValue3: string;
  previousStartDate: string;
  previousEndDate: string;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title1,
  value1,
  percentage1,
  color1,
  title2,
  value2,
  percentage2,
  color2,
  title3,
  value3,
  percentage3,
  color3,
  percentageChange1,
  percentageChange2,
  percentageChange3,
  direction1,
  direction2,
  direction3,
  previousValue1,
  previousValue2,
  previousValue3,
  previousStartDate,
  previousEndDate,
  isLoading = false,
}) => {
  const [hovered, setHovered] = useState<
    | "percentage1"
    | "percentage2"
    | "percentage3"
    | "title1"
    | "title2"
    | "title3"
    | null
  >(null);

  const isMobile = useMediaQuery({ maxWidth: 639 });
  const isMd = useMediaQuery({ minWidth: 640, maxWidth: 1023 });
  const isLg = useMediaQuery({ minWidth: 1024, maxWidth: 1279 });
  const isXl = useMediaQuery({ minWidth: 1280, maxWidth: 1536 });
  const is2xl = useMediaQuery({ minWidth: 1536 });
  const {
    metric1Visible,
    metric2Visible,
    metric3Visible,
    toggleMetricVisibility,
  } = useMetricVisibility();

  if (isLoading) {
    return <MetricCardSkeleton />;
  }

  const getResponsiveFontSize = () => {
    if (isMobile) return "11px";
    if (isMd) return "12px";
    if (isLg) return "13px";
    if (isXl) return "14px";
    if (is2xl) return "15px";
    return "12px"; // Default fallback
  };

  const getTitlePadding = () => {
    if (isMobile) return "6px";
    if (isMd) return "7px";
    if (isLg) return "8px";
    if (isXl) return "9px";
    if (is2xl) return "10px";
    return "8px"; // Default fallback
  };

  const getPercentagePadding = () => {
    if (isMobile) return "8px";
    if (isMd) return "9px";
    if (isLg) return "10px";
    if (isXl) return "11px";
    if (is2xl) return "12px";
    return "10px"; // Default fallback
  };

  const titleTooltipStyle = {
    borderRadius: "12px",
    backgroundColor: "rgb(255, 255, 255)",
    color: "rgb(55, 65, 81)",
    padding: getTitlePadding(),
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    zIndex: 50,
    maxWidth: isMobile ? "250px" : "none",
    fontSize: getResponsiveFontSize(),
  };

  const percentageTooltipStyle = {
    borderRadius: "16px",
    backgroundColor: "rgb(255, 255, 255)",
    color: "rgb(55, 65, 81)",
    padding: getPercentagePadding(),
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    fontWeight: "500",
    whiteSpace: isMobile ? ("normal" as const) : ("nowrap" as const),
    maxWidth: isMobile ? "200px" : "none",
    fontSize: getResponsiveFontSize(),
  };

  const circleRadius = 50;
  const circleCircumference = 2 * Math.PI * circleRadius;

  const formattedPreviousDateRange =
    previousStartDate && previousEndDate
      ? (() => {
          const start = new Date(previousStartDate);
          const end = new Date(previousEndDate);

          // Reset times to midnight to compare dates only
          const startDate = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate()
          );
          const endDate = new Date(
            end.getFullYear(),
            end.getMonth(),
            end.getDate()
          );

          // Check if start and end dates are the same (ignoring time)
          if (startDate.getTime() === endDate.getTime()) {
            return format(startDate, "dd/MM/yy");
          } else {
            // If they're different dates, subtract 1 day from end date
            const adjustedEnd = new Date(endDate);
            adjustedEnd.setDate(adjustedEnd.getDate() - 1);
            return `${format(startDate, "dd/MM/yy")} - ${format(
              adjustedEnd,
              "dd/MM/yy"
            )}`;
          }
        })()
      : "";

  const calculateStrokeDashoffset = (percentage: number) => {
    return circleCircumference - (percentage / 100) * circleCircumference;
  };

  const formatNumber = (value: string, isVisible: boolean) => {
    if (!isVisible) {
      return "RM *****";
    }
    const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    return `RM ${new Intl.NumberFormat("en-US").format(numericValue)}`;
  };

  const highestTotal = Math.max(
    parseFloat(value1.replace(/[^0-9.-]+/g, "")),
    parseFloat(value2.replace(/[^0-9.-]+/g, "")),
    parseFloat(value3.replace(/[^0-9.-]+/g, ""))
  );

  const dynamicPercentage1 =
    (parseFloat(value1.replace(/[^0-9.-]+/g, "")) / highestTotal) * 100;
  const dynamicPercentage2 =
    (parseFloat(value2.replace(/[^0-9.-]+/g, "")) / highestTotal) * 100;
  const dynamicPercentage3 = 100;

  let startDate, endDate, isSameDay, dateDifference;

  try {
    // Only parse if we have valid date strings
    if (previousStartDate && previousEndDate) {
      startDate = parseISO(previousStartDate);
      endDate = parseISO(previousEndDate);

      // Validate that dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date values");
      }

      // Check if the dates are the same calendar day by comparing their ISO date strings
      isSameDay =
        startDate.toISOString().split("T")[0] ===
        endDate.toISOString().split("T")[0];

      // Calculate date difference based on same day check
      // Add 1 to include both start and end dates in the count
      dateDifference = isSameDay ? 1 : differenceInDays(endDate, startDate) + 1;
    } else {
      // Default values if dates aren't provided
      isSameDay = false;
      dateDifference = 0;
    }
  } catch (error) {
    console.error("Error parsing dates:", error);
    // Fallback to safe defaults
    isSameDay = false;
    dateDifference = 0;
  }

  let dateRangeLabel = "";
  if (dateDifference === 1) {
    dateRangeLabel = "vs. last 1 day";
  } else if (dateDifference <= 8 && dateDifference >= 7) {
    dateRangeLabel = "vs. previous week";
  } else if (dateDifference <= 31 && dateDifference >= 28) {
    dateRangeLabel = "vs. last month";
  } else if (dateDifference <= 92 && dateDifference >= 89) {
    dateRangeLabel = "vs. last 3 months";
  } else if (dateDifference <= 122 && dateDifference >= 119) {
    dateRangeLabel = "vs. last 4 months";
  } else if (dateDifference <= 183 && dateDifference >= 180) {
    dateRangeLabel = "vs. last 6 months";
  } else if (dateDifference <= 365 && dateDifference >= 360) {
    dateRangeLabel = "vs. last year";
  } else {
    dateRangeLabel = `vs. last ${dateDifference} days`;
  }

  // Tooltip descriptions
  const tooltipDescriptions = {
    title1: "Shows all leads marked as signed (Confirmed Deals)",
    title2:
      "Shows leads awaiting client confirmation (Excluding Signed or Lost)",
    title3: "Shows the total value of all leads (Signed, Pending, and Lost)",
  };
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-white rounded-3xl shadow-md border border-slate-200">
      <div
        className="
        grid grid-cols-1 md:grid-cols-3 gap-8 w-full
        divide-y md:divide-y-0 md:divide-x
        divide-gray-100
      "
      >
        {/* First metric - Total Successful Sales */}
        <div className="flex flex-col items-center justify-center py-6 md:py-0 md:pr-8 relative">
          <button
            onClick={() => toggleMetricVisibility("metric1Visible")}
            className="absolute top-0 right-0 md:mr-4 text-gray-300 hover:text-gray-600 transition-colors"
            aria-label={metric1Visible ? "Hide value" : "Show value"}
          >
            {metric1Visible ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
          </button>

          <svg
            width="100%"
            height="100%"
            viewBox="0 0 120 120"
            className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]"
          >
            <circle
              cx="60"
              cy="60"
              r={circleRadius}
              stroke="#E0E0E0"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r={circleRadius}
              stroke={color1}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circleCircumference}
              strokeDashoffset={
                isNaN(dynamicPercentage1)
                  ? "0"
                  : calculateStrokeDashoffset(dynamicPercentage1).toString()
              }
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="flex flex-col items-center mt-4 relative">
            <h3
              className={`text-sm font-medium ${
                hovered === "title1" ? "text-blue-600" : "text-gray-700"
              } cursor-pointer transition-colors duration-200`}
              onMouseEnter={() => setHovered("title1")}
              onMouseLeave={() => setHovered(null)}
              data-tooltip-id={`title-tooltip-1`}
            >
              {title1}
            </h3>
            <ReactTooltip
              id={`title-tooltip-1`}
              content={tooltipDescriptions.title1}
              place="top"
              style={titleTooltipStyle}
            />
            <span className="text-lg font-semibold whitespace-nowrap">
              {formatNumber(value1, metric1Visible)}
            </span>
            {percentageChange1 !== 0 && (
              <div
                className="cursor-pointer flex items-center mt-1"
                onMouseEnter={() => setHovered("percentage1")}
                onMouseLeave={() => setHovered(null)}
                data-tooltip-id={`percentage-tooltip-1`}
              >
                <div className="flex items-center">
                  <PercentageChange
                    percentage={parseFloat(percentageChange1.toFixed(2))}
                    direction={direction1}
                    className="text-xs"
                  />
                  <span className="text-gray-500 text-xs ml-1">
                    {dateRangeLabel}
                  </span>
                </div>
                <ReactTooltip
                  id={`percentage-tooltip-1`}
                  content={`Previous Value: ${formatNumber(
                    previousValue1,
                    metric1Visible
                  )}${
                    formattedPreviousDateRange
                      ? `\n(${formattedPreviousDateRange})`
                      : ""
                  }`}
                  place="bottom"
                  style={percentageTooltipStyle}
                />
              </div>
            )}
          </div>
        </div>

        {/* Second metric - Total Pending Sales */}
        <div className="flex flex-col items-center justify-center py-6 md:py-0 md:px-8 relative">
          <button
            onClick={() => toggleMetricVisibility("metric2Visible")}
            className="absolute top-0 right-0 md:mr-4 pt-2 md:pt-0 text-gray-300 hover:text-gray-600 transition-colors"
            aria-label={metric2Visible ? "Hide value" : "Show value"}
          >
            {metric2Visible ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
          </button>

          <svg
            width="100%"
            height="100%"
            viewBox="0 0 120 120"
            className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]"
          >
            <circle
              cx="60"
              cy="60"
              r={circleRadius}
              stroke="#E0E0E0"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r={circleRadius}
              stroke={color2}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circleCircumference}
              strokeDashoffset={
                isNaN(dynamicPercentage2)
                  ? "0"
                  : calculateStrokeDashoffset(dynamicPercentage2).toString()
              }
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="flex flex-col items-center mt-4 relative">
            <h3
              className={`text-sm font-medium ${
                hovered === "title2" ? "text-blue-600" : "text-gray-700"
              } cursor-pointer transition-colors duration-200`}
              onMouseEnter={() => setHovered("title2")}
              onMouseLeave={() => setHovered(null)}
              data-tooltip-id={`title-tooltip-2`}
            >
              {title2}
            </h3>
            <ReactTooltip
              id={`title-tooltip-2`}
              content={tooltipDescriptions.title2}
              place="top"
              style={titleTooltipStyle}
            />
            <span className="text-lg font-semibold whitespace-nowrap">
              {formatNumber(value2, metric2Visible)}
            </span>
            {percentageChange2 !== 0 && (
              <div
                className="cursor-pointer flex items-center mt-1"
                onMouseEnter={() => setHovered("percentage2")}
                onMouseLeave={() => setHovered(null)}
                data-tooltip-id={`percentage-tooltip-2`}
              >
                <div className="flex items-center">
                  <PercentageChange
                    percentage={parseFloat(percentageChange2.toFixed(2))}
                    direction={direction2}
                    className="text-xs"
                  />
                  <span className="text-gray-500 text-xs ml-1">
                    {dateRangeLabel}
                  </span>
                </div>
                <ReactTooltip
                  id={`percentage-tooltip-2`}
                  content={`Previous Value: ${formatNumber(
                    previousValue2,
                    metric2Visible
                  )}${
                    formattedPreviousDateRange
                      ? `\n(${formattedPreviousDateRange})`
                      : ""
                  }`}
                  place="bottom"
                  style={percentageTooltipStyle}
                />
              </div>
            )}
          </div>
        </div>

        {/* Third metric - Total Proposal Value */}
        <div className="flex flex-col items-center justify-center py-6 md:py-0 md:pl-8 relative">
          <button
            onClick={() => toggleMetricVisibility("metric3Visible")}
            className="absolute top-0 right-0 pt-2 md:mr-4 md:pt-0 text-gray-300 hover:text-gray-600 transition-colors"
            aria-label={metric3Visible ? "Hide value" : "Show value"}
          >
            {metric3Visible ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
          </button>

          <svg
            width="100%"
            height="100%"
            viewBox="0 0 120 120"
            className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]"
          >
            <circle
              cx="60"
              cy="60"
              r={circleRadius}
              stroke="#E0E0E0"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r={circleRadius}
              stroke={color3}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circleCircumference}
              strokeDashoffset="0"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="flex flex-col items-center mt-4 relative">
            <h3
              className={`text-sm font-medium ${
                hovered === "title3" ? "text-blue-600" : "text-gray-700"
              } cursor-pointer transition-colors duration-200`}
              onMouseEnter={() => setHovered("title3")}
              onMouseLeave={() => setHovered(null)}
              data-tooltip-id={`title-tooltip-3`}
            >
              {title3}
            </h3>
            <ReactTooltip
              id={`title-tooltip-3`}
              content={tooltipDescriptions.title3}
              place="top"
              style={titleTooltipStyle}
            />
            <span className="text-lg font-semibold whitespace-nowrap">
              {formatNumber(value3, metric3Visible)}
            </span>
            {percentageChange3 !== 0 && (
              <div
                className="cursor-pointer flex items-center mt-1"
                onMouseEnter={() => setHovered("percentage3")}
                onMouseLeave={() => setHovered(null)}
                data-tooltip-id={`percentage-tooltip-3`}
              >
                <div className="flex items-center">
                  <PercentageChange
                    percentage={parseFloat(percentageChange3.toFixed(2))}
                    direction={direction3}
                    className="text-xs"
                  />
                  <span className="text-gray-500 text-xs ml-1">
                    {dateRangeLabel}
                  </span>
                </div>
                <ReactTooltip
                  id={`percentage-tooltip-3`}
                  content={`Previous Value: ${formatNumber(
                    previousValue3,
                    metric3Visible
                  )}${
                    formattedPreviousDateRange
                      ? `\n(${formattedPreviousDateRange})`
                      : ""
                  }`}
                  place="bottom"
                  style={percentageTooltipStyle}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
