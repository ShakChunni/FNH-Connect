import React from "react";
import { motion } from "framer-motion";
import { tabContentVariants } from "../constants";
import TableHeaderCell from "./TableHeaderCell";
import TableDataCell from "./TableDataCell";

interface PreviewTabProps {
  sourceHeaders: string[];
  sampleData: any[];
  mappings: Record<string, string>;
}

const PreviewTab: React.FC<PreviewTabProps> = ({
  sourceHeaders,
  sampleData,
  mappings,
}) => {
  return (
    <motion.div
      key="preview"
      className="h-full flex flex-col"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={tabContentVariants}
      transition={{ duration: 0.15 }}
    >
      <div className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-sm border border-gray-200 mb-4">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2">
          Data Preview
        </h3>
        <p className="text-xs sm:text-sm text-gray-600">
          Review the data before importing. The table below shows how the data
          will be mapped to the system.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 overflow-x-auto overflow-y-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900 text-white">
            <tr>
              {sourceHeaders.map((header) => (
                <TableHeaderCell
                  key={header}
                  header={header}
                  mapping={mappings[header]}
                />
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sampleData.slice(0, 5).map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: rowIndex * 0.05,
                  duration: 0.2,
                }}
                className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                {sourceHeaders.map((header) => (
                  <TableDataCell
                    key={`${rowIndex}-${header}`}
                    value={row[header]}
                  />
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default React.memo(PreviewTab);
