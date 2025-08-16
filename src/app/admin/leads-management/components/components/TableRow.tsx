import React, { useState, useRef } from "react";
import { CheckIcon, MinusIcon, Circle, XIcon } from "lucide-react";
import EditButton from "./EditButton";
import Overview from "./OverView";
import { createPortal } from "react-dom";


interface TableRowProps {
  row: {
    id: number;
    organization: string;
    client_position: string | null;
    client_name: string | null;
    client_email: string | null;
    client_Quality: string | null;
    client_otherEmail: string | null;
    client_phone: string | null;
    client_otherPhone: string | null;
    client_linkedinUrl: string | null;
    industry: string | null;
    address: string | null;
    ownerId: number | null;
    owner: { username: string; fullName: string | null } | null;
    assignedDate: string | null;
    assignedOrg: string | null;
    status: string | null;
    contactDate: string | null;
    notes: string | null;
    followUpDate: string | null;
    uploadedAt: string;
    isActive: boolean;
  };
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

  const truncateNote = (note: string, maxLength: number = 50) => {
    if (!note) return "";
    if (note.length <= maxLength) return note;
    return `${note.substring(0, maxLength)}...`;
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
          className={`px-6 py-6 whitespace-nowrap flex items-center gap-2 border-r border-gray-200 cursor-pointer ${"md:sticky md:bg-gray-100 md:z-20"}`}
          onClick={() => handleRowClick(row)}
          style={{ left: getLeftValue() }}
        >
          <div className="flex items-center space-x-2 flex-wrap">
            <span>{row.organization}</span>
            <div className="flex flex-wrap gap-1">
              {!row.isActive && (
                <span className="px-2 py-0.5 rounded-2xl bg-orange-500 text-white text-[10px] whitespace-nowrap">
                  INACTIVE
                </span>
              )}
              {row.status && (
                <span className="px-2 py-0.5 rounded-2xl bg-blue-600 text-white text-[10px] whitespace-nowrap">
                  {row.status}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.client_name || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.client_position || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.client_email || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.client_Quality || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.client_phone || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.client_otherPhone || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.client_linkedinUrl ? (
            <a
              href={row.client_linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              LinkedIn
            </a>
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.industry || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.address || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.owner?.fullName || row.owner?.username || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.assignedOrg || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {row.status || (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {formatDate(row.contactDate)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
          {formatDate(row.followUpDate)}
        </td>
        <td
          ref={noteCellRef}
          className="px-6 py-4 whitespace-nowrap border-r border-gray-100 relative"
          onMouseEnter={() => setShowFullNote(true)}
          onMouseLeave={() => setShowFullNote(false)}
        >
          {row.notes ? (
            truncateNote(row.notes)
          ) : (
            <div className="flex justify-center">
              <MinusIcon className="inline w-6 h-6 text-gray-500" />
            </div>
          )}
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
          {formatDate(row.uploadedAt)}
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
    </>
  );
};

export default TableRow;
