import React from "react";
import { Button, DropdownMenu } from "@radix-ui/themes";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

const DateSelector: React.FC<dateSelectorProps> = ({
  onSelect,
  defaultValue,
}) => {
  const formatDate = useCallback(
    (date: Date | undefined) =>
      date
        ? `${date.getUTCDate()}/${
            date.getUTCMonth() + 1
          }/${date.getUTCFullYear()}`
        : null,
    []
  );

  const [value, setValue] = useState("Select Date");
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

  const updateDisplayValue = useCallback(() => {
    let newValue = "Select Date";
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
  }, [selectedOptions, selectionRange, formatDate]);

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
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
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
    },
    [onSelect, selectionRange, selectedOptions]
  );

  const handleOptionSelect = useCallback((option: string) => {
    setSelectedOptions((prevOptions) =>
      prevOptions.includes(option)
        ? prevOptions.filter((opt) => opt !== option)
        : [...prevOptions, option]
    );
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
  }, [onSelect, selectionRange, selectedOptions]);

  const customRanges: { [key: string]: { startDate: Date; endDate: Date } } =
    useMemo(
      () => ({
        "Last Week": {
          startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
          endDate: new Date(),
        },
        "Last Two Weeks": {
          startDate: new Date(new Date().setDate(new Date().getDate() - 13)),
          endDate: new Date(),
        },
        "Last Month": {
          startDate: new Date(
            new Date().setMonth(new Date().getMonth() - 1) + 1
          ),
          endDate: new Date(),
        },
        "Last 3 Months": {
          startDate: new Date(
            new Date().setMonth(new Date().getMonth() - 3) + 1
          ),
          endDate: new Date(),
        },
        "Last 4 Months": {
          startDate: new Date(
            new Date().setMonth(new Date().getMonth() - 4) + 1
          ),
          endDate: new Date(),
        },
        "Last 6 Months": {
          startDate: new Date(
            new Date().setMonth(new Date().getMonth() - 6) + 1
          ),
          endDate: new Date(),
        },
        "Last Year": {
          startDate: new Date(
            new Date().setFullYear(new Date().getFullYear() - 1) + 1
          ),
          endDate: new Date(),
        },
      }),
      []
    );

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
            border: "1px solid #f3f4f6",
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
          inputRanges={[]}
          className="w-full md:w-full sm:w-full custom-date-range-picker"
        />
        <div className="flex justify-end mt-4">
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

export default React.memo(DateSelector);
