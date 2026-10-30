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
import { StatusBadge } from "@/components/ui/StatusBadge";
import StatusDropdown from "./StatusDropdown";

/** Status pill: shared tone, display label from ADMISSION_STATUS_OPTIONS. */
export const AdmissionStatusBadge: React.FC<{ status: string }> = ({
  status,
}) => {
  const option = ADMISSION_STATUS_OPTIONS.find((o) => o.value === status);
  return (
    <StatusBadge
      status={status}
      tone={option?.tone}
      label={option?.label ?? status}
    />
  );
};

interface AdmissionRowActionsProps {
  row: AdmissionPatientData;
  onEdit?: (patient: AdmissionPatientData) => void;
  onStatusChange?: (patientId: number, newStatus: AdmissionStatus) => void;
  isStatusUpdating?: boolean;
}

/** Status, edit and print actions. Shared by the desktop table and the mobile cards. */
export const AdmissionRowActions: React.FC<AdmissionRowActionsProps> = ({
  row,
  onEdit,
  onStatusChange,
  isStatusUpdating = false,
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  return (
    <div className="flex items-center gap-1.5">
      <StatusDropdown
        currentStatus={row.status}
        onStatusChange={(newStatus) => onStatusChange?.(row.id, newStatus)}
        isUpdating={isStatusUpdating}
      />

      <button
        type="button"
        onClick={() => onEdit?.(row)}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-fnh-navy text-white transition-colors hover:bg-fnh-navy-dark cursor-pointer"
        title="Edit admission"
        aria-label="Edit admission"
      >
        <Edit2 size={16} />
      </button>

      <button
        type="button"
        onClick={() => {
          generateAdmissionReceipt(row, user?.fullName || "Staff");
          showNotification("Generating Admission Form...", "success");
        }}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
        title="Print Admission Receipt"
        aria-label="Print admission receipt"
      >
        <Printer size={16} />
      </button>

      <button
        type="button"
        onClick={() => {
          generateAdmissionInvoice(row, user?.fullName || "Staff");
          showNotification("Generating Patient Invoice...", "success");
        }}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
        title="Print Full Invoice"
        aria-label="Print full invoice"
      >
        <FileText size={16} />
      </button>
    </div>
  );
};

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
  const FIRST_COL_WIDTH = "w-[60px] min-w-[60px]";
  const SECOND_COL_WIDTH = "w-[100px] min-w-[100px]";
  const THIRD_COL_WIDTH = "w-[200px] min-w-[200px]";

  const getCellClasses = (headerIndex: number) => {
    const baseClasses =
      "px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 text-2xs sm:text-xs text-slate-900 whitespace-nowrap transition-colors";

    if (headerIndex === 0) {
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:z-10 lg:left-0 lg:bg-slate-50/95 group-hover:lg:bg-slate-100`;
    }
    if (headerIndex === 1) {
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:z-10 lg:left-[60px] lg:bg-slate-50/95 group-hover:lg:bg-slate-100`;
    }
    if (headerIndex === 2) {
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:z-10 lg:left-[160px] lg:bg-slate-50/95 group-hover:lg:bg-slate-100`;
    }
    return baseClasses;
  };

  const renderCellContent = (header: TableHeader) => {
    switch (header.key) {
      case "id":
        return (
          <span className="font-semibold text-fnh-navy tabular-nums">
            {index}
          </span>
        );

      case "patientFullName":
        return (
          <div
            className="font-medium cursor-pointer group/name"
            onClick={() => onPatientClick?.(row)}
          >
            <div className="text-slate-900 group-hover/name:text-fnh-blue transition-colors flex items-center gap-2">
              {row.patientFullName}
            </div>
            <div className="text-2xs text-slate-500 leading-none mt-0.5">
              {row.patientGender}
              {row.patientAge ? `, ${row.patientAge}y` : ""}
            </div>
          </div>
        );

      case "admissionNumber":
        return (
          <span className="font-mono tabular-nums text-fnh-navy">
            {row.admissionNumber}
          </span>
        );

      case "departmentName":
        return <span className="text-slate-700">{row.departmentName}</span>;

      case "doctorName":
        return (
          <div>
            <span className="text-slate-700">{row.doctorName}</span>
            {row.doctorSpecialization && (
              <div className="text-2xs text-slate-500">
                {row.doctorSpecialization}
              </div>
            )}
          </div>
        );

      case "status":
        return <AdmissionStatusBadge status={row.status} />;

      case "grandTotal":
        return (
          <span className="font-semibold tabular-nums text-emerald-700">
            {formatCurrency(row.grandTotal)}
          </span>
        );

      case "dueAmount":
        return (
          <span
            className={`font-semibold tabular-nums ${
              row.dueAmount > 0 ? "text-red-600" : "text-slate-500"
            }`}
          >
            {formatCurrency(row.dueAmount)}
          </span>
        );

      case "dateAdmitted":
        return formatDateWithTime(row.dateAdmitted);

      case "actions":
        return (
          <AdmissionRowActions
            row={row}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            isStatusUpdating={isStatusUpdating}
          />
        );

      default:
        {
          const value = row[header.key as keyof AdmissionPatientData];

          if (value === null || value === undefined || value === "") {
            return "N/A";
          }

          if (typeof value === "string" || typeof value === "number") {
            return value;
          }

          if (typeof value === "boolean") {
            return value ? "Yes" : "No";
          }

          return "N/A";
        }
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      {headers.map((header, headerIndex) => (
        <td key={header.key} className={getCellClasses(headerIndex)}>
          {renderCellContent(header)}
        </td>
      ))}
    </tr>
  );
};

export default React.memo(TableRow);
