"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp } from "lucide-react";
import OverviewHeader from "./components/OverviewHeader";
import OrganizationDetails from "./components/OrganizationDetails";
import ClientInformation from "./components/ClientInformation";
import SalesPipeline from "./components/SalesPipeline";
import FinancialNotes from "./components/FinancialNotes";
import CampaignInformation from "./components/CampaignInformation";
import Notification from "./components/Notification";

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
    setTimeout(handleClosePopup, 300);
  };

  const handleEdit = () => {
    onEditClick(selectedRow);
    onClose();
  };

  const formatDateTime = (dateString: string) => {
    const [datePart, timePart] = dateString.split("T");
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");

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

    let hours = parseInt(hour);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${monthName} ${parseInt(day)}, ${year} ${hours}:${minute.slice(
      0,
      2
    )} ${ampm}`;
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setIsAnimatingOut(false);
      setNotification({
        visible: true,
        message: `${fieldName} copied to clipboard`,
        type: "success",
      });

      setTimeout(() => {
        handleCloseNotification();
      }, 2000);
    } catch (error) {
      setIsAnimatingOut(false);
      setNotification({
        visible: true,
        message: `Failed to copy ${fieldName}`,
        type: "error",
      });

      setTimeout(() => {
        handleCloseNotification();
      }, 2000);
    }
  };

  const handleCloseNotification = () => {
    setIsAnimatingOut(true);
  };

  const modalVariants = {
    hidden: {
      scale: 0.95,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const, // Use string, not array
        scale: { duration: 0.3 },
        opacity: { duration: 0.3 },
      },
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const, // Use string, not array
        scale: { duration: 0.3 },
        opacity: { duration: 0.25 },
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0, transition: { duration: 0.2 } },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50"
          onClick={onClose}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            isolation: "isolate",
            willChange: "opacity",
            backfaceVisibility: "hidden",
            perspective: 1000,
          }}
        >
          <motion.div
            className="bg-white shadow-2xl py-2.5 px-2 md:p-6 lg:px-6 lg:py-3 rounded-3xl w-[98%] md:w-[90%] lg:w-[85%] h-[95%] max-h-[800px] flex flex-col overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
            }}
          >
            <OverviewHeader
              selectedRow={selectedRow}
              onEdit={handleEdit}
              onClose={onClose}
              onCopy={copyToClipboard}
              formatDateTime={formatDateTime}
            />

            {/* Mobile Layout - Single Column with One Scrollbar */}
            <div className="flex-1 lg:hidden overflow-y-auto">
              <div className="space-y-1.5 md:space-y-2 lg:space-y-3">
                <OrganizationDetails
                  selectedRow={selectedRow}
                  onCopy={copyToClipboard}
                />

                <ClientInformation
                  selectedRow={selectedRow}
                  onCopy={copyToClipboard}
                />

                <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-3 lg:p-4 shadow-sm">
                  <h3 className="text-sm md:text-base lg:text-lg font-medium text-slate-800 mb-2 md:mb-3 flex items-center border-b border-slate-200 pb-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-600" />
                    Sales Pipeline
                  </h3>
                  <div>
                    <SalesPipeline
                      selectedRow={selectedRow}
                      formatDate={formatDate}
                    />
                  </div>
                </div>

                <CampaignInformation
                  selectedRow={selectedRow}
                  onCopy={copyToClipboard}
                />

                <FinancialNotes
                  selectedRow={selectedRow}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>

            {/* Desktop Layout - Two Columns with Separate Scrollbars */}
            <div className="flex-1 hidden lg:grid lg:grid-cols-2 gap-1.5 md:gap-2 lg:gap-3 overflow-y-auto">
              <div className="flex flex-col space-y-1.5 md:space-y-2 lg:space-y-3">
                <OrganizationDetails
                  selectedRow={selectedRow}
                  onCopy={copyToClipboard}
                />

                <ClientInformation
                  selectedRow={selectedRow}
                  onCopy={copyToClipboard}
                />

                <div className="bg-white border border-slate-200 rounded-2xl p-2 md:p-3 lg:p-4 shadow-sm flex-1">
                  <h3 className="text-sm md:text-base lg:text-lg font-medium text-slate-800 mb-2 md:mb-3 flex items-center border-b border-slate-200 pb-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-600" />
                    Sales Pipeline
                  </h3>
                  <div className="flex-1">
                    <SalesPipeline
                      selectedRow={selectedRow}
                      formatDate={formatDate}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5 md:space-y-2 lg:space-y-3">
                <CampaignInformation
                  selectedRow={selectedRow}
                  onCopy={copyToClipboard}
                />

                <FinancialNotes
                  selectedRow={selectedRow}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>
          </motion.div>

          {(notification.visible || isAnimatingOut) && (
            <div className="fixed bottom-5 right-5 z-[60]">
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => {
                  if (isAnimatingOut) {
                    setNotification((prev) => ({ ...prev, visible: false }));
                    setIsAnimatingOut(false);
                  } else {
                    handleCloseNotification();
                  }
                }}
                duration={2000}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Overview;
