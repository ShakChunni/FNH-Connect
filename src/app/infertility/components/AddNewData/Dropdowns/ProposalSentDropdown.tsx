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

interface ProposalSentDropdownProps {
  onSelect: (value: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  hasChanged: boolean;
}

const proposalSentValues = ["Yes", "No"];

const ProposalSentDropdown: FC<ProposalSentDropdownProps> = ({
  onSelect,
  defaultValue = "No",
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
  hasChanged,
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

  const buttonClassName = useMemo(() => {
    const baseClasses =
      "text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-shadow duration-300";

    if (selectedValue === "No") {
      return `bg-gray-50 border border-gray-300 ${baseClasses}`;
    } else if (hasChanged) {
      return `bg-white border-2 border-green-700 ${baseClasses}`;
    } else {
      return `bg-gray-50 border border-gray-300 ${baseClasses}`;
    }
  }, [hasChanged, selectedValue]);

  return (
    <div ref={dropdownRef} onClick={(e) => e.stopPropagation()} style={style}>
      <button
        onClick={() => handleOpenChange(!isOpen)}
        className={buttonClassName}
      >
        <span
          className={`${
            selectedValue
              ? "text-[#2A3136] font-normal"
              : "text-gray-400 font-light"
          } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
        >
          {selectedValue ? selectedValue : "Is Proposal Sent?"}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 w-[calc(100%-48px)] p-2"
          >
            {proposalSentValues.map((value) => (
              <div
                key={value}
                onClick={() => handleSelect(value)}
                className="cursor-pointer px-4 py-3 hover:bg-blue-900 hover:text-white hover:rounded-lg"
                style={{ borderBottom: "none" }}
              >
                <Text>{value}</Text>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProposalSentDropdown;
