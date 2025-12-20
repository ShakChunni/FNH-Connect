import React, { useState } from "react";
import { Edit2, CheckCircle, Clock } from "lucide-react";
import { PathologyPatientData } from "../../../types";
import { TableHeader } from "../utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useUpdatePathologyStatus } from "../../../hooks";

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
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  // Use the hook directly instead of props
  const { updateStatus, isUpdating } = useUpdatePathologyStatus();

  const FIRST_COL_WIDTH = "w-[60px] min-w-[60px]";
  const SECOND_COL_WIDTH = "w-[100px] min-w-[100px]";
  const THIRD_COL_WIDTH = "w-[200px] min-w-[200px]";

  const getCellClasses = (headerIndex: number) => {
    const baseClasses =
      "px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap transition-colors";

    if (headerIndex === 0) {
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:z-10 lg:left-0 lg:bg-white`;
    }
    if (headerIndex === 1) {
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:z-10 lg:left-[60px] lg:bg-white`;
    }
    if (headerIndex === 2) {
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:z-10 lg:left-[160px] lg:bg-white`;
    }
    return baseClasses;
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString("en-BD")}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-BD");
  };

  const handleStatusToggle = () => {
    updateStatus(
      { id: row.id, isCompleted: !row.isCompleted },
      {
        onSuccess: () => {
          setShowStatusConfirm(false);
        },
      }
    );
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
            {row.guardianName && (
              <div className="text-xs text-gray-500">
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
        return (
          <span
            className={`font-semibold ${
              row.dueAmount > 0 ? "text-red-600" : "text-gray-400"
            }`}
          >
            {formatCurrency(row.dueAmount)}
          </span>
        );

      case "isCompleted":
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
              className="p-1.5 bg-fnh-navy text-white rounded-lg hover:bg-fnh-navy-dark transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Edit patient"
            >
              <Edit2 size={16} />
            </button>

            {/* Status Toggle Button */}
            <button
              onClick={() => setShowStatusConfirm(true)}
              disabled={isUpdating}
              className={`p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-sm hover:shadow-md active:scale-95 ${
                row.isCompleted
                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
              title={row.isCompleted ? "Mark as Pending" : "Mark as Completed"}
            >
              {row.isCompleted ? (
                <Clock size={16} />
              ) : (
                <CheckCircle size={16} />
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
        isLoading={isUpdating}
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
