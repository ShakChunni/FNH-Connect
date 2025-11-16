import React from "react";
import { Edit2 } from "lucide-react";
import { InfertilityPatientData, TableHeader } from "../../../types";
import { formatDate } from "../utils/tableUtils";

interface TableRowProps {
  row: InfertilityPatientData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: InfertilityPatientData) => void;
}

const TableRow: React.FC<TableRowProps> = ({ row, index, headers, onEdit }) => (
  <tr className="hover:bg-blue-50 transition-colors duration-200 border-b border-gray-200">
    {onEdit && (
      <td className="px-4 py-4 whitespace-nowrap text-sm sticky left-0 bg-white hover:bg-blue-50">
        <button
          onClick={() => onEdit(row)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 transition-colors duration-150"
          title="Edit patient"
        >
          <Edit2 size={16} />
        </button>
      </td>
    )}
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
      {index}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.hospitalName || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
      {row.patientFullName}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.patientAge || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {formatDate(row.patientDOB)}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.husbandName || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.husbandAge || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {formatDate(row.husbandDOB)}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.mobileNumber || "-"}
    </td>
    <td className="px-4 py-4 text-sm text-gray-700 max-w-xs truncate">
      {row.address || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.yearsMarried || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.yearsTrying || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.para || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.alc || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.weight || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.bp || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {row.infertilityType || "-"}
    </td>
    <td className="px-4 py-4 text-sm text-gray-700 max-w-xs truncate">
      {row.notes || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {formatDate(row.createdAt)}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
      {formatDate(row.updatedAt)}
    </td>
  </tr>
);

export default TableRow;
