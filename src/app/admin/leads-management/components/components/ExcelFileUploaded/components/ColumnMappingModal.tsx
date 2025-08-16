import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TARGET_FIELDS } from "./constants";
import { findBestMatch } from "./utils";
import MappingTab from "./components/MappingTab";
import PreviewTab from "./components/PreviewTab";

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClo
  se: () => void;
  sourceHeaders: string[

  ];
  sampleData: any[];
  onConfirm: (mappings: Record<string, string>) => void;
}

const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  onClose,
  sourceHeaders,
  sampleData,
  onConfirm,
}) => {
  // State to track mappings (sourceHeader -> targetField)
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [errorFields, setErrorFields] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"mapping" | "preview">("mapping");

  // Auto-map columns on initial render
  useEffect(() => {
    if (sourceHeaders.length > 0) {
      const initialMappings: Record<string, string> = {};

      sourceHeaders.forEach((header) => {
        initialMappings[header] = findBestMatch(header, TARGET_FIELDS);
      });

      setMappings(initialMappings);
    }
  }, [sourceHeaders]);

  // Handle changes to mappings (memoized)
  const handleMappingChange = useCallback(
    (sourceHeader: string, targetField: string) => {
      setMappings((prev) => ({
        ...prev,
        [sourceHeader]: targetField,
      }));

      // Clear error for this field if it was in the error list
      setErrorFields((prev) =>
        prev.includes(targetField)
          ? prev.filter((field) => field !== targetField)
          : prev
      );
    },
    []
  );

  // Validate mappings before submitting (memoized)
  const validateAndSubmit = useCallback(() => {
    const errors: string[] = [];

    // Check required fields
    TARGET_FIELDS.forEach((field) => {
      if (field.required) {
        const isMapped = Object.values(mappings).includes(field.key);
        if (!isMapped) {
          errors.push(field.key);
        }
      }
    });

    if (errors.length > 0) {
      setErrorFields(errors);
      return;
    }

    // If valid, confirm mappings
    onConfirm(mappings);
  }, [mappings, onConfirm]);

  // Determine mapping status for each field (memoized)
  const getMappingStatus = useCallback(
    (field: (typeof TARGET_FIELDS)[number]) => {
      if (field.required) {
        if (Object.values(mappings).includes(field.key)) {
          return "mapped";
        }
        return "required";
      }
      return Object.values(mappings).includes(field.key)
        ? "mapped"
        : "optional";
    },
    [mappings]
  );

  // Memoize the mapped fields count
  const mappedFieldsCount = useMemo(() => {
    return Object.values(mappings).filter(Boolean).length;
  }, [mappings]);

  // Backdrop click handler (memoized)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Tab change handlers (memoized)
  const handleTabChange = useCallback((tab: "mapping" | "preview") => {
    return () => setActiveTab(tab);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-6xl h-[85%] overflow-hidden flex flex-col text-sm"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 border-b bg-blue-950 text-white">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                Map Columns
              </h2>
              <motion.button
                onClick={onClose}
                className="text-white hover:text-gray-200 focus:outline-none"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </motion.button>
            </div>

            {/* Tab Navigation */}
            <div className="p-2 sm:p-3 md:p-4 border-b bg-gray-50">
              <div className="flex space-x-2 sm:space-x-4">
                <motion.button
                  className={`px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-md text-xs sm:text-sm md:text-base font-medium transition-colors duration-200 ${
                    activeTab === "mapping"
                      ? "bg-blue-900 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={handleTabChange("mapping")}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                >
                  Column Mapping
                </motion.button>
                <motion.button
                  className={`px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-md text-xs sm:text-sm md:text-base font-medium transition-colors duration-200 ${
                    activeTab === "preview"
                      ? "bg-blue-900 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={handleTabChange("preview")}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                >
                  Data Preview
                </motion.button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-gray-50">
              <AnimatePresence mode="wait">
                {activeTab === "mapping" ? (
                  <MappingTab
                    errorFields={errorFields}
                    sourceHeaders={sourceHeaders}
                    sampleData={sampleData}
                    mappings={mappings}
                    getMappingStatus={getMappingStatus}
                    handleMappingChange={handleMappingChange}
                  />
                ) : (
                  <PreviewTab
                    sourceHeaders={sourceHeaders}
                    sampleData={sampleData}
                    mappings={mappings}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 md:p-6 border-t bg-white flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <div className="text-xs sm:text-sm text-gray-500">
                {sourceHeaders.length} columns found •&nbsp;
                {mappedFieldsCount} columns mapped
              </div>
              <div className="flex space-x-2 sm:space-x-4">
                <motion.button
                  onClick={onClose}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2 border border-gray-300 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  whileHover={{ y: -1, backgroundColor: "#F9FAFB" }}
                  whileTap={{ y: 0 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={validateAndSubmit}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  whileHover={{ y: -1, backgroundColor: "#1e3a8a" }}
                  whileTap={{ y: 0 }}
                >
                  Confirm Mapping & Import
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(ColumnMappingModal);
