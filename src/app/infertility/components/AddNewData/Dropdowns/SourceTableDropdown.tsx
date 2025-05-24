import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FC,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@radix-ui/themes";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue]);

  const handleSelect = useCallback(
    (value: string) => {
      setSelectedValue(value);
      onSelect(value);
      setIsOpen(false);
      onDropdownToggle(false);
      onDropdownOpenStateChange(false);
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const dropdownItems = useMemo(
    () =>
      sourceTableValues.map((value) => (
        <motion.div
          key={value}
          onClick={() => handleSelect(value)}
          className="cursor-pointer px-2 py-2 hover:bg-blue-900 hover:text-white hover:rounded-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Text>{getDisplayValue(value)}</Text>
        </motion.div>
      )),
    [handleSelect]
  );

  return (
    <motion.div
      layout
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
      style={style}
      className="relative"
    >
      <motion.button
        layout
        onClick={() => handleOpenChange(!isOpen)}
        className={`${
          selectedValue
            ? "bg-white border-2 border-blue-900"
            : "bg-[#F0F4F8] border border-gray-300"
        } text-[#2A3136] font-normal rounded-lg flex justify-between items-center cursor-pointer px-3 py-2 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 outline-none shadow-sm hover:shadow-md transition-shadow duration-300`}
        style={{ width: "100%" }}
      >
        <span
          className={`${
            selectedValue ? "text-[#2A3136] font-normal" : "text-gray-400"
          }`}
        >
          {getDisplayValue(selectedValue) || "Select Source Table"}
        </span>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-2"
            style={{ width: "100%", minWidth: "fit-content" }}
          >
            {dropdownItems}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SourceTableDropdown;
