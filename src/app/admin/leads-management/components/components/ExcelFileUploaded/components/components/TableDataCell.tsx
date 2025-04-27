import React from "react";

interface TableDataCellProps {
  value: any;
}

const TableDataCell: React.FC<TableDataCellProps> = ({ value }) => {
  return (
    <td className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
      {value !== undefined ? String(value) : ""}
    </td>
  );
};

export default React.memo(TableDataCell);
