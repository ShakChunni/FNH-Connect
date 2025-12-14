import React from "react";
import { Edit2 } from "lucide-react";
import { PathologyPatientData } from "../../../types";
import { TableHeader } from "../utils";

interface TableRowProps {
  row: PathologyPatientData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: PathologyPatientData) => void;
}

const TableRow: React.FC<TableRowProps> = ({ row, index, headers, onEdit }) => {
  const FIRST_COL_WIDTH = "w-[90px] min-w-[90px]";
  const SECOND_COL_WIDTH = "w-[180px] min-w-[180px]";

  const getCellClasses = (headerIndex: number) => {
    const baseClasses =
      "px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 text-xs sm:text-sm text-gray-900 whitespace-nowrap";

    if (headerIndex === 0) {
      return `${baseClasses} ${FIRST_COL_WIDTH} lg:sticky lg:z-10 lg:left-0 lg:bg-white`;
    }
    if (headerIndex === 1) {
      return `${baseClasses} ${SECOND_COL_WIDTH} lg:sticky lg:z-10 lg:left-[90px] lg:bg-white`;
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

  const renderCellContent = (header: TableHeader) => {
    switch (header.key) {
      case "id":
        return <span className="font-semibold text-fnh-navy">{index}</span>;

      case "patientFullName":
        return (
          <div className="font-medium">
            <div className="text-gray-900">{row.patientFullName}</div>
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
          <button
            onClick={() => onEdit?.(row)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-fnh-navy text-white rounded-lg hover:bg-fnh-navy-dark transition-colors"
          >
            <Edit2 size={14} />
            <span className="hidden sm:inline">Edit</span>
          </button>
        );

      default:
        return row[header.key as keyof PathologyPatientData] || "N/A";
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {headers.map((header, headerIndex) => (
        <td key={header.key} className={getCellClasses(headerIndex)}>
          {renderCellContent(header)}
        </td>
      ))}
    </tr>
  );
};

export default React.memo(TableRow);
