import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { TARGET_FIELDS, tabContentVariants } from "../constants";
import FieldStatusBadge from "./FieldStatusBadge";
import AnimatedSelect from "./AnimatedSelect";

interface MappingTabProps {
  errorFields: string[];
  sourceHeaders: string[];
  sampleData: any[];
  mappings: Record<string, string>;
  getMappingStatus: (field: (typeof TARGET_FIELDS)[number]) => string;
  handleMappingChange: (sourceHeader: string, targetField: string) => void;
}

const MappingTab: React.FC<MappingTabProps> = ({
  errorFields,
  sourceHeaders,
  sampleData,
  mappings,
  getMappingStatus,
  handleMappingChange,
}) => {
  return (
    <motion.div
      key="mapping"
      className="space-y-4 sm:space-y-6"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={tabContentVariants}
      transition={{ duration: 0.15 }}
    >
      <div className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2">
          Column Mapping Instructions
        </h3>
        <p className="text-xs sm:text-sm text-gray-600">
          Map Excel columns to the corresponding fields in the system. Required
          fields are marked with an asterisk (*).
        </p>

        {/* Mapping status summary */}
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
          {TARGET_FIELDS.map((field) => (
            <FieldStatusBadge
              key={field.key}
              field={field}
              status={getMappingStatus(field)}
            />
          ))}
        </div>
      </div>

      {errorFields.length > 0 && (
        <motion.div
          className="p-3 sm:p-4 bg-rose-100 text-rose-800 rounded-md border border-rose-300 shadow-sm"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-500" />
            <p className="font-semibold text-xs sm:text-sm">
              Please map the following required fields:
            </p>
          </div>
          <ul className="list-disc list-inside mt-2 ml-4 sm:ml-6 text-xs sm:text-sm">
            {errorFields.map((field) => (
              <li key={field}>
                {TARGET_FIELDS.find((f) => f.key === field)?.label || field}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[1fr_2fr_1fr] bg-gray-100 border-b border-gray-200">
          <div className="font-semibold text-gray-700 p-2 sm:p-3 md:p-4 text-xs sm:text-sm">
            Excel Column
          </div>
          <div className="font-semibold text-gray-700 p-2 sm:p-3 md:p-4 text-xs sm:text-sm">
            Maps To
          </div>
          <div className="font-semibold text-gray-700 p-2 sm:p-3 md:p-4 text-xs sm:text-sm">
            Sample Data
          </div>
        </div>

        {sourceHeaders.map((header, index) => (
          <div
            key={header}
            className={`grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[1fr_2fr_1fr] ${
              index % 2 === 0 ? "bg-white" : "bg-gray-50"
            } border-b border-gray-200 items-center`}
          >
            <div className="p-2 sm:p-3 md:p-4 text-gray-800 font-medium text-xs sm:text-sm truncate flex items-center">
              {header}
            </div>
            <div className="p-2 sm:p-3 md:p-4 flex items-center">
              <AnimatedSelect
                value={mappings[header] || ""}
                onChange={(value) => handleMappingChange(header, value)}
                options={TARGET_FIELDS}
                sourceHeader={header}
                mappings={mappings}
              />
            </div>
            <div className="p-2 sm:p-3 md:p-4 text-gray-600 truncate text-xs sm:text-sm flex items-center">
              {sampleData[0] && sampleData[0][header] ? (
                <span className="bg-blue-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-blue-100">
                  {String(sampleData[0][header])}
                </span>
              ) : (
                <span className="text-gray-400 italic">No data</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(MappingTab);
