import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { dropdownVariants, TARGET_FIELDS } from "../constants";

interface AnimatedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: typeof TARGET_FIELDS;
  sourceHeader: string;
  mappings: Record<string, string>;
}

const AnimatedSelect: React.FC<AnimatedSelectProps> = ({
  value,
  onChange,
  options,
  sourceHeader,
  mappings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [portalPosition, setPortalPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const selectedLabel = useMemo(() => {
    if (!value) return "-- Do not import --";
    const option = options.find((opt) => opt.key === value);
    return option ? `${option.label}${option.required ? " *" : ""}` : value;
  }, [value, options]);

  const toggleDropdown = () => {
    if (!isOpen) {
      updatePortalPosition();
    }
    setIsOpen((prev) => !prev);
  };

  const updatePortalPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPortalPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updatePortalPosition();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { capture: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [isOpen, updatePortalPosition]);

  return (
    <div className="w-full">
      <div
        ref={triggerRef}
        onClick={toggleDropdown}
        className="w-full p-1.5 sm:p-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-md flex justify-between items-center cursor-pointer hover:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                className="z-50 bg-white shadow-lg max-h-[150px] rounded-md py-1 text-xs sm:text-sm overflow-auto border border-gray-200"
                initial="closed"
                animate="open"
                exit="closed"
                variants={dropdownVariants}
                style={{
                  position: "absolute",
                  top: portalPosition.top,
                  left: portalPosition.left,
                  width: portalPosition.width,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="p-1.5 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                >
                  -- Do not import --
                </div>

                {options.map((field) => {
                  const isSelected = value === field.key;
                  const isUsedElsewhere = Object.entries(mappings).some(
                    ([k, v]) => v === field.key && k !== sourceHeader
                  );

                  const displayText = `${field.label} ${
                    field.required ? "*" : ""
                  }${
                    isUsedElsewhere && !isSelected ? " (already mapped)" : ""
                  }`;

                  return (
                    <div
                      key={field.key}
                      className={`p-1.5 ${
                        isUsedElsewhere && !isSelected
                          ? "opacity-50 cursor-not-allowed bg-gray-50"
                          : "hover:bg-blue-50 cursor-pointer"
                      } ${isSelected ? "bg-blue-100" : ""} ${
                        field.required ? "font-semibold" : ""
                      }`}
                      onClick={() => {
                        if (!isUsedElsewhere || isSelected) {
                          onChange(field.key);
                          setIsOpen(false);
                        }
                      }}
                    >
                      {displayText}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default React.memo(AnimatedSelect);
