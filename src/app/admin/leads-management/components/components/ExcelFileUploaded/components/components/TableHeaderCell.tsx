import React, { useMemo } from "react";
import { TARGET_FIELDS } from "../constants";

interface TableHeaderCellProps {
  header: string;
  mapping: string;
}

const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
  header,
  mapping,
}) => {
  const targetLabel = useMemo(() => {
    return TARGET_FIELDS.find((f) => f.key === mapping)?.label || mapping;
  }, [mapping]);

  return (
    <th className="px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 text-left text-xs font-medium uppercase tracking-wider">
      <div className="font-semibold text-xs sm:text-sm">{header}</div>
      {mapping && (
        <div className="text-blue-200 text-xs font-normal normal-case mt-1">
          → {targetLabel}
        </div>
      )}
    </th>
  );
};

export default React.memo(TableHeaderCell);
