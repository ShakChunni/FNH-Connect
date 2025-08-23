import React from "react";

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  green: "bg-green-50 border-green-200 text-green-700",
};

const ClientDropdownSection = ({
  color,
  title,
  icon,
}: {
  color: "blue" | "green";
  title: string;
  icon?: React.ReactNode;
}) => (
  <div
    className={`${colorMap[color]} px-3 py-2 border-b flex items-center gap-2 uppercase tracking-wide text-xs font-semibold`}
  >
    <span>{title}</span>
    {icon}
  </div>
);

export default ClientDropdownSection;
