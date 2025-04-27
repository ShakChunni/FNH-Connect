import React, { useState, useRef } from "react";
import { CheckIcon, MinusIcon, Circle, XIcon, Copy } from "lucide-react";
import EditButton from "./EditButton";
import Overview from "./OverView";
import Notification from "./Notification";
import { createPortal } from "react-dom";
import { FaEye } from "react-icons/fa";
import WhatsappMessaging from "./WhatsappMessaging";

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
      <tr className="hover:bg-gray-100">
        <td
          className={`px-6 py-4 whitespace-nowrap font-semibold border-r border-gray-200 cursor-pointer ${"md:sticky md:left-0 md:bg-gray-100 md:z-20"}`}
          onClick={() => onEditClick(row)}
        >
          <EditButton onClick={() => onEditClick(row)} />
          {`#${totalRows - index}`}
        </td>
        <td
          className={`px-6 py-4 whitespace-nowrap border-r border-gray-200 cursor-pointer group ${"md:sticky md:bg-gray-100 md:z-20"}`}
          onClick={() => handleRowClick(row)}
          style={{ left: getLeftValue() }}
        >
          <div className="flex items-center justify-between space-x-2 flex-wrap">
            <div className="flex items-center space-x-2 flex-wrap">
              {row.organization_name ? (
                <span>{row.organization_name}</span>
              ) : (
                <div className="flex justify-center">
                  <MinusIcon className="inline w-6 h-6 text-gray-500" />
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {row.isInactive && (
                  <span className="px-2 py-0.5 rounded-2xl bg-orange-500 text-white text-[10px] whitespace-nowrap">
                    ARCHIVE
                  </span>
                )}
                {row.lost_lead && (
                  <span className="px-2 py-0.5 rounded-2xl bg-red-600 text-white text-[10px] whitespace-nowrap">
                    LOST LEAD
                  </span>
                )}
                {row.quotation_signed && (
                  <span className="px-2 py-0.5 rounded-2xl bg-green-700 text-white text-[10px] whitespace-nowrap">
                    SIGNED
                  </span>
                )}
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <FaEye className="w-4 h-4 text-gray-500" />{" "}
              {/* Replace FaEye with Eye */}
            </div>
          </div>
        </td>
        <td
          className="px-6 py-4 whitespace-nowrap border-r border-gray-100 cursor-pointer"
          onClick={() => handleRowClick(row)}
        >
          {row.client_name ? (
            <div className="flex items-center space-x-2 flex-wrap">
              <span>{row.client_name}</span>
            </div>
          ) : (
            <div className="flex justify-center items-center w-full">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td
          className="px-6 py-4 whitespace-nowrap border-r border-gray-100 group relative"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {row.client_contact_number ? (
            <div className="flex items-center cursor-pointer hover:text-blue-600 transition-colors">
              <span>{row.client_contact_number}</span>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <Copy
                  className="w-3.5 h-3.5 cursor-pointer text-gray-500 hover:text-gray-700"
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
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>

        <td
          className="px-6 py-4 whitespace-nowrap border-r border-gray-100 group relative"
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
              <Copy className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.organization_website ? (
            <a
              ref={linkRef}
              href={formatUrl(row.organization_website)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {truncateText(row.organization_website, 20)}
            </a>
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.industry_name !== null && row.industry_name !== "" ? (
            row.industry_name
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.organization_location || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.lead_source || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {formatDate(row.prospect_date)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.PIC || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.meetings_conducted !== null ? (
            row.meetings_conducted ? (
              <div className="flex justify-center">
                <CheckIcon className="w-6 h-6 text-blue-950" />
              </div>
            ) : (
              <div className="flex justify-center">
                <Circle className="w-6 h-6 text-gray-400" />
              </div>
            )
          ) : (
            ""
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {formatDate(row.meeting_date)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.proposal_in_progress !== null ? (
            row.proposal_in_progress ? (
              <div className="flex justify-center">
                <CheckIcon className="w-6 h-6 text-blue-950" />
              </div>
            ) : (
              <div className="flex justify-center">
                <Circle className="w-6 h-6 text-gray-400" />
              </div>
            )
          ) : (
            ""
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {formatDate(row.proposal_in_progress_date)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.proposal_sent_out !== null ? (
            row.proposal_sent_out ? (
              <div className="flex justify-center">
                <CheckIcon className="w-6 h-6 text-blue-950" />
              </div>
            ) : (
              <div className="flex justify-center">
                <Circle className="w-6 h-6 text-gray-400" />
              </div>
            )
          ) : (
            ""
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {formatDate(row.proposal_sent_out_date)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.quotation_signed !== null ? (
            row.quotation_signed ? (
              <div className="flex justify-center">
                <CheckIcon className="w-6 h-6 text-blue-950" />
              </div>
            ) : (
              <div className="flex justify-center">
                <Circle className="w-6 h-6 text-gray-400" />
              </div>
            )
          ) : (
            ""
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {formatDate(row.quotation_signed_date)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.quotation_number || ""}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.lost_lead !== null ? (
            row.lost_lead ? (
              <div className="flex justify-center">
                <XIcon className="w-6 h-6 text-red-700" />
              </div>
            ) : (
              ""
            )
          ) : (
            ""
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.type || ""}
        </td>
        <td
          ref={noteCellRef}
          className="px-6 py-4 whitespace-nowrap border-r border-gray-100 relative"
          onMouseEnter={() => setShowFullNote(true)}
          onMouseLeave={() => setShowFullNote(false)}
        >
          {row.notes ? truncateNote(row.notes) : ""}
          {showFullNote && row.notes && (
            <div
              className="absolute z-10 p-4 bg-white border border-gray-200 rounded-none shadow-2xl transition-opacity duration-300 opacity-100 break-words whitespace-normal"
              style={{
                top: "0%",
                left: "0",
                minWidth: noteCellRef.current
                  ? noteCellRef.current.offsetWidth
                  : "auto",
                maxWidth: "300px",
              }}
            >
              {row.notes}
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.total_proposal_value !== null && row.total_proposal_value !== 0
            ? `RM ${new Intl.NumberFormat().format(row.total_proposal_value)}`
            : ""}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.total_closed_sale !== null && row.total_closed_sale !== 0
            ? `RM ${new Intl.NumberFormat().format(row.total_closed_sale)}`
            : ""}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.source_table === "MI" ? "TMI" : row.source_table}
        </td>
      </tr>
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

export default TableRow;
