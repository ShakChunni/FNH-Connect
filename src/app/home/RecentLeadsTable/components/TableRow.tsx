import React, { useState, useRef } from "react";
import { CheckIcon, MinusIcon, Circle, XIcon, Copy, Eye } from "lucide-react";
import EditButton from "./EditButton";
import Overview from "./OverView/OverView";
import Notification from "./Notification";
import { createPortal } from "react-dom";
import WhatsappMessaging from "./WhatsappMessaging";
import { motion, AnimatePresence } from "framer-motion";

interface TableRowProps {
  row: any;
  formatDate: (date: string | null) => string;
  onEditClick: (row: any) => void;
  index: number;
  totalRows: number;
  currentPage: number;
}

const TableRow: React.FC<TableRowProps> = ({
  row,
  formatDate,
  onEditClick,
  index,
  totalRows,
  currentPage,
}) => {
  const [showFullNote, setShowFullNote] = useState(false);
  const [noteHoverTimeout, setNoteHoverTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const handleNoteMouseEnter = () => {
    // Clear any existing timeout
    if (noteHoverTimeout) {
      clearTimeout(noteHoverTimeout);
      setNoteHoverTimeout(null);
    }
    setShowFullNote(true);
  };

  const handleNoteMouseLeave = () => {
    // Add a small delay before hiding to prevent glitching
    const timeout = setTimeout(() => {
      setShowFullNote(false);
    }, 100);
    setNoteHoverTimeout(timeout);
  };

  const handleTooltipMouseEnter = () => {
    // Clear timeout if mouse enters tooltip
    if (noteHoverTimeout) {
      clearTimeout(noteHoverTimeout);
      setNoteHoverTimeout(null);
    }
  };

  const handleTooltipMouseLeave = () => {
    // Hide tooltip when leaving tooltip area
    setShowFullNote(false);
  };

  const [showPopup, setShowPopup] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const noteCellRef = useRef<HTMLTableDataCellElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "success" });

  const truncateNote = (note: string, maxLength: number = 50) => {
    if (!note) return "";
    if (note.length <= maxLength) return note;
    return `${note.substring(0, maxLength)}...`;
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const formatUrl = (url: string) => {
    if (!url) return "";
    // If url doesn't have http:// or https://, add https://
    return url.match(/^https?:\/\//) ? url : `https://${url}`;
  };

  const handleRowClick = (row: any) => {
    setSelectedRow(row);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedRow(null);
  };

  const getLeftValue = () => {
    const startIndex = (currentPage - 1) * 50 + 1;
    const length = (totalRows - startIndex).toString().length;
    if (length >= 4) {
      return "8rem";
    } else if (length > 2) {
      return "7rem";
    } else {
      return "6rem";
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setNotification({
          show: true,
          message: `${type} copied to clipboard`,
          type: "success",
        });
      })
      .catch(() => {
        setNotification({
          show: true,
          message: `Failed to copy ${type}`,
          type: "error",
        });
      });
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  return (
    <>
      <tr className="hover:bg-gray-100 transition-all duration-300 ease-in-out">
        {/* ID Cell - Sticky */}
        <td
          className={`px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
            whitespace-nowrap border-r border-gray-200 cursor-pointer 
            md:sticky md:left-0 md:bg-gray-100 md:z-20 transition-all duration-300
            text-2xs xs:text-xs sm:text-sm font-semibold`}
          onClick={() => onEditClick(row)}
        >
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
            <EditButton onClick={() => onEditClick(row)} />
            <span>{`#${totalRows - index}`}</span>
          </div>
        </td>

        {/* Organization Cell - Sticky */}
        <td
          className={`px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
          whitespace-nowrap border-r border-gray-200 cursor-pointer group
          md:sticky md:bg-gray-100 md:z-20 transition-all duration-300
          text-2xs xs:text-xs sm:text-sm`}
          onClick={() => handleRowClick(row)}
          style={{
            left: getLeftValue(),
            minWidth: "fit-content",
          }}
        >
          <div className="flex items-center justify-between space-x-1.5 xs:space-x-2">
            <div className="flex items-center gap-2 min-w-0">
              {row.organization_name ? (
                <span className="leading-tight truncate max-w-[150px] sm:max-w-[200px] md:max-w-[250px]">
                  {row.organization_name}
                </span>
              ) : (
                <div className="flex justify-center">
                  <MinusIcon className="inline w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-500" />
                </div>
              )}
              <div className="flex items-center gap-1 flex-shrink-0">
                {row.isInactive && (
                  <span className="px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-2xl bg-orange-500 text-white text-[8px] xs:text-[9px] sm:text-xs whitespace-nowrap flex-shrink-0">
                    ARCHIVE
                  </span>
                )}
                {row.lost_lead && (
                  <span className="px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-2xl bg-red-600 text-white text-[8px] xs:text-[9px] sm:text-xs whitespace-nowrap flex-shrink-0">
                    LOST
                  </span>
                )}
                {row.quotation_signed && (
                  <span className="px-1 xs:px-1.5 sm:px-2 py-0.5 rounded-2xl bg-green-700 text-white text-[8px] xs:text-[9px] sm:text-xs whitespace-nowrap flex-shrink-0">
                    SIGNED
                  </span>
                )}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Eye className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-500" />
            </div>
          </div>
        </td>

        {/* Campaign Name - NEW COLUMN */}
        <td
          className="px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
            whitespace-nowrap border-r border-gray-100 cursor-pointer
            text-2xs xs:text-xs sm:text-sm"
          onClick={() => handleRowClick(row)}
        >
          {row.campaign_name ? (
            <span className="leading-tight truncate max-w-[120px] sm:max-w-[150px] md:max-w-[180px]">
              {row.campaign_name}
            </span>
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-500" />
            </div>
          )}
        </td>

        {/* Client Name */}
        <td
          className="px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
            whitespace-nowrap border-r border-gray-100 cursor-pointer
            text-2xs xs:text-xs sm:text-sm"
          onClick={() => handleRowClick(row)}
        >
          {row.client_name ? (
            <span>{row.client_name}</span>
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-500" />
            </div>
          )}
        </td>

        {/* Client Contact Number */}
        <td
          className="px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
            whitespace-nowrap border-r border-gray-100 group relative
            text-2xs xs:text-xs sm:text-sm"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {row.client_contact_number ? (
            <div className="flex items-center cursor-pointer hover:text-blue-600 transition-colors">
              <span>{row.client_contact_number}</span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <Copy
                  className="w-3 h-3 xs:w-3.5 xs:h-3.5 cursor-pointer text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(row.client_contact_number, "Phone number");
                  }}
                />
                <WhatsappMessaging phoneNumber={row.client_contact_number} />
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-500" />
            </div>
          )}
        </td>

        {/* Client Email */}
        <td
          className="px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
            whitespace-nowrap border-r border-gray-100 group relative
            text-2xs xs:text-xs sm:text-sm"
          onClick={(e) => {
            e.stopPropagation();
            if (row.client_contact_email) {
              copyToClipboard(row.client_contact_email, "Email address");
            }
          }}
        >
          {row.client_contact_email ? (
            <div className="flex items-center cursor-pointer hover:text-blue-600 transition-colors">
              <span>{row.client_contact_email}</span>
              <Copy className="w-3 h-3 xs:w-3.5 xs:h-3.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-500" />
            </div>
          )}
        </td>

        {/* The rest of the cells with consistent styling */}
        {[
          { value: row.organization_website, isLink: true },
          {
            value:
              row.industry_name !== null && row.industry_name !== ""
                ? row.industry_name
                : null,
          },
          { value: row.organization_location },
          { value: row.lead_source },
          { value: formatDate(row.prospect_date), noPlaceholder: true },
          { value: row.PIC },
          {
            value:
              row.meetings_conducted !== null ? row.meetings_conducted : null,
            isBoolean: true,
            checkIcon: (
              <CheckIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-950" />
            ),
            uncheckIcon: (
              <Circle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-400" />
            ),
          },
          { value: formatDate(row.meeting_date), noPlaceholder: true },
          {
            value:
              row.proposal_in_progress !== null
                ? row.proposal_in_progress
                : null,
            isBoolean: true,
            checkIcon: (
              <CheckIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-950" />
            ),
            uncheckIcon: (
              <Circle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-400" />
            ),
          },
          {
            value: formatDate(row.proposal_in_progress_date),
            noPlaceholder: true,
          },
          {
            value:
              row.proposal_sent_out !== null ? row.proposal_sent_out : null,
            isBoolean: true,
            checkIcon: (
              <CheckIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-950" />
            ),
            uncheckIcon: (
              <Circle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-400" />
            ),
          },
          {
            value: formatDate(row.proposal_sent_out_date),
            noPlaceholder: true,
          },
          {
            value: row.quotation_signed !== null ? row.quotation_signed : null,
            isBoolean: true,
            checkIcon: (
              <CheckIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-blue-950" />
            ),
            uncheckIcon: (
              <Circle className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-400" />
            ),
          },
          { value: formatDate(row.quotation_signed_date), noPlaceholder: true },
          { value: row.quotation_number },
          {
            value: row.lost_lead !== null ? row.lost_lead : null,
            isBoolean: true,
            checkIcon: (
              <XIcon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-red-700" />
            ),
            customDisplay: true,
          },
          { value: row.type },
        ].map((cell, cellIndex) => (
          <td
            key={cellIndex}
            className={`px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
              whitespace-nowrap border-r border-gray-100
              text-2xs xs:text-xs sm:text-sm`}
          >
            {cell.isBoolean ? (
              cell.value === true ? (
                <div className="flex justify-center">{cell.checkIcon}</div>
              ) : cell.value === false ? (
                <div className="flex justify-center">{cell.uncheckIcon}</div>
              ) : cell.customDisplay && cell.value === true ? (
                <div className="flex justify-center">{cell.checkIcon}</div>
              ) : (
                ""
              )
            ) : cell.isLink && cell.value ? (
              <a
                ref={linkRef}
                href={formatUrl(cell.value as string)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline text-2xs xs:text-xs sm:text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {truncateText(cell.value as string, 20)}
              </a>
            ) : cell.value ? (
              <span>{cell.value}</span>
            ) : cell.noPlaceholder ? (
              ""
            ) : (
              <div className="flex justify-center">
                <MinusIcon className="inline w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-500" />
              </div>
            )}
          </td>
        ))}

        {/* Notes Cell - Fixed tooltip handling */}
        <td
          ref={noteCellRef}
          className="px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
            whitespace-nowrap border-r border-gray-100 relative
            text-2xs xs:text-xs sm:text-sm"
          onMouseEnter={handleNoteMouseEnter}
          onMouseLeave={handleNoteMouseLeave}
        >
          {row.notes ? (
            <span className="cursor-help">{truncateNote(row.notes)}</span>
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-500" />
            </div>
          )}
          <AnimatePresence>
            {showFullNote && row.notes && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute z-10 p-4 bg-white border border-gray-200 rounded-md shadow-2xl break-words whitespace-normal"
                style={{
                  top: "-8px",
                  left: "0",
                  minWidth: noteCellRef.current
                    ? noteCellRef.current.offsetWidth
                    : "auto",
                  maxWidth: "300px",
                }}
                onMouseEnter={handleTooltipMouseEnter}
                onMouseLeave={handleTooltipMouseLeave}
              >
                {row.notes}
              </motion.div>
            )}
          </AnimatePresence>
        </td>

        {/* Final cells */}
        <td
          className="px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
            whitespace-nowrap border-r border-gray-100
            text-2xs xs:text-xs sm:text-sm"
        >
          {row.total_proposal_value !== null && row.total_proposal_value !== 0
            ? `RM ${new Intl.NumberFormat().format(row.total_proposal_value)}`
            : ""}
        </td>
        <td
          className="px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
            whitespace-nowrap border-r border-gray-100
            text-2xs xs:text-xs sm:text-sm"
        >
          {row.total_closed_sale !== null && row.total_closed_sale !== 0
            ? `RM ${new Intl.NumberFormat().format(row.total_closed_sale)}`
            : ""}
        </td>
        <td
          className="px-3 xs:px-4 sm:px-5 md:px-6 py-3 xs:py-3.5 sm:py-4 
            whitespace-nowrap border-r border-gray-100
            text-2xs xs:text-xs sm:text-sm"
        >
          {row.source_table === "MI" ? "TMI" : row.source_table}
        </td>
      </tr>

      {/* Popup Overview */}
      {showPopup &&
        selectedRow &&
        typeof window !== "undefined" &&
        createPortal(
          <Overview
            selectedRow={selectedRow}
            formatDate={formatDate}
            handleClosePopup={handleClosePopup}
            onEditClick={onEditClick}
          />,
          document.body
        )}

      {/* Notification */}
      {notification.show &&
        typeof window !== "undefined" &&
        createPortal(
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={handleCloseNotification}
            duration={3000}
          />,
          document.body
        )}
    </>
  );
};

export default React.memo(TableRow);
