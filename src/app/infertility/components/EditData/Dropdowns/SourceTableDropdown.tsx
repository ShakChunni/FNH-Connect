import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FC,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Database, ChevronDown } from "lucide-react";

interface SourceTableDropdownProps {
  onSelect: (value: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
}

const sourceTableValues = ["MAVN", "MI"];

const getDisplayValue = (value: string) => {
  switch (value.toLowerCase()) {
    case "mi":
      return "TMI";
    case "mavn":
      return "MAVN";
    default:
      return value;
  }
};

const SourceTableDropdown: FC<SourceTableDropdownProps> = ({
  onSelect,
  defaultValue = "",
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue]);

  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      setSelectedValue(value);
      onSelect(value);
      setIsOpen(false);
      onDropdownToggle(false);
      onDropdownOpenStateChange(false);
      setSearchTerm("");
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        updateDropdownPosition();
      }
      setIsOpen(open);
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
      if (!open) {
        setSearchTerm("");
      }
    },
    [onDropdownToggle, onDropdownOpenStateChange, updateDropdownPosition]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
        setSearchTerm("");
      }
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition);
    };
  }, [isOpen, handleClickOutside, updateDropdownPosition]);

  const filteredSourceTables = useMemo(() => {
    if (!searchTerm) return sourceTableValues;
    return sourceTableValues.filter((table) =>
      getDisplayValue(table).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const formatDisplayValue = () => {
    if (!selectedValue) return null;
    const displayValue = getDisplayValue(selectedValue);
    return displayValue.length > 6
      ? `${displayValue.slice(0, 6)}...`
      : displayValue;
  };

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-[60]"
          style={{
            position: "absolute",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: Math.max(
              dropdownPosition.width,
              window.innerWidth < 640 ? 140 : 180
            ),
            maxHeight: window.innerWidth < 640 ? "200px" : "250px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Search Input */}
          <div className="p-2 sticky top-0 bg-white z-10 shadow-sm">
            <input
              type="text"
              placeholder={
                window.innerWidth < 640 ? "Search..." : "Search organization..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="source-search-input w-full p-2 rounded-xl border-2 border-gray-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-950 focus:outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Dropdown Items */}
          <div className="max-h-32 overflow-y-auto">
            {filteredSourceTables.length > 0 ? (
              filteredSourceTables.map((table) => (
                <div
                  key={table}
                  onClick={() => handleSelect(table)}
                  className="cursor-pointer px-4 py-3 hover:bg-blue-900 hover:text-white flex items-center transition-colors duration-200"
                >
                  <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-2 opacity-70" />
                  <span className="text-xs sm:text-sm font-medium">
                    {getDisplayValue(table)}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-xs sm:text-sm">
                No organization found
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => handleOpenChange(!isOpen)}
        className={`flex items-center px-2 md:px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
          selectedValue
            ? "bg-purple-50 border-purple-200 text-purple-700"
            : "bg-gray-50 border-gray-300 text-gray-700"
        } ${isOpen ? "ring-2 ring-blue-200 border-blue-900" : ""}`}
        style={style}
        title={
          selectedValue
            ? `Organization: ${getDisplayValue(selectedValue)}`
            : "Select Assigned Organization"
        }
      >
        <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-current" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
          <span className="block sm:hidden">
            {formatDisplayValue() || "Assigned Org"}
          </span>
          <span className="hidden sm:block">
            {formatDisplayValue() || "Assigned Organization"}
          </span>
        </span>
        <ChevronDown
          className={`ml-1 sm:ml-2 h-3 w-3 text-current transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default SourceTableDropdown;
