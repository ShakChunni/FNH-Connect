import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MinusIcon, XIcon, CheckIcon, Edit2Icon } from "lucide-react";
import Notification from "./Notification";
import { FaTimes, FaPencilAlt, FaCopy } from "react-icons/fa";

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
  const [notification, setNotification] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    visible: false,
    message: "",
    type: "success",
  });
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (selectedRow) {
      setIsVisible(true);
    }
  }, [selectedRow]);

  const onClose = () => {
    setIsVisible(false);
    setTimeout(handleClosePopup, 300); // Delay to allow animation to complete
  };

  const handleEdit = () => {
    onEditClick(selectedRow);
    onClose();
  };

  const getOrganizationValue = (org: string, id: string) => {
    if (org === "MAVN") return `MV-${id}`;
    if (org === "MI") return `TMI-${id}`;
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

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Reset animation state and set notification to visible
        setIsAnimatingOut(false);
        setNotification({
          visible: true,
          message: `${fieldName} copied to clipboard`,
          type: "success",
        });

        // Auto-hide after 1.5 seconds
        setTimeout(() => {
          handleCloseNotification();
        }, 1500);
      })
      .catch(() => {
        setIsAnimatingOut(false);
        setNotification({
          visible: true,
          message: `Failed to copy ${fieldName}`,
          type: "error",
        });

        // Auto-hide after 1.5 seconds
        setTimeout(() => {
          handleCloseNotification();
        }, 1500);
      });
  };

  // Add this function to handle notification closure
  const handleCloseNotification = () => {
    setIsAnimatingOut(true);
    // The actual hiding will be done in onExitComplete
  };

  const InfoField = ({
    label,
    value,
    bgColorClass,
  }: {
    label: string;
    value: string | null;
    bgColorClass: string;
  }) => {
    return (
      <div
        className={`px-2 sm:px-3 md:px-4 py-1.5 md:py-2 border border-gray-200 rounded-md transition cursor-pointer ${bgColorClass} break-words relative group`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <strong className="text-black text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm">
            {label}:
          </strong>
          <div className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-sm pr-5">
            {value ? (
              value
            ) : (
              <MinusIcon className="inline w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-500" />
            )}
          </div>
          {value && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(value, label);
              }}
            >
              <FaCopy className="text-gray-500 hover:text-blue-900 w-3 h-3 md:w-3.5 md:h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
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
              selectedRow.isInactive
                ? "xl:h-[90%] 2xl:h-[85%]"
                : "xl:h-[85%] 2xl:h-[75%]"
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
                {/* Edit Button */}
                <button
                  onClick={handleEdit}
                  className="flex items-center px-2 py-1 md:px-3 md:py-1.5 bg-gray-50 hover:bg-gray-200 text-gray-500 rounded-full transition-colors"
                >
                  <span className="text-xs md:text-sm font-medium">Edit</span>
                  <FaPencilAlt className="w-2.5 h-2.5 md:w-3 md:h-3 ml-1" />
                </button>

                {/* Close Button */}
                <button
                  className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-full transition-colors"
                  onClick={onClose}
                >
                  <FaTimes className="w-3 h-3 md:w-4 md:h-4" />
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
                      {selectedRow.id !== null &&
                      selectedRow.id !== "" &&
                      selectedRow.source_table !== null &&
                      selectedRow.source_table !== "" ? (
                        getOrganizationValue(
                          selectedRow.source_table,
                          selectedRow.id
                        )
                      ) : (
                        <MinusIcon className="inline w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-500" />
                      )}
                    </span>
                    {(selectedRow.quotation_signed ||
                      selectedRow.isInactive) && (
                      <div className="ml-1.5 md:ml-3 flex items-center">
                        {selectedRow.quotation_signed ? (
                          <span className="inline-flex items-center px-1 md:px-1.5 lg:px-2 py-0.5 rounded-2xl bg-green-100 text-green-900 border border-green-200 text-[8px] xs:text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] xl:text-xs 2xl:text-xs font-semibold">
                            SIGNED
                          </span>
                        ) : (
                          selectedRow.isInactive && (
                            <span className="inline-flex items-center px-1 md:px-1.5 lg:px-2 py-0.5 rounded-2xl bg-orange-100 text-orange-900 border border-yellow-200 text-[8px] xs:text-[9px] sm:text-[10px] md:text-[10px] lg:text-[11px] xl:text-xs 2xl:text-xs font-semibold">
                              ARCHIVE
                            </span>
                          )
                        )}
                      </div>
                    )}
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
                    {selectedRow.PIC !== null && selectedRow.PIC !== "" ? (
                      selectedRow.PIC
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
                    {selectedRow.lead_source !== null &&
                    selectedRow.lead_source !== "" ? (
                      selectedRow.lead_source
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
                    {selectedRow.createdAt ? (
                      formatDateTime(selectedRow.createdAt)
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
                    {selectedRow.updatedAt ? (
                      formatDateTime(selectedRow.updatedAt)
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
                  <h3 className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs xl:text-sm 2xl:text-base font-semibold text-blue-900 mb-1.5 md:mb-3 border-b border-gray-200">
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2 h-[calc(100%-25px)] md:h-[calc(100%-30px)] overflow-auto">
                    {/* Organization */}
                    <InfoField
                      label="Organization"
                      value={selectedRow.organization_name}
                      bgColorClass={
                        selectedRow.organization_name
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      }
                    />

                    {/* Industry */}
                    <InfoField
                      label="Industry"
                      value={selectedRow.industry_name}
                      bgColorClass={
                        selectedRow.industry_name
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      }
                    />

                    {/* Location */}
                    <InfoField
                      label="Location"
                      value={selectedRow.organization_location}
                      bgColorClass={
                        selectedRow.organization_location
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      }
                    />

                    {/* Client Name */}
                    <InfoField
                      label="Client Name"
                      value={selectedRow.client_name}
                      bgColorClass={
                        selectedRow.client_name
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      }
                    />

                    {/* Contact */}
                    <InfoField
                      label="Contact"
                      value={selectedRow.client_contact_number}
                      bgColorClass={
                        selectedRow.client_contact_number
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      }
                    />

                    {/* Email */}
                    <InfoField
                      label="Email"
                      value={selectedRow.client_contact_email}
                      bgColorClass={
                        selectedRow.client_contact_email
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      }
                    />
                  </div>
                </div>

                {/* Sales Pipeline Group - 35% height */}
                <div
                  className="p-2 sm:p-3 md:p-4 border border-gray-300 rounded-lg bg-gray-50 shadow-sm"
                  style={{ height: "35%" }}
                >
                  <h3 className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs xl:text-sm 2xl:text-base font-semibold text-blue-900 mb-1.5 md:mb-3 border-b border-gray-200">
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
                              selectedRow.lost_lead
                                ? "bg-red-400"
                                : selectedRow.quotation_signed
                                ? "bg-green-500"
                                : "bg-blue-500"
                            } transition-width duration-500`}
                            style={{
                              width: `${
                                selectedRow.quotation_signed
                                  ? "100%"
                                  : selectedRow.proposal_sent_out
                                  ? "75%"
                                  : selectedRow.proposal_in_progress
                                  ? "50%"
                                  : selectedRow.meetings_conducted
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
                                  selectedRow.prospect_date
                                    ? selectedRow.lost_lead
                                      ? "bg-red-500 border-white"
                                      : "bg-blue-600 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {selectedRow.lost_lead &&
                                !selectedRow.meetings_conducted &&
                                selectedRow.prospect_date ? (
                                  <XIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                ) : null}
                              </div>
                            </div>

                            {/* Meetings Point */}
                            <div className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                                  selectedRow.meetings_conducted
                                    ? selectedRow.lost_lead
                                      ? "bg-red-500 border-white"
                                      : "bg-blue-600 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {selectedRow.lost_lead &&
                                !selectedRow.proposal_in_progress &&
                                selectedRow.meetings_conducted ? (
                                  <XIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                ) : null}
                              </div>
                            </div>

                            {/* In Progress Point */}
                            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                                  selectedRow.proposal_in_progress
                                    ? selectedRow.lost_lead
                                      ? "bg-red-500 border-white"
                                      : "bg-blue-600 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {selectedRow.lost_lead &&
                                !selectedRow.proposal_sent_out &&
                                selectedRow.proposal_in_progress ? (
                                  <XIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                ) : null}
                              </div>
                            </div>

                            {/* Proposal Point */}
                            <div className="absolute left-3/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                                  selectedRow.proposal_sent_out
                                    ? selectedRow.lost_lead
                                      ? "bg-red-500 border-white"
                                      : "bg-blue-600 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {selectedRow.lost_lead &&
                                !selectedRow.quotation_signed &&
                                selectedRow.proposal_sent_out ? (
                                  <XIcon className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" />
                                ) : null}
                              </div>
                            </div>

                            {/* Signed Point */}
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                              <div
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 ${
                                  selectedRow.quotation_signed
                                    ? "bg-green-500 border-white"
                                    : selectedRow.lost_lead &&
                                      selectedRow.proposal_sent_out
                                    ? "bg-red-500 border-white"
                                    : "bg-gray-300 border-gray-400"
                                } flex items-center justify-center`}
                              >
                                {selectedRow.lost_lead &&
                                selectedRow.quotation_signed ? (
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
                            {selectedRow.prospect_date && (
                              <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-xs text-gray-600 mt-0.5">
                                {formatDate(selectedRow.prospect_date)}
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
                            {selectedRow.meetings_conducted &&
                              selectedRow.meeting_date && (
                                <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-xs text-gray-600 mt-0.5">
                                  {formatDate(selectedRow.meeting_date)}
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
                            {selectedRow.proposal_in_progress &&
                              selectedRow.proposal_in_progress_date && (
                                <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-xs text-gray-600 mt-0.5">
                                  {formatDate(
                                    selectedRow.proposal_in_progress_date
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
                            {selectedRow.proposal_sent_out &&
                              selectedRow.proposal_sent_out_date && (
                                <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-xs text-gray-600 mt-0.5">
                                  {formatDate(
                                    selectedRow.proposal_sent_out_date
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
                            {selectedRow.quotation_signed &&
                              selectedRow.quotation_signed_date && (
                                <span className="text-[7px] xs:text-[8px] sm:text-[9px] md:text-xs text-gray-600 mt-0.5">
                                  {formatDate(
                                    selectedRow.quotation_signed_date
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
                    selectedRow.lost_lead
                      ? "bg-red-50 hover:bg-red-100"
                      : selectedRow.quotation_signed
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-yellow-50 hover:bg-yellow-100"
                  } break-words`}
                  style={{ height: "35%" }}
                >
                  <h3 className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs xl:text-sm 2xl:text-base  font-semibold text-blue-900 mb-0.5 sm:mb-1 md:mb-1.5 border-b border-gray-200">
                    Quotation Status
                  </h3>
                  <div className="flex items-center justify-center h-[calc(100%-16px)] sm:h-[calc(100%-18px)] md:h-[calc(100%-22px)]">
                    <div className="flex flex-col items-center">
                      {selectedRow.lost_lead ? (
                        <>
                          <div className="rounded-full bg-red-100 p-0.5 sm:p-1 md:p-1.5 lg:p-2 border-2 border-red-200">
                            <XIcon className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-red-500" />
                          </div>
                          <div className="mt-0.5 text-[10px] xs:text-xs sm:text-sm md:text-xs xl:text-sm 2xl:text-base  font-semibold text-red-700">
                            Lead Lost
                          </div>
                        </>
                      ) : selectedRow.quotation_signed ? (
                        <>
                          <div className="rounded-full bg-green-100 p-0.5 sm:p-1 md:p-1.5 lg:p-2 border-2 border-green-200">
                            <CheckIcon className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-green-600" />
                          </div>
                          <div className="mt-0.5 text-3xs xs:text-2xs sm:text-sm md:text-xs xl:text-sm 2xl:text-base font-semibold text-green-700">
                            Quotation Signed
                          </div>
                          {selectedRow.quotation_signed_date && (
                            <div className="mt-0.5 text-[7px] xs:text-[8px] sm:text-[9px] md:text-xs text-gray-600 pb-2 lg:pb-0">
                              {formatDate(selectedRow.quotation_signed_date)}
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
                        selectedRow.total_proposal_value
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words flex flex-col justify-between h-full flex-1 group`}
                    >
                      <div className="flex justify-between items-center border-b border-gray-200 pb-0.5 mb-0.5 sm:mb-1">
                        <strong className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs xl:text-sm 2xl:text-base font-semibold text-blue-900">
                          Proposal Value
                        </strong>
                        {selectedRow.total_proposal_value !== null &&
                          selectedRow.total_proposal_value !== 0 && (
                            <button
                              className="text-gray-500 hover:text-blue-900 transition-colors opacity-0 group-hover:opacity-100"
                              onClick={() =>
                                copyToClipboard(
                                  selectedRow.total_proposal_value.toString(),
                                  "Proposal Value"
                                )
                              }
                            >
                              <FaCopy className="w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 2xl:w-3.5 2xl:h-3.5" />
                            </button>
                          )}
                      </div>
                      <div className="text-center flex-grow flex items-center justify-center">
                        {selectedRow.total_proposal_value !== null &&
                        selectedRow.total_proposal_value !== 0 ? (
                          <div className="text-[10px] xs:text-xs sm:text-sm md:text-xs xl:text-sm 2xl:text-base font-bold text-blue-900">
                            RM{" "}
                            {new Intl.NumberFormat().format(
                              selectedRow.total_proposal_value
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
                        selectedRow.total_closed_sale
                          ? "bg-green-50 hover:bg-green-100"
                          : "bg-yellow-50 hover:bg-yellow-100"
                      } break-words flex flex-col justify-between h-full flex-1 group`}
                    >
                      <div className="flex justify-between items-center border-b border-gray-200 pb-0.5 mb-0.5 sm:mb-1">
                        <strong className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs xl:text-sm 2xl:text-base font-semibold text-blue-900">
                          Closed Sale
                        </strong>
                        {selectedRow.total_closed_sale !== null &&
                          selectedRow.total_closed_sale !== 0 && (
                            <button
                              className="text-gray-500 hover:text-blue-900 transition-colors opacity-0 group-hover:opacity-100"
                              onClick={() =>
                                copyToClipboard(
                                  selectedRow.total_closed_sale.toString(),
                                  "Closed Sale"
                                )
                              }
                            >
                              <FaCopy className="w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 2xl:w-3.5 2xl:h-3.5" />
                            </button>
                          )}
                      </div>
                      <div className="text-center flex-grow flex items-center justify-center">
                        {selectedRow.total_closed_sale !== null &&
                        selectedRow.total_closed_sale !== 0 ? (
                          <div className="text-[10px] xs:text-xs sm:text-sm md:text-xs xl:text-sm 2xl:text-base font-bold text-green-700">
                            RM{" "}
                            {new Intl.NumberFormat().format(
                              selectedRow.total_closed_sale
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
                      selectedRow.notes
                        ? "bg-green-50 hover:bg-green-100"
                        : "bg-yellow-50 hover:bg-yellow-100"
                    } break-words flex flex-col group`}
                    style={{ height: "60%" }}
                  >
                    <div className="flex justify-between items-center border-b border-gray-200 mb-0.5 sm:mb-1">
                      <h3 className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs xl:text-sm 2xl:text-base font-semibold text-blue-900">
                        Notes
                      </h3>
                      {selectedRow.notes !== null &&
                        selectedRow.notes !== "" && (
                          <button
                            className="text-gray-500 hover:text-blue-900 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() =>
                              copyToClipboard(selectedRow.notes, "Notes")
                            }
                          >
                            <FaCopy className="w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 2xl:w-3.5 2xl:h-3.5" />
                          </button>
                        )}
                    </div>
                    <div className="prose max-w-none overflow-auto h-[calc(100%-15px)] sm:h-[calc(100%-17px)] md:h-[calc(100%-20px)]">
                      {selectedRow.notes !== null &&
                      selectedRow.notes !== "" ? (
                        <div className="w-full h-full">
                          <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-left p-1 sm:p-1.5 md:p-2 m-0">
                            {selectedRow.notes}
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

              {/* Inactive Reason - Modified to span both columns */}
              {selectedRow.isInactive && (
                <div className="p-1.5 sm:p-2 md:p-3 border border-gray-300 bg-orange-50 rounded-lg shadow-sm transition cursor-pointer hover:bg-orange-100 break-words col-span-1 lg:col-span-10">
                  <h3 className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs xl:text-sm 2xl:text-base font-semibold text-orange-800 mb-0.5 sm:mb-1 border-b border-orange-200">
                    Archive Reason
                  </h3>
                  <div className="prose max-w-none">
                    {selectedRow.inactiveReason !== null &&
                    selectedRow.inactiveReason !== "" ? (
                      <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-orange-800 p-1 sm:p-1.5">
                        {selectedRow.inactiveReason.charAt(0).toUpperCase() +
                          selectedRow.inactiveReason.slice(1)}
                      </p>
                    ) : (
                      <div className="flex items-center justify-center p-1 sm:p-1.5 md:p-2 text-orange-700 text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs">
                        <MinusIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5 sm:mr-1" />{" "}
                        No reason specified
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {(notification.visible || isAnimatingOut) && (
            <div className="fixed bottom-5 right-5 z-[60]">
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => {
                  if (isAnimatingOut) {
                    // Only set visible to false when animation completes
                    setNotification((prev) => ({ ...prev, visible: false }));
                    setIsAnimatingOut(false);
                  } else {
                    // Start animation out
                    handleCloseNotification();
                  }
                }}
                duration={1500}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Overview;
