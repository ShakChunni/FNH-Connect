import React from "react";
import { Edit2, Printer, CheckCircle, XCircle } from "lucide-react";
import { PathologyPatientData } from "../../../types";
import {
  TableHeader,
  formatPatientAmount,
  formatPatientDate,
} from "../utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  PatientStatusConfirm,
  usePatientRowActions,
} from "../usePatientRowActions";

interface TableRowProps {
  row: PathologyPatientData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: PathologyPatientData) => void;
  onPatientClick?: (patient: PathologyPatientData) => void;
}

const TableRow: React.FC<TableRowProps> = ({
  row,
  index,
  headers,
  onEdit,
  onPatientClick,
}) => {
  const {
    showStatusConfirm,
    openStatusConfirm,
    closeStatusConfirm,
    isUpdating,
    handleStatusToggle,
    handleReceipt,
  } = usePatientRowActions(row);

  const FIRST_COL_WIDTH = "w-[60px] min-w-[60px]";
  const SECOND_COL_WIDTH = "w-[100px] min-w-[100px]";
  const THIRD_COL_WIDTH = "w-[200px] min-w-[200px]";

  const getCellClasses = (headerIndex: number) => {
    const baseClasses =
      "px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 text-xs text-slate-900 whitespace-nowrap transition-colors";

    if (headerIndex === 0) {
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:z-10 lg:left-0 lg:bg-white group-hover:lg:bg-slate-50`;
    }
    if (headerIndex === 1) {
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:z-10 lg:left-[60px] lg:bg-white group-hover:lg:bg-slate-50`;
    }
    if (headerIndex === 2) {
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:z-10 lg:left-[160px] lg:bg-white group-hover:lg:bg-slate-50`;
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
            {row.guardianName && (
              <div className="text-2xs text-slate-500 leading-none mt-0.5">
                Guardian: {row.guardianName}
              </div>
            )}
          </div>
        );

      case "testNumber":
        return (
          <span className="font-mono text-fnh-navy">{row.testNumber}</span>
        );

      case "testDate":
        return formatPatientDate(row.testDate);

      case "mobileNumber":
        return row.mobileNumber || "N/A";

      case "grandTotal":
        return (
          <span className="font-semibold text-emerald-700 tabular-nums">
            {formatPatientAmount(row.grandTotal)}
          </span>
        );

      case "paidAmount":
        return (
          <span className="font-semibold text-blue-600 tabular-nums">
            {formatPatientAmount(row.paidAmount)}
          </span>
        );

      case "dueAmount":
        return (
          <span
            className={`font-semibold tabular-nums ${
              row.dueAmount > 0 ? "text-red-600" : "text-slate-500"
            }`}
          >
            {formatPatientAmount(row.dueAmount)}
          </span>
        );

      case "isCompleted":
        return (
          <StatusBadge status={row.isCompleted ? "Completed" : "Pending"} />
        );

      case "actions":
        return (
          <div className="flex items-center gap-1.5">
            {/* Edit Button */}
            <button
              type="button"
              onClick={() => onEdit?.(row)}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-fnh-navy text-white hover:bg-fnh-navy-dark transition-colors cursor-pointer shadow-sm"
              title="Edit patient"
              aria-label="Edit patient"
            >
              <Edit2 size={16} />
            </button>

            {/* Receipt Button */}
            <button
              type="button"
              onClick={handleReceipt}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer shadow-sm"
              title="Download Receipt"
              aria-label="Download receipt"
            >
              <Printer size={16} />
            </button>

            {/* Status Toggle Button */}
            <button
              type="button"
              onClick={openStatusConfirm}
              disabled={isUpdating}
              className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm ${
                row.isCompleted
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" // Currently completed
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200" // Currently pending
              }`}
              title={row.isCompleted ? "Mark as Pending" : "Mark as Completed"}
              aria-label={row.isCompleted ? "Mark as Pending" : "Mark as Completed"}
            >
              {row.isCompleted ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
            </button>
          </div>
        );

      default:
        return row[header.key as keyof PathologyPatientData] || "N/A";
    }
  };

  return (
    <>
      <tr className="group hover:bg-slate-50 transition-colors">
        {headers.map((header, headerIndex) => (
          <td key={header.key} className={getCellClasses(headerIndex)}>
            {renderCellContent(header)}
          </td>
        ))}
      </tr>

      {/* Status Change Confirmation Modal */}
      <PatientStatusConfirm
        row={row}
        isOpen={showStatusConfirm}
        isUpdating={isUpdating}
        onClose={closeStatusConfirm}
        onConfirm={handleStatusToggle}
      />
    </>
  );
};

export default React.memo(TableRow);
