import React from "react";
import { Edit2, Phone, MapPin, Calendar, Heart } from "lucide-react";
import { InfertilityPatientData } from "../../../types";
import { formatDate, TableHeader } from "../utils/tableUtils";

interface TableRowProps {
  row: InfertilityPatientData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: InfertilityPatientData) => void;
}

// Fixed widths for pinned columns - must match header widths
const FIRST_COL_WIDTH = "w-[90px] min-w-[90px]";
const SECOND_COL_WIDTH = "w-[180px] min-w-[180px]";

// Pinned column styles - only on lg+ screens with slate bg
const firstPinnedStyles = `lg:sticky lg:z-10 lg:left-0 lg:bg-slate-100 ${FIRST_COL_WIDTH}`;
const secondPinnedStyles = `lg:sticky lg:z-10 lg:left-[90px] lg:bg-slate-100 ${SECOND_COL_WIDTH}`;

const TableRow: React.FC<TableRowProps> = ({ row, index, headers, onEdit }) => {
  // Get value for a header key
  const getValue = (key: string): string | number | null => {
    switch (key) {
      case "id":
        return index;
      case "patientFullName":
        return row.patientFullName;
      case "hospitalName":
        return row.hospitalName;
      case "patientAge":
        return row.patientAge;
      case "patientDOB":
        return formatDate(row.patientDOB);
      case "husbandName":
        return row.husbandName;
      case "husbandAge":
        return row.husbandAge;
      case "husbandDOB":
        return formatDate(row.husbandDOB);
      case "mobileNumber":
        return row.mobileNumber;
      case "address":
        return row.address;
      case "yearsMarried":
        return row.yearsMarried;
      case "yearsTrying":
        return row.yearsTrying;
      case "para":
        return row.para;
      case "gravida":
        return row.gravida;
      case "weight":
        return row.weight;
      case "bloodPressure":
        return row.bloodPressure;
      case "infertilityType":
        return row.infertilityType;
      case "notes":
        return row.notes;
      case "createdAt":
        return formatDate(row.createdAt);
      case "updatedAt":
        return formatDate(row.updatedAt);
      default:
        return null;
    }
  };

  // Render cell content with styling based on field type
  const renderCellContent = (
    header: TableHeader,
    value: string | number | null
  ) => {
    if (value === null || value === "")
      return <span className="text-gray-400">—</span>;

    switch (header.key) {
      case "mobileNumber":
        return (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{value}</span>
          </div>
        );

      case "address":
        return (
          <div
            className="flex items-center gap-1.5 max-w-[150px]"
            title={String(value)}
          >
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{value}</span>
          </div>
        );

      case "patientDOB":
      case "husbandDOB":
      case "createdAt":
      case "updatedAt":
        return (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{value}</span>
          </div>
        );

      case "infertilityType":
        const typeColor =
          value === "Primary"
            ? "bg-purple-100 text-purple-700"
            : "bg-amber-100 text-amber-700";
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${typeColor}`}
          >
            {value}
          </span>
        );

      case "patientAge":
      case "husbandAge":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700">
            {value} yrs
          </span>
        );

      case "yearsMarried":
      case "yearsTrying":
        return (
          <span className="inline-flex items-center gap-1 text-gray-600">
            <Heart className="w-3 h-3 text-pink-400" />
            {value}
          </span>
        );

      case "weight":
        return value ? (
          <span>{value} kg</span>
        ) : (
          <span className="text-gray-400">—</span>
        );

      case "bloodPressure":
        return value ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-red-50 text-red-700">
            {value}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        );

      case "hospitalName":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-medium bg-fnh-navy/10 text-fnh-navy-dark">
            {value}
          </span>
        );

      default:
        return value;
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 group">
      {headers.map((header, colIndex) => {
        const value = getValue(header.key);
        const isFirstPinned = colIndex === 0;
        const isSecondPinned = colIndex === 1;

        // Base cell classes
        const cellClasses = `
          px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3.5
          text-[10px] sm:text-xs md:text-sm
          text-gray-700
          whitespace-nowrap
          ${isFirstPinned ? firstPinnedStyles : ""}
          ${isSecondPinned ? secondPinnedStyles : ""}
          ${isFirstPinned || isSecondPinned ? "group-hover:bg-gray-50" : ""}
          ${
            header.key === "patientFullName"
              ? "font-semibold text-fnh-navy-dark"
              : ""
          }
          ${
            header.key === "notes"
              ? "max-w-[120px] sm:max-w-[150px] md:max-w-xs truncate"
              : ""
          }
        `;

        // Special rendering for # column (includes edit button)
        if (header.key === "id") {
          return (
            <td key={header.key} className={cellClasses}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-medium text-gray-500 min-w-[20px] sm:min-w-[24px] text-center">
                  {index}
                </span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(row)}
                    className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-fnh-blue/10 text-fnh-blue hover:bg-fnh-blue hover:text-white transition-colors duration-150 cursor-pointer"
                    title="Edit patient"
                    aria-label={`Edit ${row.patientFullName}`}
                  >
                    <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  </button>
                )}
              </div>
            </td>
          );
        }

        // Regular cell rendering with styled content
        return (
          <td key={header.key} className={cellClasses}>
            {renderCellContent(header, value)}
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
