import React, { useState } from "react";
import { Edit2, FileText, Printer, Beaker, UserCheck, CheckCircle, XCircle } from "lucide-react";
import { InfertilityPatientData } from "../../../types";
import { TableHeader, formatDate } from "../utils";
import { generateInfertilityReport } from "../../../utils/generateReport";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
  /** "row" renders a desktop table row; "card" renders the phone card. */
  variant?: "row" | "card";
}

const TableRow: React.FC<TableRowProps> = ({
  row,
  index,
  headers,
  onEdit,
  onOrderInvestigation,
  onSetAdmitted,
  isStatusUpdating = false,
  onClick,
  variant = "row",
}) => {
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const { updateStatus, isUpdating } = useUpdateInfertilityPatientStatus();
  const { user } = useAuth();

  const FIRST_COL_WIDTH = "w-[60px] min-w-[60px]";
  const SECOND_COL_WIDTH = "w-[120px] min-w-[120px]";
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
      return `${baseClasses} ${THIRD_COL_WIDTH} lg:sticky lg:z-10 lg:left-[180px] lg:bg-slate-50/95 group-hover:lg:bg-slate-100`;
    }
    return baseClasses;
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    generateInfertilityReport(row, user?.fullName || "Staff");
  };

  const isCompleted = row.status?.toLowerCase() === "completed";
  const isAlreadyAdmitted = row.status?.toLowerCase() === "admitted";
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

  // Row actions shared by the desktop row and the phone card.
  const renderActions = () => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(row);
        }}
        aria-label="Edit patient"
        title="Edit patient"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-fnh-blue text-white hover:bg-fnh-blue-dark transition-colors cursor-pointer"
      >
        <Edit2 size={16} />
      </button>
      <button
        type="button"
        onClick={handlePrint}
        aria-label="Print case report"
        title="Print Case Report"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
      >
        <FileText size={16} />
      </button>
      <InvestigationPrintDropdown patientId={row.id} testCount={row.testCount} />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOrderInvestigation?.(row);
        }}
        aria-label="Order investigation"
        title="Order Investigation"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors cursor-pointer"
      >
        <Beaker size={16} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isAlreadyAdmitted) {
            onSetAdmitted?.(row);
          }
        }}
        disabled={isAlreadyAdmitted || isStatusUpdating}
        aria-label={isAlreadyAdmitted ? "Already admitted" : "Mark as admitted"}
        title={isAlreadyAdmitted ? "Already Admitted" : "Mark as Admitted"}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          isAlreadyAdmitted
            ? "bg-blue-100 text-blue-700 cursor-not-allowed"
            : "bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
        } ${isStatusUpdating ? "opacity-60" : ""}`}
      >
        <UserCheck size={16} />
      </button>

      {/* Status Toggle Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (hasTests) {
            setShowStatusConfirm(true);
          }
        }}
        disabled={!hasTests || isUpdating}
        aria-label={
          !hasTests
            ? "No investigations to complete"
            : isCompleted
            ? "Mark as Active"
            : "Mark as Completed"
        }
        title={
          !hasTests
            ? "No investigations to complete"
            : isCompleted
            ? "Mark as Active"
            : "Mark as Completed"
        }
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          isCompleted
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
        } ${!hasTests || isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {isCompleted ? <CheckCircle size={16} /> : <XCircle size={16} />}
      </button>
    </div>
  );

  const renderCellContent = (header: TableHeader) => {
    switch (header.key) {
      case "id":
        return <span className="font-semibold tabular-nums text-emerald-900">{index}</span>;

      case "actions":
        return renderActions();

      case "patientFullName":
        return (
          <div
            className="font-medium cursor-pointer group/name"
            onClick={onClick}
          >
            <div className="text-slate-900 group-hover/name:text-emerald-700 transition-colors flex items-center gap-2">
              {row.patientFullName}
            </div>
            <div className="text-2xs text-slate-500 leading-none mt-0.5">
              {row.patientGender || "Female"}{" "}
              {row.patientAge ? `, ${row.patientAge}y` : ""}
              {row.bloodGroup ? ` • ${row.bloodGroup}` : ""}
            </div>
            {(row.testCount ?? 0) > 0 ? (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-2xs font-semibold text-emerald-700">
                <Beaker size={10} />
                {row.testCount} {row.testCount === 1 ? "investigation" : "investigations"}
              </div>
            ) : null}
          </div>
        );

      case "hospitalName":
        return (
          <div>
            <span className="text-slate-700">
              {row.hospitalName || "Self / Direct"}
            </span>
            {row.hospitalType && (
              <div className="text-2xs text-slate-500">
                {row.hospitalType}
              </div>
            )}
          </div>
        );

      case "husbandName":
        return (
          <div>
            <div className="text-slate-700">{row.husbandName || "Not recorded"}</div>
            {row.husbandAge && (
              <div className="text-2xs text-slate-500">{row.husbandAge}y</div>
            )}
          </div>
        );

      case "mobileNumber":
        return (
          <div>
            <div className="text-slate-700 tabular-nums">{row.mobileNumber || "N/A"}</div>
          </div>
        );

      case "infertilityType":
        return row.infertilityType ? (
          <span className="inline-flex px-2 py-0.5 text-2xs font-bold uppercase tracking-wider rounded-md bg-slate-100 text-slate-700">
            {row.infertilityType}
          </span>
        ) : (
          <span className="text-slate-500">N/A</span>
        );

      case "paraGravida":
        return row.para || row.gravida ? (
          <div className="text-slate-700">
            <span>P{row.para || "0"}</span>
            <span className="text-slate-400 mx-0.5">/</span>
            <span>G{row.gravida || "0"}</span>
          </div>
        ) : (
          <span className="text-slate-500">N/A</span>
        );

      case "yearsMarried":
        return row.yearsMarried ? (
          <span className="text-slate-700">{row.yearsMarried}</span>
        ) : (
          <span className="text-slate-500">N/A</span>
        );

      case "yearsTrying":
        return row.yearsTrying ? (
          <span className="text-slate-700">{row.yearsTrying}</span>
        ) : (
          <span className="text-slate-500">N/A</span>
        );

      case "status":
        return row.status ? (
          <StatusBadge status={row.status} />
        ) : (
          <span className="text-slate-500">N/A</span>
        );

      case "nextAppointment":
        return row.nextAppointment ? (
          <div className="text-slate-700">
            <div>{formatDate(row.nextAppointment)}</div>
          </div>
        ) : (
          <span className="text-slate-500">Not Set</span>
        );

      case "createdAt":
        return (
          <div className="text-slate-600 text-2xs">
            {formatDate(row.createdAt)}
          </div>
        );

      case "updatedAt":
        return (
          <div className="text-slate-600 text-2xs">
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

  // Phone card: same key data as the table row, same actions.
  const renderCard = () => (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onClick}
          className="min-w-0 text-left cursor-pointer"
        >
          <span className="block text-sm font-semibold text-slate-900 truncate">
            {row.patientFullName}
          </span>
          <span className="block text-xs text-slate-500">
            {row.patientGender || "Female"}
            {row.patientAge ? `, ${row.patientAge}y` : ""}
            {row.bloodGroup ? ` • ${row.bloodGroup}` : ""}
          </span>
          {hasTests ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-2xs font-semibold text-emerald-700">
              <Beaker size={10} />
              {row.testCount} {row.testCount === 1 ? "investigation" : "investigations"}
            </span>
          ) : null}
        </button>
        {row.status ? (
          <StatusBadge status={row.status} className="shrink-0" />
        ) : (
          <span className="text-xs text-slate-500 shrink-0">N/A</span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="min-w-0">
          <dt className="text-slate-500">Phone</dt>
          <dd className="font-medium text-slate-900 tabular-nums break-all">
            {row.mobileNumber || "N/A"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Husband / Partner</dt>
          <dd className="font-medium text-slate-900 truncate">
            {row.husbandName || "Not recorded"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Hospital</dt>
          <dd className="font-medium text-slate-900 truncate">
            {row.hospitalName || "Self / Direct"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Type</dt>
          <dd className="font-medium text-slate-900">{row.infertilityType || "N/A"}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Next Appt</dt>
          <dd className="font-medium text-slate-900">
            {row.nextAppointment ? formatDate(row.nextAppointment) : "Not Set"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-slate-500">Joined</dt>
          <dd className="font-medium text-slate-900">{formatDate(row.createdAt)}</dd>
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
        <tr
          className="hover:bg-slate-50 transition-colors cursor-pointer group"
          onClick={onClick}
        >
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
