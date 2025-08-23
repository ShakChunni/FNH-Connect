"use client";

import React from "react";
import { Copy, Minus } from "lucide-react";
import WhatsappMessaging from "../../WhatsappMessaging";

interface InfoFieldProps {
  icon: React.ElementType;
  label: string;
  value: string | null;
  isLink?: boolean;
  copyable?: boolean;
  isPhoneNumber?: boolean;
  onCopy: (text: string, fieldName: string) => void;
}

const InfoField: React.FC<InfoFieldProps> = ({
  icon: Icon,
  label,
  value,
  isLink = false,
  copyable = true,
  isPhoneNumber = false,
  onCopy,
}) => {
  const hasValue = value && value.trim() !== "";

  return (
    <div
      className={`group border border-slate-200 rounded-2xl p-2 sm:p-3 transition-colors shadow-sm duration-200 ${
        hasValue
          ? "bg-white hover:bg-blue-50"
          : "bg-slate-100/50 hover:bg-slate-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">
            <Icon
              className={`h-3 w-3 sm:h-4 sm:w-4 ${
                hasValue ? "text-slate-500" : "text-slate-400"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`text-xs sm:text-sm font-medium mb-1 ${
                hasValue ? "text-slate-700" : "text-slate-500"
              }`}
            >
              {label}
            </p>
            {hasValue ? (
              isLink ? (
                <a
                  href={value.startsWith("http") ? value : `https://${value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {value}
                </a>
              ) : (
                <p className="text-xs sm:text-sm text-slate-900 break-words">
                  {value}
                </p>
              )
            ) : (
              <div className="flex items-center text-slate-400">
                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm ml-1">No data</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {hasValue && isPhoneNumber && (
            <div className="flex items-center">
              <WhatsappMessaging phoneNumber={value} source="overview" />
            </div>
          )}
          {hasValue && copyable && (
            <button
              onClick={() => onCopy(value, label)}
              className="p-1 rounded group/button"
              title={`Copy ${label}`}
            >
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover/button:text-blue-900 transition-colors duration-200" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoField;
