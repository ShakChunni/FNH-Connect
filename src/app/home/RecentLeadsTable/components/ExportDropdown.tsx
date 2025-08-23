import { useState, useRef, useEffect } from "react";
import { FileSpreadsheet, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExportDropdownProps {
  onExportCSV: () => void;
}

const ExportDropdown = ({ onExportCSV }: ExportDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center justify-center w-8 h-8 focus:outline-none transition-colors duration-200"
        aria-label="Export"
        type="button"
      >
        <MoreVertical
          size={22}
          className={`transition-colors duration-300 ${
            isOpen ? "text-blue-900" : "text-gray-500"
          } hover:text-blue-900`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="origin-top-right absolute -right-2 mt-4 w-48 shadow-lg bg-white ring-opacity-5 focus:outline-none z-50"
            style={{ borderRadius: "1rem" }}
          >
            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onExportCSV();
                }}
                className="group flex items-center px-4 py-2 text-sm rounded-xl text-gray-700 w-full transition-all
                  hover:bg-green-50 hover:text-green-800"
              >
                <FileSpreadsheet className="mr-3 h-5 w-5 text-green-600 group-hover:text-green-800" />
                <span className="text-xs font-medium">Export as Excel</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportDropdown;
