import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MinusIcon, XIcon, CheckIcon, Edit2Icon } from "lucide-react";
import useFetchOverviewLog from "../hooks/useFetchOverviewLog";

interface OverviewProps {
  selectedRow: any;
  formatDate: (date: string | null) => string;
  handleClosePopup: () => void;
  onEditClick: (row: any) => void;
}

const Overview: React.FC<OverviewProps> = ({
  selectedRow,
  formatDate,
  handleClosePopup,
  onEditClick,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { overviewData, loading, error, fetchOverviewData, resetData } =
    useFetchOverviewLog();

  useEffect(() => {
    if (selectedRow) {
      setIsVisible(true);
      const { source_id, source_table, action } = selectedRow;

      if (source_id && source_table) {
        console.log(
          `Preparing to fetch overview for ${source_table} ID: ${source_id}`
        );
        // Only fetch if we don't have data or if the data is for a different record
        const isDeleted = action === "DELETE";

        // Check if we need to fetch new data by comparing with current data
        const needsFetch =
          !overviewData ||
          overviewData.id !== parseInt(source_id) ||
          overviewData.source_table !== source_table;

        if (needsFetch) {
          console.log("Fetching new data");
          fetchOverviewData(parseInt(source_id), source_table, isDeleted);
        } else {
          console.log("Using existing data, no fetch needed");
        }
      }
    } else {
      resetData();
    }
  }, [selectedRow, fetchOverviewData, resetData, overviewData]);

  const onClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      resetData(); // Reset data on close
      handleClosePopup();
    }, 300); // Delay to allow animation to complete
  };

  const handleEdit = () => {
    onEditClick(selectedRow);
    onClose();
  };

  const getOrganizationValue = (org: string, source_id: string) => {
    if (org === "MAVN") return `MV-${source_id}`;
    if (org === "MI") return `TMI-${source_id}`;
    return org;
  };

  const formatDateTime = (dateString: string) => {
    // Parse date without timezone conversion
    const [datePart, timePart] = dateString.split("T");
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");

    const date = new Date(dateString);

    // Format date parts
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = months[parseInt(month) - 1];

    // Convert 24hr to 12hr format
    let hours = parseInt(hour);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // handle midnight (0:00)

    return `${monthName} ${parseInt(day)}, ${year} ${hours}:${minute.slice(
      0,
      2
    )} ${ampm}`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`bg-white p-2 md:p-4 lg:p-6 rounded-lg shadow-lg w-[95%] md:w-[90%] lg:w-[80%] xl:w-[70%] h-[70%] md:h-[75%] ${
              overviewData?.isInactive || overviewData?.deleteReason
                ? "xl:h-[90%] 2xl:h-[75%]"
                : "xl:h-[80%] 2xl:h-[70%]"
            } flex flex-col overflow-auto relative`}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            {/* Header Controls - Improved spacing and sizing */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 md:mb-3">
              <h2 className="text-base md:text-lg lg:text-xl font-bold text-blue-950 mb-1 md:mb-0">
                Overview
              </h2>
              <div className="flex space-x-2 absolute top-2 md:top-3 right-2 md:right-3">
                {/* Close Button */}
                <button
                  className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-full transition-colors"
                  onClick={onClose}
                >
                  <XIcon className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>
            </div>

            {/* Top Info Row - Improved responsive spacing and sizing */}
            <div className="flex flex-col md:flex-row gap-1.5 md:gap-2 w-full mb-2 md:mb-3">
              {/* ID Box */}
              <div className="flex items-center h-[28px] sm:h-[30px] md:h-[32px] lg:h-[34px] xl:h-[36px] 2xl:h-[38px] p-1.5 md:p-2 border border-gray-200 bg-blue-50 rounded w-full md:w-auto">
                <div className="flex items-center">
                  <strong className="text-blue-900 font-bold text-[10px] xs:text-xs sm:text-xs md:text-xs lg:text-sm xl:text-base 2xl:text-base whitespace-nowrap">
                    ID:
                  </strong>
                  <div className="flex items-center">
                    <span className="ml-1 md:ml-2 text-[10px] xs:text-xs sm:text-xs md:text-xs lg:text-sm xl:text-base 2xl:text-base font-semibold">
                      {selectedRow?.id && selectedRow?.source_table ? (
                        getOrganizationValue(
                          selectedRow.source_table,
                          selectedRow.source_id
                        )
                      ) : (
                        <MinusIcon className="inline w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-500" />
                      )}
                    </span>
                    <div className="ml-1.5 md:ml-3 flex items-center">
                      {overviewData?.quotation_signed && (
                        <span className="inline-flex items-center px-1 md:px-1.5 lg:px-2 py-0.5 rounded-2xl bg-green-100 text-green-900 border border-green-200 text-[8px] xs:text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] xl:text-xs 2xl:text-xs font-semibold">
                          SIGNED
                        </span>
                      )}
                      {overviewData?.isInactive && (
                        <span className="inline-flex items-center px-1 md:px-1.5 lg:px-2 py-0.5 rounded-2xl bg-orange-100 text-orange-900 border border-yellow-200 text-[8px] xs:text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] xl:text-xs 2xl:text-xs font-semibold">
                          ARCHIVE
                        </span>
                      )}
                      {overviewData?.deleteReason && (
                        <span className="inline-flex items-center px-1 md:px-1.5 lg:px-2 py-0.5 rounded-2xl bg-red-100 text-red-900 border border-red-200 text-[8px] xs:text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] xl:text-xs 2xl:text-xs font-semibold">
                          DELETED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales Rep */}
              <div className="flex items-center h-[28px] sm:h-[30px] md:h-[32px] lg:h-[34px] xl:h-[36px] 2xl:h-[38px] px-1.5 md:px-2 py-1 border-2 border-purple-300 bg-purple-50 rounded w-full md:w-auto">
                <div className="flex items-center">
                  <strong className="text-purple-800 font-semibold whitespace-nowrap text-[9px] xs:text-[10px] sm:text-xs md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                    Sales Rep:
                  </strong>
                  <span className="ml-0.5 md:ml-1 text-purple-700 text-[9px] xs:text-[10px] sm:text-xs md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                    {overviewData?.PIC !== null && overviewData?.PIC !== "" ? (
                      overviewData?.PIC
                    ) : (
                      <MinusIcon className="inline w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-3 xl:h-3 2xl:w-3 2xl:h-3 text-purple-500" />
                    )}
                  </span>
                </div>
              </div>

              {/* Lead Source */}
              <div className="flex items-center h-[28px] sm:h-[30px] md:h-[32px] lg:h-[34px] xl:h-[36px] 2xl:h-[38px] px-1.5 md:px-2 py-1 border-2 border-cyan-300 bg-cyan-50 rounded w-full md:w-auto">
                <div className="flex items-center">
                  <strong className="text-cyan-800 font-semibold whitespace-nowrap text-[9px] xs:text-[10px] sm:text-xs md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                    Lead Source:
                  </strong>
                  <span className="ml-0.5 md:ml-1 text-cyan-700 text-[9px] xs:text-[10px] sm:text-xs md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                    {overviewData?.lead_source !== null &&
                    overviewData?.lead_source !== "" ? (
                      overviewData?.lead_source
                    ) : (
                      <MinusIcon className="inline w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-3 xl:h-3 2xl:w-3 2xl:h-3 text-cyan-500" />
                    )}
                  </span>
                </div>
              </div>

              {/* Dates Box */}
              <div className="flex flex-col justify-center h-[28px] sm:h-[30px] md:h-[32px] lg:h-[34px] xl:h-[36px] 2xl:h-[38px] px-1.5 md:px-2 py-0.5 md:py-1 border-2 border-teal-400 bg-teal-50 rounded w-full md:w-auto md:ml-auto">
                <div className="flex items-center">
                  <strong className="text-teal-800 font-semibold whitespace-nowrap text-[8px] xs:text-[9px] sm:text-[10px] md:text-[10px] lg:text-[10px] xl:text-xs 2xl:text-xs">
                    Created:
                  </strong>
                  <span className="ml-0.5 md:ml-1 text-teal-700 text-[8px] xs:text-[9px] sm:text-[10px] md:text-[10px] lg:text-[10px] xl:text-xs 2xl:text-xs">
                    {overviewData?.createdAt ? (
                      formatDateTime(overviewData.createdAt)
                    ) : (
                      <MinusIcon className="inline w-2 h-2 md:w-2.5 md:h-2.5 text-teal-500" />
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <strong className="text-teal-800 font-semibold whitespace-nowrap text-[8px] xs:text-[9px] sm:text-[10px] md:text-[10px] lg:text-[10px] xl:text-xs 2xl:text-xs">
                    Updated:
                  </strong>
                  <span className="ml-0.5 md:ml-1 text-teal-700 text-[8px] xs:text-[9px] sm:text-[10px] md:text-[10px] lg:text-[10px] xl:text-xs 2xl:text-xs">
                    {overviewData?.updatedAt ? (
                      formatDateTime(overviewData.updatedAt)
                    ) : (
                      <MinusIcon className="inline w-2 h-2 md:w-2.5 md:h-2.5 text-teal-500" />
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content Section - Improved grid for better responsiveness */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-10 gap-2 md:gap-3 overflow-x-hidden h-[80%]">
              {/* Left Column - 70% width */}
              <div className="flex flex-col gap-1.5 md:gap-2 h-full lg:col-span-7">
                {/* Client Information Group - 65% height */}
                <div className="p-2 sm:p-3 md:p-4 border border-gray-300 rounded-lg bg-gray-50 shadow-sm overflow-hidden h-[400px] md:h-[65%]">
                  <h3 className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-semibold text-blue-900 mb-1.5 md:mb-3 border-b border-gray-200 pb-1">
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2 h-[calc(100%-25px)] md:h-[calc(100%-30px)] overflow-auto">
                    {/* Row 1 - Organization/Client Name */}
                    <div
                      className={`px-2 sm:px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-md transition cursor-pointer ${
                        overviewData?.client_name
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words`}
                    >
                      <div className="flex flex-col">
                        <strong className="text-black text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          Client Name:
                        </strong>
                        <div className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          {overviewData?.client_name !== null &&
                          overviewData?.client_name !== "" ? (
                            overviewData?.client_name
                          ) : (
                            <MinusIcon className="inline w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 2 - PIC */}
                    <div
                      className={`px-2 sm:px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-md transition cursor-pointer ${
                        overviewData?.PIC
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words`}
                    >
                      <div className="flex flex-col">
                        <strong className="text-black text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          PIC:
                        </strong>
                        <div className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          {overviewData?.PIC !== null &&
                          overviewData?.PIC !== "" ? (
                            overviewData?.PIC
                          ) : (
                            <MinusIcon className="inline w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 3 - Client Location */}
                    <div
                      className={`px-2 sm:px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-md transition cursor-pointer ${
                        overviewData?.organization_location
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words`}
                    >
                      <div className="flex flex-col">
                        <strong className="text-black text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          Client Location:
                        </strong>
                        <div className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          {overviewData?.organization_location !== null &&
                          overviewData?.organization_location !== "" ? (
                            overviewData?.organization_location
                          ) : (
                            <MinusIcon className="inline w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 4 - Lead Source */}
                    <div
                      className={`px-2 sm:px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-md transition cursor-pointer ${
                        overviewData?.lead_source
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words`}
                    >
                      <div className="flex flex-col">
                        <strong className="text-black text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          Lead Source:
                        </strong>
                        <div className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          {overviewData?.lead_source !== null &&
                          overviewData?.lead_source !== "" ? (
                            overviewData?.lead_source
                          ) : (
                            <MinusIcon className="inline w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Row 5 - Contact (Phone) */}
                    <div
                      className={`px-2 sm:px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-md transition cursor-pointer ${
                        overviewData?.client_contact_number
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words`}
                    >
                      <div className="flex flex-col">
                        <strong className="text-black text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          Contact:
                        </strong>
                        <div className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          {overviewData?.client_contact_number ? (
                            overviewData.client_contact_number
                          ) : (
                            <MinusIcon className="inline w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 6 - Email */}
                    <div
                      className={`px-2 sm:px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-md transition cursor-pointer ${
                        overviewData?.client_contact_email
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words`}
                    >
                      <div className="flex flex-col">
                        <strong className="text-black text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          Email:
                        </strong>
                        <div className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
                          {overviewData?.client_contact_email ? (
                            overviewData.client_contact_email
                          ) : (
                            <MinusIcon className="inline w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales Pipeline Group - 35% height */}
                <div
                  className="p-2 sm:p-3 md:p-4 border border-gray-300 rounded-lg bg-gray-50 shadow-sm"
                  style={{ height: "35%" }}
                >
                  <h3 className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-semibold text-blue-900 mb-1.5 md:mb-3 border-b border-gray-200 pb-1">
                    Sales Pipeline
                  </h3>

                  {/* Enhanced pipeline visualization - Improved for mobile */}
                  <div className="flex flex-col justify-center h-[calc(100%-25px)] md:h-[calc(100%-30px)]">
                    <div className="mt-1 md:mt-3 mb-3 md:mb-6">
                      {/* Progress Bar Container */}
                      <div
                        className="relative mb-8 md:mb-12 mx-auto"
                        style={{ width: "90%" }}
                      >
                        {/* Progress Bar Background */}
                        <div className="h-2 md:h-2.5 bg-gray-200 rounded-full relative">
                          {/* Progress Bar Fill */}
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full ${
                              overviewData?.lost_lead
                                ? "bg-red-400"
                                : overviewData?.quotation_signed
                                ? "bg-green-500"
                                : "bg-blue-500"
                            } transition-width duration-500`}
                            style={{
                              width: `${
                                overviewData?.quotation_signed
                                  ? "100%"
                                  : overviewData?.proposal_sent_out
                                  ? "75%"
                                  : overviewData?.proposal_in_progress
                                  ? "50%"
                                  : overviewData?.meetings_conducted
                                  ? "25%"
                                  : "0%"
                              }`,
                            }}
                          />

                          {/* Points along the track - Smaller for mobile */}
                          <div className="absolute top-0 left-0 w-full h-full">
                            {/* Prospect Point */}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                              <div
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                                  overviewData?.prospect_date
                                    ? overviewData?.lost_lead
                                      ? "bg-red-500 border-white"
                                      : "bg-blue-600 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {overviewData?.lost_lead &&
                                !overviewData?.meetings_conducted &&
                                overviewData?.prospect_date ? (
                                  <XIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                ) : null}
                              </div>
                            </div>

                            {/* Meetings Point */}
                            <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                                  overviewData?.meetings_conducted
                                    ? overviewData?.lost_lead
                                      ? "bg-red-500 border-white"
                                      : "bg-blue-600 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {overviewData?.lost_lead &&
                                !overviewData?.proposal_in_progress &&
                                overviewData?.meetings_conducted ? (
                                  <XIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                ) : null}
                              </div>
                            </div>

                            {/* In Progress Point */}
                            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                                  overviewData?.proposal_in_progress
                                    ? overviewData?.lost_lead
                                      ? "bg-red-500 border-white"
                                      : "bg-blue-600 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {overviewData?.lost_lead &&
                                !overviewData?.proposal_sent_out &&
                                overviewData?.proposal_in_progress ? (
                                  <XIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                ) : null}
                              </div>
                            </div>

                            {/* Proposal Point */}
                            <div className="absolute left-3/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                                  overviewData?.proposal_sent_out
                                    ? overviewData?.lost_lead
                                      ? "bg-red-500 border-white"
                                      : "bg-blue-600 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {overviewData?.lost_lead &&
                                !overviewData?.quotation_signed &&
                                overviewData?.proposal_sent_out ? (
                                  <XIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                ) : null}
                              </div>
                            </div>

                            {/* Signed Point */}
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                              <div
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                                  overviewData?.quotation_signed
                                    ? "bg-green-500 border-white"
                                    : overviewData?.lost_lead &&
                                      overviewData?.proposal_sent_out
                                    ? "bg-red-500 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {overviewData?.lost_lead &&
                                overviewData?.quotation_signed ? (
                                  <XIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Step Labels - Adjusted for mobile */}
                        <div className="absolute top-4 md:top-6 left-0 w-full">
                          {/* Prospect Label */}
                          <div
                            className="flex flex-col items-center absolute left-0"
                            style={{ width: "4rem", marginLeft: "-2rem" }}
                          >
                            <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium mt-1 md:mt-2 whitespace-nowrap text-gray-700">
                              Prospect
                            </span>
                            {overviewData?.prospect_date && (
                              <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-600 mt-0.5 md:mt-1">
                                {formatDate(overviewData.prospect_date)}
                              </span>
                            )}
                          </div>

                          {/* Meetings Label */}
                          <div
                            className="flex flex-col items-center absolute left-1/4 transform -translate-x-1/2"
                            style={{ width: "4rem" }}
                          >
                            <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium mt-1 md:mt-2 whitespace-nowrap text-gray-700">
                              Meetings
                            </span>
                            {overviewData?.meetings_conducted &&
                              overviewData?.meeting_date && (
                                <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-600 mt-0.5 md:mt-1">
                                  {formatDate(overviewData.meeting_date)}
                                </span>
                              )}
                          </div>

                          {/* In Progress Label */}
                          <div
                            className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2"
                            style={{ width: "4rem" }}
                          >
                            <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium mt-1 md:mt-2 whitespace-nowrap text-gray-700">
                              In Progress
                            </span>
                            {overviewData?.proposal_in_progress &&
                              overviewData?.proposal_in_progress_date && (
                                <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-600 mt-0.5 md:mt-1">
                                  {formatDate(
                                    overviewData.proposal_in_progress_date
                                  )}
                                </span>
                              )}
                          </div>

                          {/* Proposal Label */}
                          <div
                            className="flex flex-col items-center absolute left-3/4 transform -translate-x-1/2"
                            style={{ width: "4rem" }}
                          >
                            <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium mt-1 md:mt-2 whitespace-nowrap text-gray-700">
                              Proposal
                            </span>
                            {overviewData?.proposal_sent_out &&
                              overviewData?.proposal_sent_out_date && (
                                <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-600 mt-0.5 md:mt-1">
                                  {formatDate(
                                    overviewData.proposal_sent_out_date
                                  )}
                                </span>
                              )}
                          </div>

                          {/* Signed Label */}
                          <div
                            className="flex flex-col items-center absolute right-0"
                            style={{ width: "4rem", marginRight: "-2rem" }}
                          >
                            <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium mt-1 md:mt-2 whitespace-nowrap text-gray-700">
                              Signed
                            </span>
                            {overviewData?.quotation_signed &&
                              overviewData?.quotation_signed_date && (
                                <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-gray-600 mt-0.5 md:mt-1">
                                  {formatDate(
                                    overviewData.quotation_signed_date
                                  )}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right Column - 30% width */}
              <div className="flex flex-col gap-1.5 sm:gap-2 h-full lg:col-span-3">
                {/* Quotation Status Card - 30% height on larger screens, more on small screens */}
                <div
                  className={`p-1.5 sm:p-2 md:p-3 border border-gray-300 rounded-lg bg-gray-50 shadow-sm transition ${
                    overviewData?.lost_lead
                      ? "bg-red-50 hover:bg-red-100"
                      : overviewData?.quotation_signed
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-yellow-50 hover:bg-yellow-100"
                  } break-words`}
                  style={{ height: "35%" }}
                >
                  <h3 className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-semibold text-blue-900 mb-0.5 sm:mb-1 md:mb-1.5 border-b border-gray-200 pb-0.5">
                    Quotation Status
                  </h3>
                  <div className="flex items-center justify-center h-[calc(100%-16px)] sm:h-[calc(100%-18px)] md:h-[calc(100%-22px)]">
                    <div className="flex flex-col items-center">
                      {overviewData?.lost_lead ? (
                        <>
                          <div className="rounded-full bg-red-100 p-0.5 sm:p-1 md:p-1.5 lg:p-2 border-2 border-red-200">
                            <XIcon className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-red-500" />
                          </div>
                          <div className="mt-0.5 text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold text-red-700">
                            Lead Lost
                          </div>
                        </>
                      ) : overviewData?.quotation_signed ? (
                        <>
                          <div className="rounded-full bg-green-100 p-0.5 sm:p-1 md:p-1.5 lg:p-2 border-2 border-green-200">
                            <CheckIcon className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-600" />
                          </div>
                          <div className="mt-0.5 text-[10px] xs:text-xs sm:text-sm md:text-base font-semibold text-green-700">
                            Quotation Signed
                          </div>
                          {overviewData?.quotation_signed_date && (
                            <div className="mt-0.5 text-[7px] xs:text-[8px] sm:text-[9px] md:text-xs text-gray-600">
                              {formatDate(overviewData.quotation_signed_date)}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="mt-2 rounded-full bg-yellow-100 p-0.5 sm:p-1 md:p-1.5 lg:p-2 border-2 border-yellow-200">
                            <MinusIcon className="w-2 h-2 xs:w-3 xs:h-3 md:w-4.5 md:h-4.5 lg:w-6 lg:h-6 text-yellow-600" />
                          </div>
                          <div className="mt-0.5 text-[10px] xs:text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base font-semibold text-yellow-700 mb-2 ">
                            Pending
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Values & Notes Container - 65% height on larger screens, less on mobile */}
                <div
                  className="flex flex-col gap-1.5 sm:gap-2"
                  style={{ height: "65%" }}
                >
                  {/* Values section - always side by side */}
                  <div
                    className="flex flex-row gap-1.5 sm:gap-2"
                    style={{ height: "40%" }}
                  >
                    {/* Total Proposal Value */}
                    <div
                      className={`p-1.5 sm:p-2 border border-gray-300 rounded-lg bg-gray-50 shadow-sm transition cursor-pointer ${
                        overviewData?.total_proposal_value
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words flex flex-col justify-between h-full flex-1`}
                    >
                      <strong className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-semibold text-blue-900 mb-0.5 sm:mb-1 border-b border-gray-200 pb-0.5">
                        Proposal Value
                      </strong>
                      <div className="text-center flex-grow flex items-center justify-center">
                        {overviewData?.total_proposal_value !== null &&
                        overviewData?.total_proposal_value !== 0 ? (
                          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base font-bold text-blue-900">
                            RM{" "}
                            {new Intl.NumberFormat().format(
                              Number(overviewData?.total_proposal_value || 0)
                            )}
                          </div>
                        ) : (
                          <MinusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-gray-500" />
                        )}
                      </div>
                    </div>

                    {/* Total Closed Sale */}
                    <div
                      className={`p-1.5 sm:p-2 border border-gray-300 rounded-lg bg-gray-50 shadow-sm transition cursor-pointer ${
                        overviewData?.total_closed_sale
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words flex flex-col justify-between h-full flex-1`}
                    >
                      <strong className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-semibold text-blue-900 mb-0.5 sm:mb-1 border-b border-gray-200 pb-0.5">
                        Closed Sale
                      </strong>
                      <div className="text-center flex-grow flex items-center justify-center">
                        {overviewData?.total_closed_sale !== null &&
                        overviewData?.total_closed_sale !== 0 ? (
                          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base font-bold text-green-700">
                            RM{" "}
                            {new Intl.NumberFormat().format(
                              Number(overviewData?.total_closed_sale || 0)
                            )}
                          </div>
                        ) : (
                          <MinusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes Section - remaining height */}
                  <div
                    className={`p-1.5 sm:p-2 md:p-3 border border-gray-300 rounded-lg bg-gray-50 shadow-sm transition cursor-pointer ${
                      overviewData?.notes
                        ? "bg-green-50 hover:bg-green-100"
                        : "bg-yellow-50 hover:bg-yellow-100"
                    } break-words flex flex-col`}
                    style={{ height: "60%" }}
                  >
                    <h3 className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-semibold text-blue-900 mb-0.5 sm:mb-1 border-b border-gray-200 pb-0.5">
                      Notes
                    </h3>
                    <div className="prose max-w-none overflow-auto h-[calc(100%-15px)] sm:h-[calc(100%-17px)] md:h-[calc(100%-20px)] flex items-center">
                      {overviewData?.notes !== null &&
                      overviewData?.notes !== "" ? (
                        <div className="w-full h-full flex items-center">
                          <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-left p-1 sm:p-1.5 md:p-2">
                            {overviewData?.notes}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-500 text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs">
                          <MinusIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5 sm:mr-1" />{" "}
                          No notes available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Inactive/Delete Reason - Modified to span both columns */}
              {(overviewData?.isInactive || overviewData?.deleteReason) && (
                <div
                  className={`p-1.5 sm:p-2 md:p-3 border border-gray-300 ${
                    overviewData?.deleteReason
                      ? "bg-red-50 hover:bg-red-100"
                      : "bg-orange-50 hover:bg-orange-100"
                  } rounded-lg shadow-sm transition cursor-pointer break-words col-span-1 lg:col-span-10`}
                >
                  <h3
                    className={`text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-semibold ${
                      overviewData?.deleteReason
                        ? "text-red-800 border-b border-red-200"
                        : "text-orange-800 border-b border-orange-200"
                    } mb-0.5 sm:mb-1 pb-0.5`}
                  >
                    {overviewData?.deleteReason
                      ? "Delete Reason"
                      : "Archive Reason"}
                  </h3>
                  <div className="prose max-w-none">
                    {overviewData?.inactiveReason ||
                    overviewData?.deleteReason ? (
                      <p
                        className={`text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs ${
                          overviewData?.deleteReason
                            ? "text-red-800"
                            : "text-orange-800"
                        } p-1 sm:p-1.5`}
                      >
                        {overviewData?.deleteReason
                          ? overviewData.deleteReason.charAt(0).toUpperCase() +
                            overviewData.deleteReason.slice(1)
                          : overviewData?.inactiveReason
                          ? overviewData.inactiveReason
                              .charAt(0)
                              .toUpperCase() +
                            overviewData.inactiveReason.slice(1)
                          : ""}
                      </p>
                    ) : (
                      <div
                        className={`flex items-center justify-center p-1 sm:p-1.5 md:p-2 ${
                          overviewData?.deleteReason
                            ? "text-red-700"
                            : "text-orange-700"
                        } text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs`}
                      >
                        <MinusIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5 sm:mr-1" />{" "}
                        No reason specified
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Overview;
