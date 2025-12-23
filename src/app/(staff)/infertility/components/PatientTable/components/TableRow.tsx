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
            </div>
          </div>
        );

      case "hospitalName":
        return (
          <span className="text-gray-700">
            {row.hospitalName || "Self / Direct"}
          </span>
        );

      case "patientAge":
        return row.patientAge ?? "N/A";

      case "patientDOB":
        return formatDate(row.patientDOB);

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
        return row.mobileNumber || "N/A";

      case "address":
        return (
          <span
            className="max-w-[150px] truncate block text-[11px]"
            title={row.address || undefined}
          >
            {row.address || "N/A"}
          </span>
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
          "N/A"
        );

      case "createdAt":
        return formatDate(row.createdAt);

      case "updatedAt":
        return formatDate(row.updatedAt);

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
