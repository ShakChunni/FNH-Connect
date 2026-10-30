import React from "react";
import { Edit2, Printer, CheckCircle, XCircle } from "lucide-react";
import { PathologyPatientData } from "../../../types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPatientAmount, formatPatientDate } from "../utils";
import {
  PatientStatusConfirm,
  usePatientRowActions,
} from "../usePatientRowActions";

interface PatientCardProps {
  row: PathologyPatientData;
  index: number;
  onEdit?: (patient: PathologyPatientData) => void;
  onPatientClick?: (patient: PathologyPatientData) => void;
}

/**
 * Phone layout for one pathology patient. Shows the same columns as the
 * desktop table and uses the same row actions (edit, receipt, status toggle).
 */
const PatientCard: React.FC<PatientCardProps> = ({
  row,
  index,
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

  return (
    <>
      <article className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xs font-semibold text-slate-500 tabular-nums">
              #{index}
            </p>
            <button
              type="button"
              onClick={() => onPatientClick?.(row)}
              className="block w-full max-w-full text-left text-sm font-semibold text-slate-900 truncate hover:text-fnh-blue transition-colors cursor-pointer"
            >
              {row.patientFullName}
            </button>
            {row.guardianName && (
              <p className="text-xs text-slate-500 truncate">
                Guardian: {row.guardianName}
              </p>
            )}
          </div>
          <StatusBadge
            status={row.isCompleted ? "Completed" : "Pending"}
            className="shrink-0"
          />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div className="min-w-0">
            <dt className="font-medium text-slate-500">Test Number</dt>
            <dd className="font-mono text-fnh-navy truncate">
              {row.testNumber}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-slate-500">Test Date</dt>
            <dd className="text-slate-900">{formatPatientDate(row.testDate)}</dd>
          </div>
          <div className="min-w-0 col-span-2">
            <dt className="font-medium text-slate-500">Mobile</dt>
            <dd className="text-slate-900">{row.mobileNumber || "N/A"}</dd>
          </div>
        </dl>

        <dl className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          <div className="min-w-0">
            <dt className="font-medium text-slate-500">Total (BDT)</dt>
            <dd className="mt-0.5 font-semibold text-emerald-700 tabular-nums truncate">
              {formatPatientAmount(row.grandTotal)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-slate-500">Paid (BDT)</dt>
            <dd className="mt-0.5 font-semibold text-blue-600 tabular-nums truncate">
              {formatPatientAmount(row.paidAmount)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-medium text-slate-500">Due (BDT)</dt>
            <dd
              className={`mt-0.5 font-semibold tabular-nums truncate ${
                row.dueAmount > 0 ? "text-red-600" : "text-slate-500"
              }`}
            >
              {formatPatientAmount(row.dueAmount)}
            </dd>
          </div>
        </dl>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(row)}
            className="h-9 flex items-center justify-center gap-1.5 rounded-lg bg-fnh-navy text-white text-xs font-semibold hover:bg-fnh-navy-dark transition-colors cursor-pointer"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={handleReceipt}
            className="h-9 flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer size={14} />
            Receipt
          </button>
          <button
            type="button"
            onClick={openStatusConfirm}
            disabled={isUpdating}
            className={`col-span-2 h-9 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
              row.isCompleted
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
            }`}
          >
            {row.isCompleted ? (
              <CheckCircle size={14} />
            ) : (
              <XCircle size={14} />
            )}
            {row.isCompleted ? "Mark Pending" : "Mark Completed"}
          </button>
        </div>
      </article>

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

export default React.memo(PatientCard);
