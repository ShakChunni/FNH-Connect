import React from "react";

interface TableHeaderProps {
  headers: { key: string; label: string }[];
}

const TableHeader: React.FC<TableHeaderProps> = ({ headers }) => {
  return (
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>
        {headers.map((header) => (
          <th
            key={header.key}
            className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider shadow-sm"
          >
            {header.label}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
