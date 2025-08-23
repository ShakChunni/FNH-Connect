import React, {
  FC,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { ChevronDown, Check } from "lucide-react";
import { createPortal } from "react-dom";

interface LeadsFilterDropdownProps {
  onSelect: (selectedValue: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle?: (isOpen: boolean) => void;
}

interface DropdownContentProps {
  options: Array<{ label: string; value: string }>;
  selectedValue: string;
  handleOptionSelect: (value: string) => void;
  stopPropagation: (e: React.MouseEvent | React.KeyboardEvent) => void;
  stopWheelPropagation: (e: React.WheelEvent) => void;
  getTriggerRect: () => DOMRect | null;
  setContentRef: (node: HTMLDivElement | null) => void;
}

const DropdownContent: FC<DropdownContentProps> = ({
  options,
  selectedValue,
  handleOptionSelect,
  stopPropagation,
  stopWheelPropagation,
  getTriggerRect,
  setContentRef,
}) => {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const isSmallMobile = useMediaQuery({ maxWidth: 399 });
  const isMobile = useMediaQuery({ maxWidth: 639 });

  // Fixed position calculation
  useLayoutEffect(() => {
    const updatePosition = () => {
      const rect = getTriggerRect();
      if (rect) {
        // Calculate position relative to viewport, not document
        const top = rect.bottom + 8; // 8px gap below button
        const left = (() => {
          const viewportWidth = window.innerWidth;
          const dropdownWidth = isSmallMobile
            ? Math.min(viewportWidth - 20, 260)
            : 260;
          const rightEdge = rect.left + dropdownWidth;

          if (rightEdge > viewportWidth) {
            if (isSmallMobile) {
              return Math.max(10, viewportWidth / 2 - dropdownWidth / 2);
            } else {
              return Math.max(10, viewportWidth - dropdownWidth - 10);
            }
          }
          return rect.left;
        })();

        setPosition({ top, left });
      }
    };

    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    setMounted(true);

    return () => {
      setMounted(false);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [getTriggerRect, isSmallMobile]);

  const dropdownContent = (
    <motion.div
      ref={setContentRef}
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
      className="fixed z-[9999] bg-white border border-gray-300 rounded-lg overflow-hidden shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: isSmallMobile ? "calc(100vw - 20px)" : "260px",
        maxWidth: "260px",
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
      }}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onKeyDown={stopPropagation}
      onWheel={stopWheelPropagation}
      data-dropdown="leads"
      data-dropdown-content="true"
    >
      <div className="flex flex-col p-2 sm:p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-blue-900 font-bold text-xs sm:text-sm">
            Lead Filters
          </div>
        </div>

        <div
          className="flex flex-col gap-1"
          onWheel={stopWheelPropagation}
          data-dropdown-content="true"
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors ${
                selectedValue === option.value
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleOptionSelect(option.value)}
            >
              <span
                className={`${
                  selectedValue === option.value
                    ? "text-blue-900 font-medium"
                    : "text-gray-600"
                } text-xs sm:text-sm`}
              >
                {option.label}
              </span>

              <div className="flex items-center">
                <span
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center border transition-colors ${
                    selectedValue === option.value
                      ? "border-blue-900 bg-blue-900 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {selectedValue === option.value && (
                    <Check
                      size={isMobile ? 12 : 14}
                      className="stroke-current"
                    />
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  if (!mounted) return null;
  return createPortal(dropdownContent, document.body);
};

const LeadsFilterDropdown: FC<LeadsFilterDropdownProps> = ({
  onSelect,
  defaultValue = "All",
  style,
  onDropdownToggle,
}) => {
  const isSmallMobile = useMediaQuery({ maxWidth: 399 });
  const isMobile = useMediaQuery({ maxWidth: 639 });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null);
  const isMouseOverDropdownRef = useRef<boolean>(false);

  const options = useMemo(
    () => [
      { label: "All", value: "All" },
      { label: "Warm Leads", value: "Warm Leads" },
      { label: "Exclude Warm Leads", value: "Exclude Warm Leads" },
    ],
    []
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`;
    }
  }, [selectedValue]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (onDropdownToggle) onDropdownToggle(open);
    },
    [onDropdownToggle]
  );

  // Get trigger rect - this provides the current position relative to viewport
  const getTriggerRect = useCallback(() => {
    return buttonRef.current ? buttonRef.current.getBoundingClientRect() : null;
  }, []);

  // Event handlers for closing dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isButtonClick = buttonRef.current?.contains(target);
      const isContentClick = contentRef && contentRef.contains(target);

      if (!isButtonClick && !isContentClick) {
        setIsOpen(false);
        if (onDropdownToggle) onDropdownToggle(false);
      }
    };

    const handleMouseEnterDropdown = () => {
      isMouseOverDropdownRef.current = true;
    };

    const handleMouseLeaveDropdown = () => {
      isMouseOverDropdownRef.current = false;
    };

    const handleWindowScroll = (event?: Event) => {
      if (!isOpen) return;

      if (isMouseOverDropdownRef.current) return;

      if (event && event.target) {
        const target = event.target as Node;

        if (
          contentRef &&
          (contentRef === target || contentRef.contains(target))
        ) {
          return;
        }

        if (target instanceof Element) {
          const isDropdownElement =
            target.hasAttribute("data-dropdown-content") ||
            target.closest('[data-dropdown-content="true"]') !== null ||
            target.closest('[data-dropdown="leads"]') !== null;

          if (isDropdownElement) {
            return;
          }
        }
      }

      setIsOpen(false);
      if (onDropdownToggle) onDropdownToggle(false);
    };

    const handleWheel = (event: WheelEvent) => {
      if (!isOpen) return;

      const target = event.target as Node;

      if (
        contentRef &&
        (contentRef === target || contentRef.contains(target))
      ) {
        event.stopPropagation();
        return;
      }

      if (target instanceof Element) {
        const isDropdownElement =
          target.hasAttribute("data-dropdown-content") ||
          target.closest('[data-dropdown-content="true"]') !== null ||
          target.closest('[data-dropdown="leads"]') !== null;

        if (isDropdownElement) {
          event.stopPropagation();
          return;
        }
      }

      if (!isMouseOverDropdownRef.current) {
        setIsOpen(false);
        if (onDropdownToggle) onDropdownToggle(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("wheel", handleWheel, { capture: true });

    const scrollHandler = (event: Event) => handleWindowScroll(event);
    window.addEventListener("scroll", scrollHandler, { capture: true });

    if (contentRef) {
      contentRef.addEventListener("mouseenter", handleMouseEnterDropdown);
      contentRef.addEventListener("mouseleave", handleMouseLeaveDropdown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("scroll", scrollHandler, { capture: true });

      if (contentRef) {
        contentRef.removeEventListener("mouseenter", handleMouseEnterDropdown);
        contentRef.removeEventListener("mouseleave", handleMouseLeaveDropdown);
      }
    };
  }, [isOpen, onDropdownToggle, contentRef]);

  const handleOptionSelect = useCallback(
    (value: string) => {
      setSelectedValue(value);
      onSelect(value);
      setIsOpen(false);
      if (onDropdownToggle) onDropdownToggle(false);
    },
    [onSelect, onDropdownToggle]
  );

  const stopPropagation = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
    },
    []
  );

  const stopWheelPropagation = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  return (
    <div ref={dropdownRef} style={style} data-dropdown="leads">
      <button
        ref={buttonRef}
        onClick={() => handleOpenChange(!isOpen)}
        className="dropdown-trigger-button"
        style={{
          backgroundColor: "white",
          color: "black",
          border: "1px solid #f3f4f6",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          whiteSpace: "nowrap",
          transition:
            "width 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          cursor: "pointer",
          height: "50px",
          fontSize: isMobile ? "14px" : "16px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#1e3a8a";
          e.currentTarget.style.color = "#1e3a8a";
          e.currentTarget.style.borderWidth = "2px";
          e.currentTarget.style.borderRadius = "12px";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#f3f4f6";
          e.currentTarget.style.color = "black";
          e.currentTarget.style.borderWidth = "1px";
          e.currentTarget.style.borderRadius = "10px";
        }}
      >
        <span ref={spanRef}>Lead Source: {selectedValue}</span>
        <span ref={iconRef} className="flex items-center">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <DropdownContent
            options={options}
            selectedValue={selectedValue}
            handleOptionSelect={handleOptionSelect}
            stopPropagation={stopPropagation}
            stopWheelPropagation={stopWheelPropagation}
            getTriggerRect={getTriggerRect}
            setContentRef={setContentRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(LeadsFilterDropdown);
