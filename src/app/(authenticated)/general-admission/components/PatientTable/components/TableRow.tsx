import React from "react";
import { Edit2, Printer, FileText } from "lucide-react";
import {
  AdmissionPatientData,
  ADMISSION_STATUS_OPTIONS,
  AdmissionStatus,
} from "../../../types";
import { TableHeader, formatCurrency, formatDateWithTime } from "../utils";
import {
  generateAdmissionReceipt,
  generateAdmissionInvoice,
} from "../../../utils/generateReceipt";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";
import StatusDropdown from "./StatusDropdown";

interface TableRowProps {
  row: AdmissionPatientData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: AdmissionPatientData) => void;
  onPatientClick?: (patient: AdmissionPatientData) => void;
  onStatusChange?: (patientId: number, newStatus: AdmissionStatus) => void;
  isStatusUpdating?: boolean;
}

const TableRow: React.FC<TableRowProps> = ({
  row,
  index,
  headers,
  onEdit,
  onPatientClick,
  onStatusChange,
  isStatusUpdating = false,
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const FIRST_COL_WIDTH = "w-[60px] min-w-[60px]";
  const SECOND_COL_WIDTH = "w-[100px] min-w-[100px]";
  const THIRD_COL_WIDTH = "w-[200px] min-w-[200px]";

  const getCellClasses = (headerIndex: number) => {
    const baseClasses =
      "px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 text-[11px] sm:text-xs text-gray-900 whitespace-nowrap transition-colors";

    if (headerIndex === 0) {
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:z-10 lg:left-0 lg:bg-gray-50/95 group-hover:lg:bg-gray-100`;
    }
    if (headerIndex === 1) {
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:z-10 lg:left-[60px] lg:bg-gray-50/95 group-hover:lg:bg-gray-100`;
    }
    if (headerIndex === 2) {
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:z-10 lg:left-[160px] lg:bg-gray-50/95 group-hover:lg:bg-gray-100`;
    }
    return baseClasses;
  };

  const getStatusBadge = (status: string) => {
    const option = ADMISSION_STATUS_OPTIONS.find((o) => o.value === status);
    const colorClasses: Record<string, string> = {
      blue: "bg-blue-100 text-blue-800",
      amber: "bg-yellow-100 text-yellow-800",
      purple: "bg-purple-100 text-purple-800",
      green: "bg-green-100 text-green-800",
      red: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
          colorClasses[option?.color || "blue"] || colorClasses.blue
        }`}
      >
        {option?.label || status}
      </span>
    );
  };

  const handleStatusChange = (newStatus: AdmissionStatus) => {
    onStatusChange?.(row.id, newStatus);
  };

  const renderCellContent = (header: TableHeader) => {
    switch (header.key) {
      case "id":
        return <span className="font-semibold text-fnh-navy">{index}</span>;

      case "patientFullName":
        return (
          <div
            className="font-medium cursor-pointer group/name"
            onClick={() => onPatientClick?.(row)}
          >
            <div className="text-gray-900 group-hover/name:text-fnh-blue transition-colors flex items-center gap-2">
              {row.patientFullName}
            </div>
            <div className="text-[10px] text-gray-500 leading-none mt-0.5">
              {row.patientGender}
              {row.patientAge ? `, ${row.patientAge}y` : ""}
            </div>
          </div>
        );

      case "admissionNumber":
        return (
          <span className="font-mono text-fnh-navy">{row.admissionNumber}</span>
        );

      case "departmentName":
        return <span className="text-gray-700">{row.departmentName}</span>;

      case "doctorName":
        return (
          <div>
            <span className="text-gray-700">{row.doctorName}</span>
            {row.doctorSpecialization && (
              <div className="text-[10px] text-gray-500">
                {row.doctorSpecialization}
              </div>
            )}
          </div>
        );

      case "status":
        return getStatusBadge(row.status);

      case "grandTotal":
        return (
          <span className="font-semibold text-green-600">
            {formatCurrency(row.grandTotal)}
          </span>
        );

      case "dueAmount":
        return (
          <span
            className={`font-semibold ${
              row.dueAmount > 0 ? "text-red-600" : "text-gray-400"
            }`}
          >
            {formatCurrency(row.dueAmount)}
          </span>
        );

      case "dateAdmitted":
        return formatDateWithTime(row.dateAdmitted);

      case "actions":
        return (
          <div className="flex items-center gap-1.5">
            {/* Status Dropdown */}
            <StatusDropdown
              currentStatus={row.status}
              onStatusChange={handleStatusChange}
              isUpdating={isStatusUpdating}
            />

            {/* Edit Button */}
            <button
              onClick={() => onEdit?.(row)}
              className="p-1.5 bg-fnh-navy text-white rounded-lg hover:bg-fnh-navy-dark transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Edit admission"
            >
              <Edit2 size={16} />
            </button>

            {/* Receipt Button */}
            <button
              onClick={() => {
                generateAdmissionReceipt(row, user?.fullName || "Staff");
                showNotification("Generating Admission Form...", "success");
              }}
              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Print Admission Receipt"
            >
              <Printer size={16} />
            </button>

            {/* Full Invoice Button */}
            <button
              onClick={() => {
                generateAdmissionInvoice(row, user?.fullName || "Staff");
                showNotification("Generating Patient Invoice...", "success");
              }}
              className="p-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Print Full Invoice"
            >
              <FileText size={16} />
            </button>
          </div>
        );

      default:
        return row[header.key as keyof AdmissionPatientData] || "N/A";
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      {headers.map((header, headerIndex) => (
        <td key={header.key} className={getCellClasses(headerIndex)}>
          {renderCellContent(header)}
        </td>
      ))}
    </tr>
  );
};

export default React.memo(TableRow);
