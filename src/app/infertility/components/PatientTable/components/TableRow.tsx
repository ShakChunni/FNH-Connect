import React from "react";
import { InfertilityPatientData, TableHeader } from "../../../types";
import { formatDate } from "../utils/tableUtils";

interface TableRowProps {
  row: InfertilityPatientData;
  index: number;
  headers: TableHeader[];
  onEdit?: (patient: InfertilityPatientData) => void;
}

const TableRow: React.FC<TableRowProps> = ({ row, index, headers, onEdit }) => (
  <tr className="hover:bg-fnh-porcelain transition-colors">
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {index}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.hospitalName || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-fnh-grey-dark">
      {row.patientFullName}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.patientAge || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {formatDate(row.patientDOB)}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.husbandName || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.husbandAge || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {formatDate(row.husbandDOB)}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.mobileNumber || "-"}
    </td>
    <td className="px-4 py-4 text-sm text-fnh-grey-dark max-w-xs truncate">
      {row.address || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.yearsMarried || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.yearsTrying || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.para || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.alc || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.weight || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.bp || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {row.infertilityType || "-"}
    </td>
    <td className="px-4 py-4 text-sm text-fnh-grey-dark max-w-xs truncate">
      {row.notes || "-"}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {formatDate(row.createdAt)}
    </td>
    <td className="px-4 py-4 whitespace-nowrap text-sm text-fnh-grey-dark">
      {formatDate(row.updatedAt)}
    </td>
    {onEdit && (
      <td className="px-4 py-4 whitespace-nowrap text-sm">
        <button
          onClick={() => onEdit(row)}
          className="text-fnh-blue hover:text-fnh-blue-dark font-medium"
        >
          Edit
        </button>
      </td>
    )}
  </tr>
);

export default TableRow;
