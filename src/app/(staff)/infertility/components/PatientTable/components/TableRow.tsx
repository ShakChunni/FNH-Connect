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
  const FIRST_COL_WIDTH = "w-[120px] min-w-[120px]";
  const SECOND_COL_WIDTH = "w-[180px] min-w-[180px]";

  const getCellClasses = (headerIndex: number) => {
    const baseClasses =
      "px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap";

    if (headerIndex === 0) {
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:z-10 lg:left-0 lg:bg-white group-hover:lg:bg-gray-50`;
    }
    if (headerIndex === 1) {
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:z-10 lg:left-[120px] lg:bg-white group-hover:lg:bg-gray-50`;
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
              <Edit2 size={14} />
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              title="Print Report"
            >
              <Printer size={14} />
            </button>
            <span className="font-semibold text-fnh-navy ml-1">{index}</span>
          </div>
        );

      case "patientFullName":
        return (
          <div className="font-medium">
            <div className="text-gray-900">{row.patientFullName}</div>
            {row.mobileNumber && (
              <div className="text-xs text-gray-500">{row.mobileNumber}</div>
            )}
          </div>
        );

      case "hospitalName":
        return (
          <span className="text-gray-700">{row.hospitalName || "N/A"}</span>
        );

      case "patientAge":
        return row.patientAge ?? "N/A";

      case "patientDOB":
        return formatDate(row.patientDOB);

      case "husbandName":
        return row.husbandName || "N/A";

      case "husbandAge":
        return row.husbandAge ?? "N/A";

      case "husbandDOB":
        return formatDate(row.husbandDOB);

      case "mobileNumber":
        return row.mobileNumber || "N/A";

      case "address":
        return (
          <span
            className="max-w-[150px] truncate block"
            title={row.address || undefined}
          >
            {row.address || "N/A"}
          </span>
        );

      case "yearsMarried":
        return row.yearsMarried ?? "N/A";

      case "yearsTrying":
        return row.yearsTrying ?? "N/A";

      case "para":
        return row.para || "N/A";

      case "gravida":
        return row.gravida || "N/A";

      case "weight":
        return row.weight ? `${row.weight} kg` : "N/A";

      case "bloodPressure":
        return row.bloodPressure || "N/A";

      case "infertilityType":
        return row.infertilityType ? (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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

      case "notes":
        return (
          <span
            className="max-w-[150px] truncate block"
            title={row.notes || undefined}
          >
            {row.notes || "N/A"}
          </span>
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
