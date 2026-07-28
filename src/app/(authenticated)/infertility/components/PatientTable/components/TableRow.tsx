import React, { useState } from "react";
import { Edit2, FileText, Printer, Beaker, UserCheck, CheckCircle, XCircle } from "lucide-react";
import { InfertilityPatientData } from "../../../types";
import { TableHeader, formatDate } from "../utils";
import { generateInfertilityReport } from "../../../utils/generateReport";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useUpdateInfertilityPatientStatus } from "../../../hooks";
import { useAuth } from "@/app/AuthContext";
import InvestigationPrintDropdown from "./InvestigationPrintDropdown";

interface TableRowProps {
  row: InfertilityPatientData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: InfertilityPatientData) => void;
  onOrderInvestigation?: (patient: InfertilityPatientData) => void;
  onSetAdmitted?: (patient: InfertilityPatientData) => void;
  isStatusUpdating?: boolean;
  onClick?: () => void;
}

// Status badge colors
const getStatusColor = (status: string | null) => {
  if (!status) return "bg-gray-100 text-gray-600";
  const s = status.toLowerCase();
  if (s === "active" || s === "ongoing")
    return "bg-emerald-100 text-emerald-700";
  if (s === "admitted") return "bg-indigo-100 text-indigo-700";
  if (s === "investigation ordered") return "bg-cyan-100 text-cyan-700";
  if (s === "follow-up") return "bg-violet-100 text-violet-700";
  if (s === "completed" || s === "success") return "bg-blue-100 text-blue-700";
  if (s === "pending") return "bg-amber-100 text-amber-700";
  if (s === "cancelled" || s === "inactive") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
};

const TableRow: React.FC<TableRowProps> = ({
  row,
  index,
  headers,
  onEdit,
  onOrderInvestigation,
  onSetAdmitted,
  isStatusUpdating = false,
  onClick,
}) => {
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const { updateStatus, isUpdating } = useUpdateInfertilityPatientStatus();
  const { user } = useAuth();

  const FIRST_COL_WIDTH = "w-[60px] min-w-[60px]";
  const SECOND_COL_WIDTH = "w-[120px] min-w-[120px]";
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
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:z-10 lg:left-[180px] lg:bg-gray-50/95 group-hover:lg:bg-gray-100`;
    }
    return baseClasses;
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    generateInfertilityReport(row, user?.fullName || "Staff");
  };

  const isCompleted = row.status?.toLowerCase() === "completed";
  const hasTests = (row.testCount ?? 0) > 0;

  const handleStatusToggle = () => {
    const newStatus = isCompleted ? "Active" : "Completed";
    updateStatus(
      { id: row.id, status: newStatus },
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
        return <span className="font-semibold text-emerald-900">{index}</span>;

      case "actions": {
        const isAlreadyAdmitted = row.status?.toLowerCase() === "admitted";

        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(row);
              }}
              className="p-1.5 bg-emerald-900 text-white rounded-lg hover:bg-emerald-950 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Edit patient"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Print Case Report"
            >
              <FileText size={16} />
            </button>
            <InvestigationPrintDropdown
              patientId={row.id}
              testCount={row.testCount}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOrderInvestigation?.(row);
              }}
              className="p-1.5 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Order Investigation"
            >
              <Beaker size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isAlreadyAdmitted) {
                  onSetAdmitted?.(row);
                }
              }}
              disabled={isAlreadyAdmitted || isStatusUpdating}
              className={`p-1.5 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 ${
                isAlreadyAdmitted
                  ? "bg-indigo-100 text-indigo-700 cursor-not-allowed"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer"
              } ${isStatusUpdating ? "opacity-60" : ""}`}
              title={isAlreadyAdmitted ? "Already Admitted" : "Mark as Admitted"}
            >
              <UserCheck size={16} />
            </button>

            {/* Status Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasTests) {
                  setShowStatusConfirm(true);
                }
              }}
              disabled={!hasTests || isUpdating}
              className={`p-1.5 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 ${
                isCompleted
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
              } ${!hasTests || isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={
                !hasTests
                  ? "No investigations to complete"
                  : isCompleted
                  ? "Mark as Active"
                  : "Mark as Completed"
              }
            >
              {isCompleted ? (
                <CheckCircle size={16} />
              ) : (
                <XCircle size={16} />
              )}
            </button>
          </div>
        );
      }

      case "patientFullName":
        return (
          <div
            className="font-medium cursor-pointer group/name"
            onClick={onClick}
          >
            <div className="text-gray-900 group-hover/name:text-emerald-600 transition-colors flex items-center gap-2">
              {row.patientFullName}
            </div>
            <div className="text-[10px] text-gray-500 leading-none mt-0.5">
              {row.patientGender || "Female"}{" "}
              {row.patientAge ? `, ${row.patientAge}y` : ""}
              {row.bloodGroup ? ` • ${row.bloodGroup}` : ""}
            </div>
            {(row.testCount ?? 0) > 0 ? (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                <Beaker size={10} />
                {row.testCount} {row.testCount === 1 ? "investigation" : "investigations"}
              </div>
            ) : null}
          </div>
        );

      case "hospitalName":
        return (
          <div>
            <span className="text-gray-700">
              {row.hospitalName || "Self / Direct"}
            </span>
            {row.hospitalType && (
              <div className="text-[10px] text-gray-400">
                {row.hospitalType}
              </div>
            )}
          </div>
        );

      case "husbandName":
        return (
          <div>
            <div className="text-gray-700">{row.husbandName || "Not recorded"}</div>
            {row.husbandAge && (
              <div className="text-[10px] text-gray-500">{row.husbandAge}y</div>
            )}
          </div>
        );

      case "mobileNumber":
        return (
          <div>
            <div className="text-gray-700">{row.mobileNumber || "N/A"}</div>
          </div>
        );

      case "infertilityType":
        return row.infertilityType ? (
          <span
            className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
              row.infertilityType.toLowerCase() === "primary"
                ? "bg-purple-100 text-purple-800"
                : "bg-indigo-100 text-indigo-800"
            }`}
          >
            {row.infertilityType}
          </span>
        ) : (
          <span className="text-gray-400">N/A</span>
        );

      case "paraGravida":
        return row.para || row.gravida ? (
          <div className="text-gray-700">
            <span>P{row.para || "0"}</span>
            <span className="text-gray-400 mx-0.5">/</span>
            <span>G{row.gravida || "0"}</span>
          </div>
        ) : (
          <span className="text-gray-400">N/A</span>
        );

      case "yearsMarried":
        return row.yearsMarried ? (
          <span className="text-gray-700">{row.yearsMarried}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        );

      case "yearsTrying":
        return row.yearsTrying ? (
          <span className="text-gray-700">{row.yearsTrying}</span>
        ) : (
          <span className="text-gray-400">N/A</span>
        );

      case "status":
        return row.status ? (
          <span
            className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-md ${getStatusColor(
              row.status
            )}`}
          >
            {row.status}
          </span>
        ) : (
          <span className="text-gray-400">N/A</span>
        );

      case "nextAppointment":
        return row.nextAppointment ? (
          <div className="text-gray-700">
            <div>{formatDate(row.nextAppointment)}</div>
          </div>
        ) : (
          <span className="text-gray-400">Not Set</span>
        );

      case "createdAt":
        return (
          <div className="text-gray-600 text-[11px]">
            {formatDate(row.createdAt)}
          </div>
        );

      case "updatedAt":
        return (
          <div className="text-gray-600 text-[11px]">
            {formatDate(row.updatedAt)}
          </div>
        );

      default: {
        const value = row[header.key as keyof InfertilityPatientData];
        return typeof value === "string" || typeof value === "number"
          ? value || "N/A"
          : "N/A";
      }
    }
  };

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors cursor-pointer group"
        onClick={onClick}
      >
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
        title={isCompleted ? "Mark as Active?" : "Mark as Completed?"}
        variant={isCompleted ? "warning" : "success"}
        confirmLabel={isCompleted ? "Mark Active" : "Mark Completed"}
        cancelLabel="Cancel"
      >
        <p>
          Are you sure you want to change the status of patient{" "}
          <strong>{row.patientFullName}</strong>{" "}
          to <strong>{isCompleted ? "Active" : "Completed"}</strong>?
        </p>
      </ConfirmModal>
    </>
  );
};

export default React.memo(TableRow);
