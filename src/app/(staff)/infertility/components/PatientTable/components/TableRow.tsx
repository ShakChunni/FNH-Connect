import React from "react";
import { Edit2, Printer } from "lucide-react";
import { InfertilityPatientData } from "../../../types";
import { TableHeader, formatDate } from "../utils";
import { generateInfertilityReport } from "../../../utils/generateReport";
import { useAuth } from "@/app/AuthContext";

interface TableRowProps {
  row: InfertilityPatientData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: InfertilityPatientData) => void;
  onClick?: () => void;
}

// Status badge colors
const getStatusColor = (status: string | null) => {
  if (!status) return "bg-gray-100 text-gray-600";
  const s = status.toLowerCase();
  if (s === "active" || s === "ongoing")
    return "bg-emerald-100 text-emerald-700";
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
  onClick,
}) => {
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

  const renderCellContent = (header: TableHeader) => {
    switch (header.key) {
      case "id":
        return <span className="font-semibold text-fnh-navy">{index}</span>;

      case "actions":
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(row);
              }}
              className="p-1.5 bg-fnh-navy text-white rounded-lg hover:bg-fnh-navy-dark transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Edit patient"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Print Report"
            >
              <Printer size={16} />
            </button>
          </div>
        );

      case "patientFullName":
        return (
          <div
            className="font-medium cursor-pointer group/name"
            onClick={onClick}
          >
            <div className="text-gray-900 group-hover/name:text-fnh-blue transition-colors flex items-center gap-2">
              {row.patientFullName}
            </div>
            <div className="text-[10px] text-gray-500 leading-none mt-0.5">
              {row.patientGender || "Female"}{" "}
              {row.patientAge ? `, ${row.patientAge}y` : ""}
              {row.bloodGroup ? ` • ${row.bloodGroup}` : ""}
            </div>
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
            <div className="text-gray-700">{row.husbandName || "N/A"}</div>
            {row.husbandAge && (
              <div className="text-[10px] text-gray-500">{row.husbandAge}y</div>
            )}
          </div>
        );

      case "mobileNumber":
        return (
          <div>
            <div className="text-gray-700">{row.mobileNumber || "N/A"}</div>
            {row.email && (
              <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
                {row.email}
              </div>
            )}
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

      default:
        return row[header.key as keyof InfertilityPatientData] || "N/A";
    }
  };

  return (
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
  );
};

export default React.memo(TableRow);
