import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTableSelector } from "../../context/TableSelectorContext";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";

interface TableSelectorProps {
  defaultValue: string;
  className?: string;
}

const TableSelector: React.FC<TableSelectorProps> = ({ defaultValue }) => {
  const { handleTableSelectorChange } = useTableSelector();
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isSmallMobile = useMediaQuery({ maxWidth: 399 });
  const isMobile = useMediaQuery({ maxWidth: 639 });
  const isXsScreen = useMediaQuery({ maxWidth: 479 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const values = useMemo(() => ["All", "MAVN", "Moving Image"], []);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`;
    }
  }, [value]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const handleSelect = useCallback(
    (newValue: string) => {
      setValue(newValue);
      handleTableSelectorChange(newValue);
      setIsOpen(false);
    },
    [handleTableSelectorChange]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      const target = event.target as Node;
      const isButtonClick = buttonRef.current?.contains(target);
      const isContentClick =
        contentRef.current && contentRef.current.contains(target);
      if (!isButtonClick && !isContentClick) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        onClick={() => handleOpenChange(!isOpen)}
        className="dropdown-trigger-button rounded-2xl"
        initial={false}
        animate={{
          background: isOpen
            ? "linear-gradient(to left, #172554, #1e3a8a)"
            : "linear-gradient(to right, #172554, #1e3a8a)",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
        whileHover={{
          background: "linear-gradient(to right, #1e40af, #1e3a8a)",
          boxShadow:
            "0 4px 8px -1px rgba(0, 0, 0, 0.2), 0 2px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
        transition={{
          duration: 0.35,
          ease: [0.25, 0.1, 0.35, 1],
          background: {
            duration: 0.5,
            ease: "easeOut",
          },
        }}
        style={{
          color: "white",
          border: "none",
          borderRadius: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textWrap: "nowrap",
          padding: "8px 16px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          cursor: "pointer",
          height: "40px",
          fontSize: isMobile ? "14px" : "15px",
        }}
      >
        <span ref={spanRef}>Organization: {value}</span>
        <span ref={iconRef} className="flex items-center ml-2">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.95,
              transition: {
                duration: 0.2,
                ease: "easeOut",
              },
            }}
            className="absolute top-full left-0 mt-1 z-[9999] bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-xl"
            style={{
              width: "100%",
              maxHeight: isMobile ? "80vh" : "90vh",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
            }}
            data-dropdown="table"
            data-dropdown-content="true"
          >
            <div className="flex flex-col p-2">
              <div className="flex flex-col gap-1">
                {values.map((item) => (
                  <div
                    key={item}
                    onClick={() => handleSelect(item)}
                    className={`flex items-center px-3 py-2 ${
                      item === value ? "bg-blue-50" : "hover:bg-blue-50"
                    } rounded-2xl cursor-pointer transition-colors`}
                  >
                    <span
                      className={`${
                        item === value
                          ? "text-blue-900 font-medium"
                          : "text-gray-600"
                      } ${isMobile ? "text-xs" : "text-sm"}`}
                    >
                      {item}
                    </span>
                    {item === value && (
                      <div className="ml-auto">
                        <div className="w-4 h-4 rounded-2xl bg-blue-900 flex items-center justify-center">
                          <Check size={12} color="white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(TableSelector);
