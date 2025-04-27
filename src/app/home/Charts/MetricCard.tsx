"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@radix-ui/themes";
import PercentageChange from "./PercentageChange";
import { differenceInDays, parseISO } from "date-fns";

interface MetricCardProps {
  title1: string;
  value1: string;
  percentage1: number;
  color1: string;
  title2: string;
  value2: string;
  percentage2: number;
  color2: string;
  percentageChange1: number;
  percentageChange2: number;
  direction1: "up" | "down";
  direction2: "up" | "down";
  previousValue1: string;
  previousValue2: string;
  previousStartDate: string;
  previousEndDate: string;
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
  percentageChange1,
  percentageChange2,
  direction1,
  direction2,
  previousValue1,
  previousValue2,
  previousStartDate,
  previousEndDate,
}) => {
  const [hovered, setHovered] = useState<"percentage1" | "percentage2" | null>(
    null
  );

  const circleRadius = 50;
  const circleCircumference = 2 * Math.PI * circleRadius;

  const calculateStrokeDashoffset = (percentage: number) => {
    return circleCircumference - (percentage / 100) * circleCircumference;
  };

  const calculatePercentage = (value: string, highestTotal: number) => {
    const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    return (numericValue / highestTotal) * 100;
  };

  const formatNumber = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    return `RM ${new Intl.NumberFormat("en-US").format(numericValue)}`;
  };

  const highestTotal1 = parseFloat(value2.replace(/[^0-9.-]+/g, ""));

  const dynamicPercentage1 = calculatePercentage(value1, highestTotal1);
  const dynamicPercentage2 = 100; // Set to 100 to make the second circle fully colored

  // Calculate date range difference and determine label
  const startDate = parseISO(previousStartDate);
  const endDate = parseISO(previousEndDate);
  const dateDifference = differenceInDays(endDate, startDate);

  let dateRangeLabel = "";
  if (dateDifference <= 8 && dateDifference >= 7) {
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

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-[#F4F8FC] rounded-2xl shadow-md">
      <div className="flex flex-col sm:flex-row xl:flex-col 3xl:flex-row items-center justify-between w-full space-y-6 sm:space-y-0 xl:space-y-6 3xl:space-y-0 sm:space-x-6 xl:space-x-0 3xl:space-x-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 md:space-x-8">
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
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-xs sm:text-sm md:text-sm 2xl:text-sm font-medium text-gray-700">
              {title1}
            </h3>
            <span className="text-sm sm:text-base md:text-lg xl:text-base 2xl:text-base 3xl:text-base font-semibold whitespace-nowrap">{`${formatNumber(
              value1
            )}`}</span>
            {percentageChange1 !== 0 && (
              <div
                className="cursor-pointer flex flex-col 3xl:flex-col items-center sm:items-start mt-1"
                onMouseEnter={() => setHovered("percentage1")}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex 3xl:flex-col 3xl:items-start items-center">
                  <PercentageChange
                    percentage={parseFloat(percentageChange1.toFixed(2))}
                    direction={direction1}
                    className="text-xs sm:text-sm xl:text-sm 2xl:text-sm 3xl:text-xs"
                  />
                  <span className="text-gray-500 text-xs 3xl:text-xs ml-1 3xl:ml-0 3xl:mt-0.5">
                    {dateRangeLabel}
                  </span>
                </div>
                <AnimatePresence>
                  {hovered === "percentage1" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bg-white p-2 rounded shadow-lg"
                    >
                      Previous Value: {`${formatNumber(previousValue1)}`}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Vertical separator for horizontal layouts */}
        <Separator
          orientation="vertical"
          className="hidden sm:block xl:hidden 3xl:block h-32 bg-gray-300"
        />

        {/* Horizontal separator for vertical layouts */}
        <Separator
          orientation="horizontal"
          className="block sm:hidden xl:block 3xl:hidden w-full h-px bg-gray-300"
        />

        <div className="flex flex-col items-center sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 md:space-x-8">
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
              strokeDashoffset="0"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="text-xs sm:text-sm md:text-sm 2xl:text-sm font-medium text-gray-700">
              {title2}
            </h3>
            <span className="text-sm sm:text-base md:text-lg xl:text-base 2xl:text-base 3xl:text-base font-semibold whitespace-nowrap">{`${formatNumber(
              value2
            )}`}</span>
            {percentageChange2 !== 0 && (
              <div
                className="cursor-pointer flex flex-col 3xl:flex-col items-center sm:items-start mt-1"
                onMouseEnter={() => setHovered("percentage2")}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex 3xl:flex-col 3xl:items-start items-center">
                  <PercentageChange
                    percentage={parseFloat(percentageChange2.toFixed(2))}
                    direction={direction2}
                    className="text-xs sm:text-sm xl:text-sm 2xl:text-sm 3xl:text-xs"
                  />
                  <span className="text-gray-500 text-xs 3xl:text-xs ml-1 3xl:ml-0 3xl:mt-0.5">
                    {dateRangeLabel}
                  </span>
                </div>
                <AnimatePresence>
                  {hovered === "percentage2" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bg-white p-2 rounded shadow-lg"
                    >
                      Previous Value: {`${formatNumber(previousValue2)}`}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
