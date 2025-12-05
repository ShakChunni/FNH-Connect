import React from "react";
import { Edit2 } from "lucide-react";
import { InfertilityPatientData } from "../../../types";
import { formatDate, TableHeader } from "../utils/tableUtils";

interface TableRowProps {
  row: InfertilityPatientData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: InfertilityPatientData) => void;
}

// Pinned column styles - darker background on md+ screens
const pinnedBaseStyles = "sticky z-20 bg-slate-50 md:bg-slate-100/80";

// Position for first pinned column
const firstPinnedStyles = `${pinnedBaseStyles} left-0`;

// Position for second pinned column (offset by first column width)
const secondPinnedStyles = `${pinnedBaseStyles} left-[70px] sm:left-[80px] md:left-[90px]`;

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
      case "alc":
        return row.alc;
      case "weight":
        return row.weight;
      case "bp":
        return row.bp;
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

  return (
    <tr className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-200">
      {headers.map((header, colIndex) => {
        const value = getValue(header.key);
        const isFirstPinned = colIndex === 0;
        const isSecondPinned = colIndex === 1;

        // Responsive text and padding classes
        const cellClasses = `
          px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3.5
          text-[10px] sm:text-xs md:text-sm
          text-gray-700
          whitespace-nowrap
          ${isFirstPinned ? firstPinnedStyles : ""}
          ${isSecondPinned ? secondPinnedStyles : ""}
          ${header.key === "patientFullName" ? "font-medium text-gray-900" : ""}
          ${
            header.key === "address" || header.key === "notes"
              ? "max-w-[120px] sm:max-w-[150px] md:max-w-xs truncate"
              : ""
          }
        `;

        // Special rendering for # column (includes edit button)
        if (header.key === "id") {
          return (
            <td key={header.key} className={cellClasses}>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-medium text-gray-700 min-w-[20px] sm:min-w-[24px]">
                  {index}
                </span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(row)}
                    className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 transition-colors duration-150 cursor-pointer"
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

        // Regular cell rendering
        return (
          <td key={header.key} className={cellClasses}>
            {value ?? "-"}
          </td>
        );
      })}
    </tr>
  );
};

export default TableRow;
