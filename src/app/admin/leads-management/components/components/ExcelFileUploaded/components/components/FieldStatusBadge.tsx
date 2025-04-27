import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { TARGET_FIELDS } from "../constants";

interface FieldStatusBadgeProps {
  field: (typeof TARGET_FIELDS)[number];
  status: string;
}

const FieldStatusBadge: React.FC<FieldStatusBadgeProps> = ({
  field,
  status,
}) => {
  return (
    <div
      className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs flex items-center gap-1
        ${
          status === "mapped"
            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
            : status === "required"
            ? "bg-rose-100 text-rose-800 border border-rose-300"
            : "bg-gray-100 text-gray-600 border border-gray-200"
        }`}
    >
      {status === "mapped" ? (
        <CheckCircle size={12} className="text-emerald-600" />
      ) : status === "required" ? (
        <AlertCircle size={12} className="text-rose-600" />
      ) : null}
      {field.label} {field.required ? "*" : ""}
    </div>
  );
};

export default React.memo(FieldStatusBadge);
