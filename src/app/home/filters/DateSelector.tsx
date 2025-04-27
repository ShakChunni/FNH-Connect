import { Button, DropdownMenu } from "@radix-ui/themes";
import { useState, useEffect, useRef } from "react";
import { Range, DateRangePicker } from "react-date-range";
import { motion, AnimatePresence } from "framer-motion";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import useMedia from "use-media";

interface dateSelectorProps {
  onSelect: (value: {
    start: string | null;
    end: string | null;
    option: string[];
  }) => void;
  defaultValue: { start: string | null; end: string | null; option: string[] };
}

const DateSelector = ({ onSelect, defaultValue }: dateSelectorProps) => {
  const formatDate = (date: Date | undefined) =>
    date
      ? `${date.getUTCDate()}/${
          date.getUTCMonth() + 1
        }/${date.getUTCFullYear()}`
      : null;

  const [value, setValue] = useState("Select");
  const [isOpen, setIsOpen] = useState(false);
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

  const buttonRef = useRef<HTMLButtonElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const isMobileScreen = useMedia({ maxWidth: "768px" });

  useEffect(() => {
    setSelectionRange({
      startDate: defaultValue.start ? new Date(defaultValue.start) : null,
      endDate: defaultValue.end ? new Date(defaultValue.end) : null,
      key: "selection",
    });
    // Reset dateRange when defaultValue changes and is null
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
    updateDisplayValue();
  }, [defaultValue]);

  useEffect(() => {
    updateDisplayValue();
  }, [selectionRange, selectedOptions]);

  useEffect(() => {
    if (buttonRef.current && spanRef.current && iconRef.current) {
      buttonRef.current.style.width = `${
        spanRef.current.scrollWidth + iconRef.current.scrollWidth + 40
      }px`;
    }
  }, [value]);

  const updateDisplayValue = () => {
    let newValue = "Select Date:";
    if (
      selectedOptions.length > 0 ||
      selectionRange.startDate ||
      selectionRange.endDate
    ) {
      const dateRange =
        selectionRange.startDate && selectionRange.endDate
          ? `${formatDate(selectionRange.startDate)} - ${formatDate(
              selectionRange.endDate
            )}`
          : "";
      const optionsText =
        selectedOptions.length > 0
          ? `Filtering by: ${selectedOptions.join(", ")}`
          : "";
      newValue = [optionsText, dateRange].filter(Boolean).join(": ");
    }
    setValue(newValue);
  };

  const handleSelect = (ranges: any) => {
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
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
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
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOptions((prevOptions) =>
      prevOptions.includes(option)
        ? prevOptions.filter((opt) => opt !== option)
        : [...prevOptions, option]
    );
  };

  const handleApply = () => {
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
  };

  const options = [
    "Prospect Date",
    "Meeting Conducted",
    "Proposal In Progress",
    "Proposal Sent Out",
    "Quotation Signed",
    "Lost Leads",
  ];

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.

  // Calculate the start of this week (Monday)
  // Calculate the start of this week (Sunday)
  const thisWeekStart = new Date();
  thisWeekStart.setDate(currentDay - currentDayOfWeek);
  thisWeekStart.setHours(0, 0, 0, 0);

  // Calculate the end of this week (Saturday)
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // Sunday + 6 days = Saturday
  thisWeekEnd.setHours(23, 59, 59, 999);
  // Calculate the start of last week (Sunday)
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7); // Go back 7 days from this Sunday

  // Calculate the end of last week (Saturday)
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Sunday + 6 days = Saturday
  lastWeekEnd.setHours(23, 59, 59, 999);

  // Calculate yesterday
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  // Calculate last calendar month
  const lastCalendarMonth = new Date(today);
  lastCalendarMonth.setDate(1); // First day of current month
  lastCalendarMonth.setMonth(lastCalendarMonth.getMonth() - 1); // Go to previous month
  const lastCalendarMonthEnd = new Date(today);
  lastCalendarMonthEnd.setDate(0); // Last day of previous month
  lastCalendarMonthEnd.setHours(23, 59, 59, 999);

  const last6MonthsStart = new Date();
  last6MonthsStart.setMonth(last6MonthsStart.getMonth() - 6);
  last6MonthsStart.setHours(0, 0, 0, 0);

  const customRanges: { [key: string]: { startDate: Date; endDate: Date } } = {
    Today: {
      startDate: new Date(today.setHours(0, 0, 0, 0)),
      endDate: new Date(),
    },
    Yesterday: {
      startDate: yesterday,
      endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
    },
    "This Week (Sun - Today)": {
      startDate: thisWeekStart,
      endDate: new Date(),
    },
    "Last Week (Sun - Sat)": {
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
      startDate: new Date(currentYear - 1, 0, 1), // Jan 1st of previous year
      endDate: new Date(currentYear - 1, 11, 31), // Dec 31st of previous year
    },
    "This Year (Jan - Today)": {
      startDate: new Date(currentYear, 0, 1), // Jan 1st of current year
      endDate: new Date(), // Today
    },
  };

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenu.Trigger>
        <Button
          ref={buttonRef}
          variant="soft"
          className="dropdown-trigger-button"
          style={{
            backgroundColor: "white",
            color: "black",
            border: "1px solid #f3f4f6", // gray-100
            borderRadius: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            textWrap: "nowrap",
            padding: "10px 20px",
            whiteSpace: "nowrap",
            transition:
              "width 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            cursor: "pointer",
            height: "50px",
            fontSize: isMobileScreen ? "14px" : "16px",

            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // shadow-md
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#1e3a8a"; // blue-950
            e.currentTarget.style.color = "#1e3a8a"; // blue-950
            e.currentTarget.style.borderWidth = "2px";
            e.currentTarget.style.borderRadius = "12px";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#f3f4f6"; // gray-100
            e.currentTarget.style.color = "black";
            e.currentTarget.style.borderWidth = "1px";
            e.currentTarget.style.borderRadius = "10px";
          }}
        >
          <span ref={spanRef}>{value}</span>
          <span ref={iconRef}>
            <DropdownMenu.TriggerIcon />
          </span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        className={`dropdown-content ${
          isOpen ? "animate-dropdown-open" : "animate-dropdown-close"
        }`}
        style={{ width: "auto", padding: "10px", maxWidth: "100%" }}
      >
        <motion.div
          className="flex flex-col flex-wrap justify-center gap-2 mb-4 md:flex-col lg:flex-row sm:text-xs md:text-sm lg:text-base"
          layout
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
                className={`flex items-center justify-center p-2 rounded-xl cursor-pointer transition-colors duration-300 ${
                  selectedOptions.includes(option)
                    ? "bg-blue-950 text-white"
                    : "bg-white text-blue-950 border border-blue-900"
                } text-xs sm:text-sm md:text-base`}
                style={{
                  minWidth: "120px",
                  flex: "1 0 auto",
                }}
                onClick={() => handleOptionSelect(option)}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{option}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <DateRangePicker
          ranges={[dateRange]}
          onChange={handleSelect}
          moveRangeOnFirstSelection={false}
          months={isMobileScreen ? 1 : 2}
          direction={isMobileScreen ? "vertical" : "horizontal"}
          showPreview={!!selectionRange.startDate || !!selectionRange.endDate}
          staticRanges={
            isMobileScreen
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
          inputRanges={[]} // Removed the input ranges as requested
          className="w-full md:w-full sm:w-full custom-date-range-picker"
        />
        <div className="flex justify-end ">
          <Button
            onClick={handleApply}
            className="rounded-xl bg-blue-950 hover:bg-blue-900 text-white px-4 py-2 sm:text-xs md:text-sm lg:text-base"
            style={{ cursor: "pointer" }}
          >
            Apply
          </Button>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default DateSelector;
