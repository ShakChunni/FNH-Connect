import React, {
  FC,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@radix-ui/themes";
import { Range, DateRangePicker } from "react-date-range";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { createPortal } from "react-dom";
import { useMediaQuery } from "react-responsive";

interface DateSelectorProps {
  onSelect: (value: {
    start: string | null;
    end: string | null;
    option: string[];
  }) => void;
  defaultValue: { start: string | null; end: string | null; option: string[] };
  style?: React.CSSProperties;
  onDropdownToggle?: (isOpen: boolean) => void;
}

const options = [
  "Prospect Date",
  "Meeting Conducted",
  "Proposal In Progress",
  "Proposal Sent Out",
  "Quotation Signed",
  "Lost Leads",
];

const DateSelectorDropdownContent: FC<any> = ({
  dateRange,
  selectionRange,
  selectedOptions,
  handleOptionSelect,
  handleSelect,
  handleApply,
  stopPropagation,
  stopWheelPropagation,
  triggerRect,
  setContentRef,
  customRanges,
  onRequestClose,
  triggerButtonRef,
}) => {
  const [mounted, setMounted] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const isSmallMobile = useMediaQuery({ maxWidth: 399 });
  const isMobile = useMediaQuery({ maxWidth: 639 });
  const isTablet = useMediaQuery({ minWidth: 640, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const [maxHeight, setMaxHeight] = useState<string | number>(
    isMobile ? "60vh" : "80vh"
  );

  useEffect(() => {
    if (!triggerRect) return;

    const updateMaxHeight = () => {
      // Use visualViewport if available (better for mobile Safari)
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const dropdownTop = triggerRect.bottom + 8;
      // 16px margin from bottom
      const available = viewportHeight - dropdownTop - 16;
      setMaxHeight(available > 200 ? available : 200); // fallback min height
    };

    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);
    window.addEventListener("scroll", updateMaxHeight, true);

    return () => {
      window.removeEventListener("resize", updateMaxHeight);
      window.removeEventListener("scroll", updateMaxHeight, true);
    };
  }, [triggerRect, isMobile]);
  useEffect(() => {
    if (!isMobile || !triggerButtonRef?.current || !mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) {
          if (onRequestClose) onRequestClose();
        }
      },
      {
        threshold: 0,
        rootMargin: "0px",
      }
    );

    observer.observe(triggerButtonRef.current);

    const handleMobileScroll = (e?: Event) => {
      const dropdownContent = document.querySelector(
        '[data-dropdown-content="true"]'
      );
      if (e && e.target && dropdownContent) {
        if (
          e.target === dropdownContent ||
          (e.target instanceof Node &&
            dropdownContent.contains(e.target as Node))
        ) {
          return;
        }
      }
      if (onRequestClose) onRequestClose();
    };

    window.addEventListener("scroll", handleMobileScroll, { capture: true });

    const contentEl = setContentRef?.current;
    if (contentEl) {
      contentEl.addEventListener("scroll", handleMobileScroll, {
        capture: true,
      });
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleMobileScroll, {
        capture: true,
      });
      if (contentEl) {
        contentEl.removeEventListener("scroll", handleMobileScroll, {
          capture: true,
        });
      }
    };
  }, [isMobile, triggerButtonRef, mounted, onRequestClose, setContentRef]);
  useEffect(() => {
    const handleWindowScroll = (event?: Event) => {
      if (!mounted) return;
      if (!setContentRef?.current) return;

      if (event && event.target) {
        const target = event.target as Node;

        if (
          setContentRef.current === target ||
          setContentRef.current.contains(target)
        ) {
          return;
        }

        if (target instanceof Element) {
          const isDropdownTrigger =
            target.closest(".dropdown-trigger-button") !== null;

          if (isDropdownTrigger) {
            return;
          }

          if (showOptions && isMobile) {
            const isExpandButton =
              target.hasAttribute("data-expand-button") ||
              target.closest('[data-expand-button="true"]') !== null;

            const isOptionButton =
              target.hasAttribute("data-option-button") ||
              target.closest('[data-option-button="true"]') !== null;

            if (!isExpandButton && !isOptionButton) {
              setShowOptions(false);
            } else {
              return;
            }
          }
        }
      }

      if (onRequestClose) onRequestClose();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const elementAtPoint = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        );

        if (elementAtPoint && setContentRef?.current) {
          if (setContentRef.current.contains(elementAtPoint)) {
            return;
          }

          const isTriggerButton =
            elementAtPoint.closest(".dropdown-trigger-button") !== null;

          if (isTriggerButton) {
            return;
          }

          if (showOptions && isMobile) {
            const isExpandButton =
              elementAtPoint.hasAttribute("data-expand-button") ||
              elementAtPoint.closest('[data-expand-button="true"]') !== null;

            const isOptionButton =
              elementAtPoint.hasAttribute("data-option-button") ||
              elementAtPoint.closest('[data-option-button="true"]') !== null;

            if (!isExpandButton && !isOptionButton) {
              setShowOptions(false);
            } else {
              return;
            }
          }
        }
      }

      handleWindowScroll(event);
    };

    const handleWheel = (event: WheelEvent) => {
      handleWindowScroll(event);
    };

    if (isMobile) {
      window.addEventListener("touchmove", handleTouchMove, {
        capture: true,
        passive: false,
      });
    } else {
      window.addEventListener("scroll", handleWindowScroll, { capture: true });
      window.addEventListener("wheel", handleWheel, { capture: true });
    }

    return () => {
      window.removeEventListener("scroll", handleWindowScroll, {
        capture: true,
      });
      window.removeEventListener("touchmove", handleTouchMove, {
        capture: true,
      });
      window.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, [mounted, setContentRef, onRequestClose, showOptions, isMobile]);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const toggleOptions = useCallback(() => {
    setShowOptions((prev) => !prev);
  }, []);

  const getPositionAndSize = () => {
    if (!triggerRect) return { leftPosition: "0" };

    const dropdownWidth = isSmallMobile
      ? window.innerWidth - 44
      : isMobile
      ? window.innerWidth - 48
      : isTablet
      ? 720
      : 960;

    let leftPosition;

    if (isSmallMobile || isMobile) {
      const margin = isSmallMobile ? 22 : 24;
      leftPosition = `${margin}px`;
    } else {
      leftPosition = `${triggerRect.left + window.scrollX}px`;
      const rightEdge = triggerRect.left + dropdownWidth;
      const currentWidth = window.innerWidth;

      if (rightEdge > currentWidth) {
        leftPosition = `${Math.max(10, currentWidth - dropdownWidth - 10)}px`;
      }
    }

    return { leftPosition };
  };

  const { leftPosition } = getPositionAndSize();

  const optionStyle = (isMobile: boolean, isTablet: boolean) => ({
    fontSize: isSmallMobile
      ? "9px"
      : isMobile
      ? "10px"
      : isTablet
      ? "12px"
      : "13px",
    padding: isSmallMobile
      ? "10px 20px"
      : isMobile
      ? "10px 20px"
      : isTablet
      ? "5px 12px"
      : "6px 16px",
    margin: isTablet ? "1px" : "0 2px",
    minWidth: isMobile ? "unset" : "110px",
  });

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
      className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-xl"
      style={{
        top: triggerRect ? `${triggerRect.bottom + 8}px` : "0",
        left: leftPosition,
        width: isSmallMobile
          ? "calc(100vw - 44px)"
          : isMobile
          ? "calc(100vw - 48px)"
          : isTablet
          ? "720px"
          : "960px",
        maxHeight: maxHeight,
        overflow: "auto",
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
      }}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onKeyDown={stopPropagation}
      onWheel={stopWheelPropagation}
      onTouchStart={stopPropagation}
      onTouchMove={stopPropagation}
      data-dropdown="date"
      data-dropdown-content="true"
    >
      <div
        className={`flex flex-col h-full`}
        style={{
          padding: isMobile ? "16px 20px" : "16px 24px",
          overflow: "hidden",
        }}
      >
        {isMobile && (
          <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-3">
            <span
              className="font-medium text-gray-700"
              style={{ fontSize: isSmallMobile ? 11 : 12 }}
            >
              Expand Filters
            </span>
            <button
              onClick={toggleOptions}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label={showOptions ? "Hide filters" : "Show filters"}
              data-expand-button="true"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        )}

        <div
          className={`transition-all duration-300 ease-in-out ${
            showOptions || !isMobile
              ? "opacity-100 max-h-[500px]"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <div
            className={`flex ${isMobile ? "flex-col" : "flex-row"} ${
              isMobile ? "items-stretch" : "justify-center items-center"
            } gap-2 ${
              isMobile ? "border-b border-gray-200 pb-3 mb-3" : "mb-4"
            } ${isTablet ? "flex-wrap" : ""}`}
            style={{
              width: "100%",
              paddingLeft: isMobile ? "0" : undefined,
              paddingRight: isMobile ? "0" : undefined,
            }}
            data-options-container="true"
          >
            <AnimatePresence>
              {options.map((option) => (
                <motion.div
                  key={option}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center justify-center rounded-lg cursor-pointer transition-colors duration-300 whitespace-nowrap ${
                    selectedOptions.includes(option)
                      ? "bg-blue-950 text-white"
                      : "bg-white text-blue-950 border border-blue-900"
                  } ${isMobile ? "w-full" : ""}`}
                  style={optionStyle(isMobile, isTablet)}
                  onClick={() => handleOptionSelect(option)}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  data-option-button="true"
                  {...(!isMobile && {
                    whileHover: {
                      scale: 1.02,
                      transition: { duration: 0.2 },
                      zIndex: 10,
                    },
                    whileTap: { scale: 0.98 },
                  })}
                >
                  <span className="text-center px-1">{option}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div
          className="flex-1 relative"
          style={{
            minHeight: isMobile ? "350px" : undefined,
            maxHeight: isMobile ? "none" : undefined,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              overflow: "auto",
            }}
          >
            <DateRangePicker
              ranges={[dateRange]}
              onChange={handleSelect}
              moveRangeOnFirstSelection={false}
              months={isMobile ? 1 : 2}
              direction={isMobile ? "vertical" : "horizontal"}
              showPreview={
                !!selectionRange.startDate || !!selectionRange.endDate
              }
              weekStartsOn={1}
              showDateDisplay={false}
              staticRanges={
                isMobile
                  ? []
                  : Object.keys(customRanges).map((key) => ({
                      label: key,
                      range: () => customRanges[key],
                      isSelected: () =>
                        !!(
                          selectionRange.startDate &&
                          selectionRange.endDate &&
                          selectionRange.startDate.getTime() ===
                            customRanges[key].startDate.getTime() &&
                          selectionRange.endDate.getTime() ===
                            customRanges[key].endDate.getTime()
                        ),
                    }))
              }
              inputRanges={[]}
              className="w-full custom-date-range-picker"
            />
          </div>

          <div className="flex justify-end mt-2 md:-mt-14 mb-2 md:mb-0 mr-2 sm:mr-4">
            <Button
              onClick={handleApply}
              className="rounded-xl bg-blue-950 hover:bg-blue-900 text-white px-4 py-2 text-sm sm:text-base"
              style={{ cursor: "pointer", position: "relative", zIndex: 20 }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (!mounted) return null;
  return createPortal(dropdownContent, document.body);
};

const DateSelector: FC<DateSelectorProps> = ({
  onSelect,
  defaultValue,
  style,
  onDropdownToggle,
}) => {
  const isSmallMobile = useMediaQuery({ maxWidth: 399 });
  const isMobile = useMediaQuery({ maxWidth: 639 });
  const isTablet = useMediaQuery({ minWidth: 640, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  const formatDate = useCallback(
    (date: Date | undefined) =>
      date
        ? `${date.getUTCDate()}/${
            date.getUTCMonth() + 1
          }/${date.getUTCFullYear()}`
        : null,
    []
  );

  const [isOpen, setIsOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const [dateRange, setDateRange] = useState<Range>({
    startDate: defaultValue.start ? new Date(defaultValue.start) : new Date(),
    endDate: defaultValue.end ? new Date(defaultValue.end) : new Date(),
    key: "selection",
  });
  const [selectionRange, setSelectionRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    key: string;
  }>({
    startDate: defaultValue.start ? new Date(defaultValue.start) : null,
    endDate: defaultValue.end ? new Date(defaultValue.end) : null,
    key: "selection",
  });
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    defaultValue.option || []
  );
  const [value, setValue] = useState("Select");
  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null);
  const isMouseOverDropdownRef = useRef<boolean>(false);
  const prevDefaultValueRef = useRef(defaultValue);
  const hasSelectionRef = useRef(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (
      prevDefaultValueRef.current.start !== defaultValue.start ||
      prevDefaultValueRef.current.end !== defaultValue.end ||
      JSON.stringify(prevDefaultValueRef.current.option) !==
        JSON.stringify(defaultValue.option)
    ) {
      setSelectionRange({
        startDate: defaultValue.start ? new Date(defaultValue.start) : null,
        endDate: defaultValue.end ? new Date(defaultValue.end) : null,
        key: "selection",
      });

      if (!defaultValue.start && !defaultValue.end) {
        const today = new Date();
        setDateRange({
          startDate: today,
          endDate: today,
          key: "selection",
        });
      } else {
        setDateRange({
          startDate: defaultValue.start
            ? new Date(defaultValue.start)
            : new Date(),
          endDate: defaultValue.end ? new Date(defaultValue.end) : new Date(),
          key: "selection",
        });
      }

      setSelectedOptions(defaultValue.option || []);
      prevDefaultValueRef.current = defaultValue;

      if (
        defaultValue.start ||
        defaultValue.end ||
        (defaultValue.option && defaultValue.option.length > 0)
      ) {
        hasSelectionRef.current = true;
        updateDisplayValue();
      }
    }
  }, [defaultValue]);

  useEffect(() => {
    if (hasSelectionRef.current) {
      updateDisplayValue();
    }
  }, [selectionRange, selectedOptions]);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      const newWidth =
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40;
      if (buttonRef.current.offsetWidth !== newWidth) {
        buttonRef.current.style.width = `${newWidth}px`;
      }
    }
  }, [value]);

  const updateDisplayValue = useCallback(() => {
    let newValue = "Select";
    if (
      selectionRange.startDate ||
      selectionRange.endDate ||
      selectedOptions.length > 0
    ) {
      const dateRangeStr =
        selectionRange.startDate && selectionRange.endDate
          ? `${formatDate(selectionRange.startDate)} - ${formatDate(
              selectionRange.endDate
            )}`
          : "";
      const optionsText =
        selectedOptions.length > 0
          ? `Filtering by: ${selectedOptions.join(", ")}`
          : "";
      if (isMobile) {
        newValue =
          dateRangeStr ||
          (selectedOptions.length > 0
            ? `${selectedOptions.length} filters`
            : "Select");
      } else if (isTablet) {
        if (dateRangeStr && selectedOptions.length > 0) {
          newValue = `${dateRangeStr} (${selectedOptions.length} filters)`;
        } else {
          newValue = dateRangeStr || optionsText || "Select";
        }
      } else {
        if (dateRangeStr && selectedOptions.length > 0) {
          if (selectedOptions.join(", ").length > 30) {
            newValue = `${dateRangeStr} (${selectedOptions.length} filters)`;
          } else {
            newValue = `${dateRangeStr}: ${selectedOptions.join(", ")}`;
          }
        } else {
          newValue = dateRangeStr || optionsText || "Select";
        }
      }
    }
    setValue(newValue);
  }, [selectionRange, selectedOptions, formatDate, isMobile, isTablet]);

  const handleSelect = useCallback((ranges: any) => {
    const { startDate, endDate } = ranges.selection;
    const adjustedStartDate = new Date(
      startDate.getTime() - startDate.getTimezoneOffset() * 60000
    );
    const adjustedEndDate = new Date(
      endDate.getTime() - endDate.getTimezoneOffset() * 60000
    );
    adjustedStartDate.setUTCHours(0, 0, 0, 0);
    adjustedEndDate.setUTCHours(0, 0, 0, 0);
    setDateRange({
      startDate: adjustedStartDate,
      endDate: adjustedEndDate,
      key: "selection",
    });
    setSelectionRange({
      startDate: adjustedStartDate,
      endDate: adjustedEndDate,
      key: "selection",
    });
    hasSelectionRef.current = true;
  }, []);

  const handleApply = useCallback(() => {
    setIsOpen(false);
    onSelect({
      start: selectionRange.startDate
        ? selectionRange.startDate.toISOString().split("T")[0]
        : null,
      end: selectionRange.endDate
        ? selectionRange.endDate.toISOString().split("T")[0]
        : null,
      option: selectedOptions,
    });
    if (onDropdownToggle) onDropdownToggle(false);
  }, [onSelect, selectionRange, selectedOptions, onDropdownToggle]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && buttonRef.current) {
        setTriggerRect(buttonRef.current.getBoundingClientRect());
      }
      setIsOpen(open);
      if (onDropdownToggle) onDropdownToggle(open);
      if (!open) {
        onSelect({
          start: selectionRange.startDate
            ? selectionRange.startDate.toISOString().split("T")[0]
            : null,
          end: selectionRange.endDate
            ? selectionRange.endDate.toISOString().split("T")[0]
            : null,
          option: selectedOptions,
        });
      }
    },
    [onDropdownToggle, onSelect, selectionRange, selectedOptions]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isButtonClick = buttonRef.current?.contains(target);
      const isContentClick = contentRef && contentRef.contains(target);
      if (!isButtonClick && !isContentClick) {
        setIsOpen(false);
        if (onDropdownToggle) onDropdownToggle(false);
        onSelect({
          start: selectionRange.startDate
            ? selectionRange.startDate.toISOString().split("T")[0]
            : null,
          end: selectionRange.endDate
            ? selectionRange.endDate.toISOString().split("T")[0]
            : null,
          option: selectedOptions,
        });
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
        if (
          target instanceof Element &&
          target.closest(".dropdown-trigger-button") !== null
        ) {
          return;
        }
      }

      setIsOpen(false);
      if (onDropdownToggle) onDropdownToggle(false);
      onSelect({
        start: selectionRange.startDate
          ? selectionRange.startDate.toISOString().split("T")[0]
          : null,
        end: selectionRange.endDate
          ? selectionRange.endDate.toISOString().split("T")[0]
          : null,
        option: selectedOptions,
      });
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isOpen) return;

      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const elementAtPoint = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        );

        if (elementAtPoint && contentRef) {
          const isInsideDropdown = contentRef.contains(elementAtPoint);
          const isTriggerButton =
            elementAtPoint.closest(".dropdown-trigger-button") !== null;

          if (isInsideDropdown || isTriggerButton) {
            return;
          }
        }
      }

      handleWindowScroll(event);
    };

    const handleWheel = (event: WheelEvent) => {
      handleWindowScroll(event);
    };

    document.addEventListener("mousedown", handleClickOutside);

    if (isMobile) {
      window.addEventListener("touchmove", handleTouchMove, {
        capture: true,
        passive: false,
      });
    } else {
      window.addEventListener("scroll", handleWindowScroll, { capture: true });
      window.addEventListener("wheel", handleWheel, { capture: true });
    }

    if (contentRef) {
      contentRef.addEventListener("mouseenter", handleMouseEnterDropdown);
      contentRef.addEventListener("mouseleave", handleMouseLeaveDropdown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleWindowScroll, {
        capture: true,
      });
      window.removeEventListener("touchmove", handleTouchMove, {
        capture: true,
      });
      window.removeEventListener("wheel", handleWheel, { capture: true });
      if (contentRef) {
        contentRef.removeEventListener("mouseenter", handleMouseEnterDropdown);
        contentRef.removeEventListener("mouseleave", handleMouseLeaveDropdown);
      }
    };
  }, [
    isOpen,
    onDropdownToggle,
    contentRef,
    onSelect,
    selectionRange,
    selectedOptions,
    isMobile,
  ]);

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

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentDayOfWeek = today.getDay();
  const currentDay = today.getDate();

  const thisWeekStart = new Date();
  const daysSinceMonday = (currentDayOfWeek + 6) % 7;
  thisWeekStart.setDate(currentDay - daysSinceMonday);
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
  lastWeekEnd.setHours(23, 59, 59, 999);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const lastCalendarMonth = new Date(today);
  lastCalendarMonth.setDate(1);
  lastCalendarMonth.setMonth(lastCalendarMonth.getMonth() - 1);
  const lastCalendarMonthEnd = new Date(today);
  lastCalendarMonthEnd.setDate(0);
  lastCalendarMonthEnd.setHours(23, 59, 59, 999);

  const last6MonthsStart = new Date();
  last6MonthsStart.setMonth(last6MonthsStart.getMonth() - 6);
  last6MonthsStart.setHours(0, 0, 0, 0);

  const customRanges = useMemo(
    () => ({
      Today: {
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        endDate: new Date(),
      },
      Yesterday: {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
      },
      "This Week (Mon-Today)": {
        startDate: thisWeekStart,
        endDate: new Date(),
      },
      "Last Week (Mon-Sun)": {
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
      },
      "Last 30 Days": {
        startDate: new Date(new Date().setDate(new Date().getDate() - 29)),
        endDate: new Date(),
      },
      "Last Calendar Month": {
        startDate: lastCalendarMonth,
        endDate: lastCalendarMonthEnd,
      },
      "Last 4 Months": {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 4)),
        endDate: new Date(),
      },
      "Last 6 Months": {
        startDate: last6MonthsStart,
        endDate: new Date(),
      },
      "Last 12 Months": {
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)),
        endDate: new Date(),
      },
      "Last Calendar Year": {
        startDate: new Date(currentYear - 1, 0, 1),
        endDate: new Date(currentYear - 1, 11, 31),
      },
      "This Year (Jan - Today)": {
        startDate: new Date(currentYear, 0, 1),
        endDate: new Date(),
      },
    }),
    [
      currentYear,
      yesterday,
      thisWeekStart,
      lastWeekStart,
      lastWeekEnd,
      lastCalendarMonth,
      lastCalendarMonthEnd,
      last6MonthsStart,
    ]
  );

  const handleOptionSelect = useCallback(
    (option: string) => {
      setSelectedOptions((prevOptions) => {
        const newOptions = prevOptions.includes(option)
          ? prevOptions.filter((opt) => opt !== option)
          : [...prevOptions, option];
        if (
          newOptions.length > 0 ||
          selectionRange.startDate ||
          selectionRange.endDate
        ) {
          hasSelectionRef.current = true;
        }
        return newOptions;
      });
    },
    [selectionRange]
  );

  return (
    <div data-dropdown="date" style={style}>
      <Button
        ref={buttonRef}
        variant="soft"
        className="dropdown-trigger-button"
        onClick={() => handleOpenChange(!isOpen)}
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
        <span ref={spanRef} style={{ fontWeight: 400 }}>
          Date: {value}
        </span>
        <span ref={iconRef} className="flex items-center">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </span>
      </Button>
      <AnimatePresence>
        {isOpen && (
          <DateSelectorDropdownContent
            dateRange={dateRange}
            selectionRange={selectionRange}
            selectedOptions={selectedOptions}
            handleOptionSelect={handleOptionSelect}
            handleSelect={handleSelect}
            handleApply={handleApply}
            stopPropagation={stopPropagation}
            stopWheelPropagation={stopWheelPropagation}
            triggerRect={triggerRect}
            setContentRef={setContentRef}
            customRanges={customRanges}
            onRequestClose={() => setIsOpen(false)}
            triggerButtonRef={buttonRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateSelector;
