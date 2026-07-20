import React, { useState } from "react";
import { Edit2, Printer, CheckCircle, XCircle } from "lucide-react";
import { InfertilityTestData } from "../../../types";
import { TableHeader } from "../utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
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
}

const TableRow: React.FC<TableRowProps> = ({
  row,
  index,
  headers,
  onEdit,
  onPatientClick,
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

  const renderCellContent = (header: TableHeader): React.ReactNode => {
    switch (header.key) {
      case "id":
        return <span className="font-semibold text-emerald-900">{index}</span>;

      case "patientFullName":
        return (
          <div
            className="font-medium cursor-pointer group/name"
            onClick={() => onPatientClick?.(row)}
          >
            <div className="text-gray-900 group-hover/name:text-emerald-600 transition-colors flex items-center gap-2">
              <span>{row.patientFullName}</span>
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  row.subjectType === "SPOUSE"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {row.subjectLabel}
              </span>
            </div>
            {row.subjectType === "SPOUSE" ? (
              <div className="text-[10px] text-gray-500 leading-none mt-0.5">
                Test for: {row.subjectName || row.guardianName || "Spouse"}
              </div>
            ) : row.guardianName ? (
              <div className="text-[10px] text-gray-500 leading-none mt-0.5">
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
        return row.mobileNumber || "N/A";

      case "grandTotal":
        return (
          <span className="font-semibold text-green-600">
            {formatCurrency(row.grandTotal)}
          </span>
        );

      case "paidAmount":
        return (
          <span className="font-semibold text-blue-600">
            {formatCurrency(row.paidAmount)}
          </span>
        );

      case "dueAmount":
        {
          const calculatedDueAmount = Math.max(
            0,
            Number(row.grandTotal) - Number(row.paidAmount),
          );

          return (
            <span
              className={`font-semibold ${
                calculatedDueAmount > 0 ? "text-red-600" : "text-gray-400"
              }`}
            >
              {formatCurrency(calculatedDueAmount)}
            </span>
          );
        }

      case "isCompleted":
        return (
          <span
            className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
              row.isCompleted
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {row.isCompleted ? "Completed" : "Pending"}
          </span>
        );

      case "actions":
        return (
          <div className="flex items-center gap-1.5">
            {/* Edit Button */}
            <button
              onClick={() => onEdit?.(row)}
              className="p-1.5 bg-emerald-900 text-white rounded-lg hover:bg-emerald-950 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Edit patient"
            >
              <Edit2 size={16} />
            </button>

            {/* Receipt Button */}
            <button
              onClick={() => {
                generateInfertilityTestReceipt(row, user?.fullName || "Staff");
                showNotification("Generating receipt document...", "success");
              }}
              className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Download Receipt"
            >
              <Printer size={16} />
            </button>

            {/* Status Toggle Button */}
            <button
              onClick={() => setShowStatusConfirm(true)}
              disabled={isLoading}
              className={`p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-sm hover:shadow-md active:scale-95 ${
                row.isCompleted
                  ? "bg-green-100 text-green-700 hover:bg-green-200" // Currently completed
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200" // Currently pending
              }`}
              title={row.isCompleted ? "Mark as Pending" : "Mark as Completed"}
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
        return renderFallbackValue(row[header.key as keyof InfertilityTestData]);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        {headers.map((header, headerIndex) => (
          <td key={header.key} className={getCellClasses(headerIndex)}>
            {renderCellContent(header)}
          </td>
        ))}
      </tr>

      {/* Status Change Confirmation Modal */}
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
