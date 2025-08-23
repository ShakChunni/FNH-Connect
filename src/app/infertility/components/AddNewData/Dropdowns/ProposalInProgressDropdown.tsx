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
import { Text } from "@radix-ui/themes";

interface ProposalInProgressDropdownProps {
  onSelect: (value: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  hasChanged: boolean;
}

const proposalInProgressValues = ["Yes", "No"];

const ProposalInProgressDropdown: FC<ProposalInProgressDropdownProps> = ({
  onSelect,
  defaultValue = "No",
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
  hasChanged,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownReady, setIsDropdownReady] = useState<boolean>(false);
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
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setIsDropdownReady(true);
        updateDropdownPosition();
        requestAnimationFrame(() => {
          setIsOpen(true);
        });
      } else {
        setIsOpen(false);
      }
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
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
      }
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleScroll = useCallback(
    (event: Event) => {
      if (isOpen) {
        const target = event.target as Element;

        if (dropdownRef.current && dropdownRef.current.contains(target)) {
          return;
        }

        if (buttonRef.current && buttonRef.current.contains(target)) {
          return;
        }

        setIsOpen(false);
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [isOpen, onDropdownToggle, onDropdownOpenStateChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleScroll, { capture: true });
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", updateDropdownPosition);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDropdownPosition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen, handleClickOutside, handleScroll, updateDropdownPosition]);

  const buttonClassName = useMemo(() => {
    const baseClasses =
      "text-gray-700 font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-12 md:h-14 focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300";

    if (selectedValue === "No") {
      return `bg-gray-50 border border-gray-300 ${baseClasses}`;
    } else if (hasChanged) {
      return `bg-white border-2 border-green-700 ${baseClasses}`;
    } else {
      return `bg-gray-50 border-2 border-green-700 ${baseClasses}`;
    }
  }, [hasChanged, selectedValue]);

  const dropdownItems = useMemo(
    () =>
      proposalInProgressValues.map((value) => (
        <div
          key={value}
          onClick={() => handleSelect(value)}
          className="cursor-pointer px-4 py-3 hover:bg-blue-900 hover:text-white transition-colors duration-200 rounded-md mx-1"
        >
          <Text>{value}</Text>
        </div>
      )),
    [handleSelect]
  );

  const dropdownContent = (
    <AnimatePresence>
      {(isOpen || isDropdownReady) && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, height: 0 }}
          animate={
            isOpen ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }
          }
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-[60]"
          style={{
            position: "absolute",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          }}
          onAnimationComplete={() => {
            if (!isOpen) setIsDropdownReady(false);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-2">{dropdownItems}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div onClick={(e) => e.stopPropagation()} style={style}>
        <button
          ref={buttonRef}
          onClick={() => handleOpenChange(!isOpen)}
          className={buttonClassName}
        >
          <span
            className={`${
              selectedValue
                ? "text-gray-700 font-normal"
                : "text-gray-400 font-light"
            } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
          >
            {selectedValue ? selectedValue : "Is Proposal In Progress?"}
          </span>
        </button>
      </div>

      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default ProposalInProgressDropdown;
