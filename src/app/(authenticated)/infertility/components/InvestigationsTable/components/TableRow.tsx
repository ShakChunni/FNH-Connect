import React, { useState } from "react";
import { Edit2, Printer, CheckCircle, XCircle } from "lucide-react";
import { InfertilityTestData } from "../../../types";
import { TableHeader } from "../utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEditInfertilityTest } from "../../../hooks";
import { generateInfertilityTestReceipt } from "../../../utils/generateReceipt";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";
import { formatBDT } from "@/lib/timezone";

interface TableRowProps {
  row: InfertilityTestData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: InfertilityTestData) => void;
  onPatientClick?: (patient: InfertilityTestData) => void;
  /** "row" renders a desktop table row; "card" renders the phone card. */
  variant?: "row" | "card";
}

const TableRow: React.FC<TableRowProps> = ({
  row,
  index,
  headers,
  onEdit,
  onPatientClick,
  variant = "row",
}) => {
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  const { editPatient, isLoading } = useEditInfertilityTest();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const FIRST_COL_WIDTH = "w-[60px] min-w-[60px]";
  const SECOND_COL_WIDTH = "w-[100px] min-w-[100px]";
  const THIRD_COL_WIDTH = "w-[200px] min-w-[200px]";

  const getCellClasses = (headerIndex: number) => {
    const baseClasses =
      "px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 text-xs text-slate-900 whitespace-nowrap transition-colors";

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

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString("en-BD")}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return formatBDT(dateStr, "MMM dd, yyyy");
  };

  const handleStatusToggle = () => {
    editPatient(
      { id: row.id, isCompleted: !row.isCompleted } as InfertilityTestData,
      {
        onSuccess: () => {
          setShowStatusConfirm(false);
        },
      },
    );
  };

  const renderFallbackValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "N/A";
    }

    if (typeof value === "object") {
      if (
        "tests" in (value as Record<string, unknown>) &&
        Array.isArray((value as { tests?: unknown }).tests)
      ) {
        const tests = (value as { tests: string[] }).tests;
        return tests.length > 0 ? tests.join(", ") : "N/A";
      }

      return JSON.stringify(value);
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    return "N/A";
  };

  const calculatedDueAmount = Math.max(
    0,
    Number(row.grandTotal) - Number(row.paidAmount),
  );

  // Row actions shared by the desktop row and the phone card.
  const renderActions = () => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onEdit?.(row)}
        aria-label="Edit investigation"
        title="Edit investigation"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-fnh-blue text-white hover:bg-fnh-blue-dark transition-colors cursor-pointer"
      >
        <Edit2 size={16} />
      </button>

      <button
        type="button"
        onClick={() => {
          generateInfertilityTestReceipt(row, user?.fullName || "Staff");
          showNotification("Generating receipt document...", "success");
        }}
        aria-label="Download receipt"
        title="Download Receipt"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
      >
        <Printer size={16} />
      </button>

      {/* Status Toggle Button */}
      <button
        type="button"
        onClick={() => setShowStatusConfirm(true)}
        disabled={isLoading}
        aria-label={row.isCompleted ? "Mark as pending" : "Mark as completed"}
        title={row.isCompleted ? "Mark as Pending" : "Mark as Completed"}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
          row.isCompleted
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
        }`}
      >
        {row.isCompleted ? <CheckCircle size={16} /> : <XCircle size={16} />}
      </button>
    </div>
  );

  const renderCellContent = (header: TableHeader): React.ReactNode => {
    switch (header.key) {
      case "id":
        return <span className="font-semibold tabular-nums text-emerald-900">{index}</span>;

      case "patientFullName":
        return (
          <div
            className="font-medium cursor-pointer group/name"
            onClick={() => onPatientClick?.(row)}
          >
            <div className="text-slate-900 group-hover/name:text-emerald-700 transition-colors flex items-center gap-2">
              <span>{row.patientFullName}</span>
              <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-slate-700">
                {row.subjectLabel}
              </span>
            </div>
            {row.subjectType === "SPOUSE" ? (
              <div className="text-2xs text-slate-500 leading-none mt-0.5">
                Test for: {row.subjectName || row.guardianName || "Spouse"}
              </div>
            ) : row.guardianName ? (
              <div className="text-2xs text-slate-500 leading-none mt-0.5">
                Spouse: {row.guardianName}
              </div>
            ) : null}
          </div>
        );

      case "testNumber":
        return (
          <span className="font-mono text-emerald-900">{row.testNumber}</span>
        );

      case "testDate":
        return formatDate(row.testDate);

      case "mobileNumber":
        return <span className="tabular-nums">{row.mobileNumber || "N/A"}</span>;

      case "grandTotal":
        return (
          <span className="font-semibold text-slate-900 tabular-nums">
            {formatCurrency(row.grandTotal)}
          </span>
        );

      case "paidAmount":
        return (
          <span className="font-semibold text-emerald-700 tabular-nums">
            {formatCurrency(row.paidAmount)}
          </span>
        );

      case "dueAmount":
        return (
          <span
            className={`font-semibold tabular-nums ${
              calculatedDueAmount > 0 ? "text-red-600" : "text-slate-500"
            }`}
          >
            {formatCurrency(calculatedDueAmount)}
          </span>
        );

      case "isCompleted":
        return (
          <StatusBadge status={row.isCompleted ? "Completed" : "Pending"} />
        );

      case "actions":
        return renderActions();

      default:
        return renderFallbackValue(row[header.key as keyof InfertilityTestData]);
    }
  };

  // Phone card: same key data as the table row, same actions.
  const renderCard = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onPatientClick?.(row)}
          className="min-w-0 text-left cursor-pointer"
        >
          <span className="block text-sm font-semibold text-slate-900 truncate">
            {row.patientFullName}
          </span>
          <span className="mt-0.5 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-slate-700">
            {row.subjectLabel}
          </span>
        </button>
        <StatusBadge
          status={row.isCompleted ? "Completed" : "Pending"}
          className="shrink-0"
        />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="min-w-0">
          <dt className="text-slate-500">Test No.</dt>
          <dd className="font-mono font-medium text-emerald-900 break-all">
            {row.testNumber}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Test Date</dt>
          <dd className="font-medium text-slate-900">{formatDate(row.testDate)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Mobile</dt>
          <dd className="font-medium text-slate-900 tabular-nums break-all">
            {row.mobileNumber || "N/A"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Total</dt>
          <dd className="font-semibold text-slate-900 tabular-nums">
            {formatCurrency(row.grandTotal)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Paid</dt>
          <dd className="font-semibold text-emerald-700 tabular-nums">
            {formatCurrency(row.paidAmount)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Due</dt>
          <dd
            className={`font-semibold tabular-nums ${
              calculatedDueAmount > 0 ? "text-red-600" : "text-slate-500"
            }`}
          >
            {formatCurrency(calculatedDueAmount)}
          </dd>
        </div>
      </dl>

      {renderActions()}
    </div>
  );

  return (
    <>
      {variant === "card" ? (
        renderCard()
      ) : (
        <tr className="hover:bg-slate-50 transition-colors">
          {headers.map((header, headerIndex) => (
            <td key={header.key} className={getCellClasses(headerIndex)}>
              {renderCellContent(header)}
            </td>
          ))}
        </tr>
      )}

      {/* Status Change Confirmation Modal (portal, kept outside the row/card) */}
      <ConfirmModal
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={handleStatusToggle}
        isLoading={isLoading}
        title={row.isCompleted ? "Mark as Pending?" : "Mark as Completed?"}
        variant={row.isCompleted ? "warning" : "success"}
        confirmLabel={row.isCompleted ? "Mark Pending" : "Mark Completed"}
        cancelLabel="Cancel"
      >
        <p>
          Are you sure you want to change the status of test{" "}
          <strong>{row.testNumber}</strong> for patient{" "}
          <strong>{row.patientFullName}</strong> to{" "}
          <strong>{row.isCompleted ? "Pending" : "Completed"}</strong>?
        </p>
      </ConfirmModal>
    </>
  );
};

export default React.memo(TableRow);
