import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MinusIcon, XIcon, CheckIcon, Edit2Icon } from "lucide-react";
import EditButton from "./EditButton";

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
            className={`bg-white p-4 md:p-8 rounded-lg shadow-lg w-11/12 md:w-[60%] h-[65%] ${
              selectedRow.isInactive
                ? "xl:h-[85%] 2xl:h-[85%]"
                : "xl:h-[75%] 2xl:h-[75%]"
            } flex flex-col overflow-auto md:overflow-visible relative`}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <button
              className="absolute top-4 right-4 text-red-500 hover:text-red-700"
              onClick={onClose}
            >
              <XIcon className="w-6 h-6" />
            </button>
            <div className="absolute top-4 right-14">
              <EditButton onClick={handleEdit} />
            </div>
            <div className="flex flex-col xl:flex-row items-center space-y-2 xl:space-y-0 xl:space-x-4 pb-4">
              <h2 className="text-xl md:text-2xl font-bold text-blue-900 flex-shrink-0">
                Overview
              </h2>
              <div className="grid grid-cols-1 xl:flex xl:flex-row gap-2 w-full xl:w-auto">
                {/* ID Box */}
                <div className="flex items-center h-[44px] p-2 border border-gray-200 bg-blue-50 rounded xl:w-fit w-full">
                  <div className="flex items-center">
                    <strong className="text-blue-900 font-bold text-base whitespace-nowrap">
                      ID:
                    </strong>
                    <span className="ml-2 text-base font-semibold">
                      {selectedRow.id !== null &&
                      selectedRow.id !== "" &&
                      selectedRow.source_table !== null &&
                      selectedRow.source_table !== "" ? (
                        getOrganizationValue(
                          selectedRow.source_table,
                          selectedRow.id
                        )
                      ) : (
                        <MinusIcon className="inline w-4 h-4 text-gray-500" />
                      )}
                    </span>
                    {(selectedRow.quotation_signed ||
                      selectedRow.isInactive) && (
                      <div className="ml-3">
                        {selectedRow.quotation_signed ? (
                          <span className="px-2 py-0.5 rounded-2xl bg-green-100 text-green-900 border border-green-200 text-xs font-semibold">
                            SIGNED
                          </span>
                        ) : (
                          selectedRow.isInactive && (
                            <span className="px-2 py-0.5 rounded-2xl bg-orange-100 text-orange-900 border border-yellow-200 text-xs font-semibold">
                              INACTIVE
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Dates Box */}
                <div className="flex flex-col justify-center h-[44px] px-2 border border-gray-200 bg-blue-50 rounded w-full xl:w-auto">
                  <div className="flex items-center">
                    <strong className="text-[#757575] text-xs">Created:</strong>
                    <span className="ml-0.5 text-xs text-[#757575]">
                      {selectedRow.createdAt ? (
                        formatDateTime(selectedRow.createdAt)
                      ) : (
                        <MinusIcon className="inline w-4 h-4 text-[#757575]" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <strong className="text-[#757575] text-xs">Updated:</strong>
                    <span className="ml-0.5 text-xs text-[#757575]">
                      {selectedRow.updatedAt ? (
                        formatDateTime(selectedRow.updatedAt)
                      ) : (
                        <MinusIcon className="inline w-4 h-4 text-[#757575]" />
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col xl:grid xl:grid-cols-5 gap-4 flex-grow overflow-auto">
              {/* First Row */}
              <div
                className={`p-4 border border-gray-200 rounded col-span-4 transition cursor-pointer ${
                  selectedRow.client_name
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-yellow-50 hover:bg-yellow-100"
                } break-words w-full`}
              >
                <strong className="text-black">Client Name:</strong>{" "}
                {selectedRow.client_name !== null &&
                selectedRow.client_name !== "" ? (
                  selectedRow.client_name
                ) : (
                  <MinusIcon className="inline w-6 h-6 text-gray-500" />
                )}
              </div>
              <div
                className={`p-4 border border-gray-200 rounded col-span-1 transition cursor-pointer ${
                  selectedRow.PIC
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-yellow-50 hover:bg-yellow-100"
                } break-words w-full`}
              >
                <strong className="text-black">PIC:</strong>{" "}
                {selectedRow.PIC !== null && selectedRow.PIC !== "" ? (
                  selectedRow.PIC
                ) : (
                  <MinusIcon className="inline w-6 h-6 text-gray-500" />
                )}
              </div>
              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 col-span-5 gap-4">
                <div
                  className={`p-4 border border-gray-200 rounded transition cursor-pointer ${
                    selectedRow.industry_name
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-yellow-50 hover:bg-yellow-100"
                  } break-words w-full`}
                >
                  <strong className="text-black">Industry:</strong>{" "}
                  {selectedRow.industry_name !== null &&
                  selectedRow.industry_name !== "" ? (
                    selectedRow.industry_name
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div
                  className={`p-4 border border-gray-200 rounded transition cursor-pointer ${
                    selectedRow.client_location
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-yellow-50 hover:bg-yellow-100"
                  } break-words w-full`}
                >
                  <strong className="text-black">Client Location:</strong>{" "}
                  {selectedRow.client_location !== null &&
                  selectedRow.client_location !== "" ? (
                    selectedRow.client_location
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div
                  className={`p-4 border border-gray-200 rounded transition cursor-pointer ${
                    selectedRow.lead_source
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-yellow-50 hover:bg-yellow-100"
                  } break-words w-full`}
                >
                  <strong className="text-black">Lead Source:</strong>{" "}
                  {selectedRow.lead_source !== null &&
                  selectedRow.lead_source !== "" ? (
                    selectedRow.lead_source
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Third Row */}
              <div
                className={`p-4 border border-gray-200 rounded col-span-1 transition cursor-pointer ${
                  selectedRow.prospect_date
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-yellow-50 hover:bg-yellow-100"
                } break-words w-full`}
              >
                <strong className="text-black">
                  Prospect
                  <br className="hidden xl:block" /> Date:
                </strong>
                <span className="inline xl:hidden">
                  {" "}
                  {selectedRow.prospect_date ? (
                    formatDate(selectedRow.prospect_date)
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </span>
                <div className="hidden xl:flex flex-col items-start gap-2 mt-2">
                  {selectedRow.prospect_date !== null ? (
                    selectedRow.prospect_date ? (
                      <>
                        <CheckIcon className="w-6 h-6 text-blue-900" />
                        <div className="text-sm text-gray-500">
                          {formatDate(selectedRow.prospect_date)}
                        </div>
                      </>
                    ) : (
                      <MinusIcon className="w-6 h-6 text-gray-500" />
                    )
                  ) : (
                    <MinusIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
              </div>
              <div
                className={`p-4 border border-gray-200 rounded col-span-1 transition cursor-pointer ${
                  selectedRow.meetings_conducted
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-yellow-50 hover:bg-yellow-100"
                } break-words w-full`}
              >
                <strong className="text-black">
                  Meetings
                  <br className="hidden xl:block" /> Conducted:
                </strong>
                <span className="inline xl:hidden">
                  {" "}
                  {selectedRow.meeting_date ? (
                    formatDate(selectedRow.meeting_date)
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </span>
                <div className="hidden xl:flex flex-col items-start gap-2 mt-2">
                  {selectedRow.meetings_conducted !== null ? (
                    selectedRow.meetings_conducted ? (
                      <>
                        <CheckIcon className="w-6 h-6 text-blue-900" />
                        <div className="text-sm text-gray-500">
                          {selectedRow.meeting_date ? (
                            formatDate(selectedRow.meeting_date)
                          ) : (
                            <MinusIcon className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      </>
                    ) : (
                      <MinusIcon className="w-6 h-6 text-gray-500" />
                    )
                  ) : (
                    <MinusIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
              </div>
              <div
                className={`p-4 border border-gray-200 rounded col-span-1 transition cursor-pointer ${
                  selectedRow.proposal_in_progress
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-yellow-50 hover:bg-yellow-100"
                } break-words w-full`}
              >
                <strong className="text-black">
                  Proposals
                  <br className="hidden xl:block" /> in Progress:
                </strong>
                <span className="inline xl:hidden">
                  {" "}
                  {selectedRow.proposal_in_progress_date ? (
                    formatDate(selectedRow.proposal_in_progress_date)
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </span>
                <div className="hidden xl:flex flex-col items-start gap-2 mt-2">
                  {selectedRow.proposal_in_progress !== null ? (
                    selectedRow.proposal_in_progress ? (
                      <>
                        <CheckIcon className="w-6 h-6 text-blue-900" />
                        <div className="text-sm text-gray-500">
                          {selectedRow.proposal_in_progress_date ? (
                            formatDate(selectedRow.proposal_in_progress_date)
                          ) : (
                            <MinusIcon className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      </>
                    ) : (
                      <MinusIcon className="w-6 h-6 text-gray-500" />
                    )
                  ) : (
                    <MinusIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
              </div>
              <div
                className={`p-4 border border-gray-200 rounded col-span-1 transition cursor-pointer ${
                  selectedRow.proposal_sent_out
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-yellow-50 hover:bg-yellow-100"
                } break-words w-full`}
              >
                <strong className="text-black">
                  Proposals
                  <br className="hidden xl:block" /> Sent Out:
                </strong>
                <span className="inline xl:hidden">
                  {" "}
                  {selectedRow.proposal_sent_out_date ? (
                    formatDate(selectedRow.proposal_sent_out_date)
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </span>
                <div className="hidden xl:flex flex-col items-start gap-2 mt-2">
                  {selectedRow.proposal_sent_out !== null ? (
                    selectedRow.proposal_sent_out ? (
                      <>
                        <CheckIcon className="w-6 h-6 text-blue-900" />
                        <div className="text-sm text-gray-500">
                          {selectedRow.proposal_sent_out_date ? (
                            formatDate(selectedRow.proposal_sent_out_date)
                          ) : (
                            <MinusIcon className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      </>
                    ) : (
                      <MinusIcon className="w-6 h-6 text-gray-500" />
                    )
                  ) : (
                    <MinusIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
              </div>
              <div
                className={`p-4 border border-gray-200 rounded col-span-1 transition cursor-pointer ${
                  selectedRow.lost_lead
                    ? "bg-red-50 hover:bg-red-100"
                    : selectedRow.quotation_signed
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-yellow-50 hover:bg-yellow-100"
                } break-words w-full`}
              >
                <strong className="text-black">
                  Quotation
                  <br className="hidden xl:block" /> Signed:
                </strong>
                <span className="inline xl:hidden">
                  {selectedRow.quotation_signed_date ? (
                    formatDate(selectedRow.quotation_signed_date)
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </span>
                <div className="hidden xl:flex flex-col items-start gap-2 mt-2">
                  {selectedRow.lost_lead ? (
                    <>
                      <XIcon className="w-6 h-6 text-red-500" />
                      <div className="text-sm text-gray-500 font-bold">
                        Lost Lead
                      </div>
                    </>
                  ) : selectedRow.quotation_signed !== null ? (
                    selectedRow.quotation_signed ? (
                      <>
                        <CheckIcon className="w-6 h-6 text-blue-900" />
                        <div className="text-sm text-gray-500">
                          {selectedRow.quotation_signed_date ? (
                            formatDate(selectedRow.quotation_signed_date)
                          ) : (
                            <MinusIcon className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      </>
                    ) : (
                      <MinusIcon className="w-6 h-6 text-gray-500" />
                    )
                  ) : (
                    <MinusIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
              </div>
              {/* Fifth Row */}
              <div className="col-span-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 border border-gray-200 rounded transition cursor-pointer ${
                    selectedRow.total_proposal_value
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-yellow-50 hover:bg-yellow-100"
                  } break-words w-full`}
                >
                  <strong className="text-black">Total Proposal Value:</strong>{" "}
                  {selectedRow.total_proposal_value !== null &&
                  selectedRow.total_proposal_value !== 0 ? (
                    `RM ${new Intl.NumberFormat().format(
                      selectedRow.total_proposal_value
                    )}`
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div
                  className={`p-4 border border-gray-200 rounded transition cursor-pointer ${
                    selectedRow.total_closed_sale
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-yellow-50 hover:bg-yellow-100"
                  } break-words w-full`}
                >
                  <strong className="text-black">Total Closed Sale:</strong>{" "}
                  {selectedRow.total_closed_sale !== null &&
                  selectedRow.total_closed_sale !== 0 ? (
                    `RM ${new Intl.NumberFormat().format(
                      selectedRow.total_closed_sale
                    )}`
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
                </div>
              </div>
              {/* Final Row */}
              <div
                className={`p-4 border border-gray-200 rounded col-span-5 transition cursor-pointer ${
                  selectedRow.meetings_conducted
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-yellow-50 hover:bg-yellow-100"
                } break-words w-full`}
              >
                <strong className="text-black">Notes:</strong>{" "}
                {selectedRow.notes !== null && selectedRow.notes !== "" ? (
                  selectedRow.notes
                ) : (
                  <MinusIcon className="inline w-6 h-6 text-gray-500" />
                )}
              </div>
              {/* Inactive Reason Row - Only shows when isInactive is true */}
              {selectedRow.isInactive && (
                <div className="p-4 border border-gray-200 rounded col-span-5 transition cursor-pointer bg-yellow-100 hover:bg-yellow-200 break-words w-full">
                  <strong className="text-black">Archive Reason:</strong>{" "}
                  {selectedRow.inactiveReason !== null &&
                  selectedRow.inactiveReason !== "" ? (
                    selectedRow.inactiveReason.charAt(0).toUpperCase() +
                    selectedRow.inactiveReason.slice(1)
                  ) : (
                    <MinusIcon className="inline w-6 h-6 text-gray-500" />
                  )}
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
