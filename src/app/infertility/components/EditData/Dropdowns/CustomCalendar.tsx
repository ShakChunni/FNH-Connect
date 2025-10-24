import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { format } from "date-fns";

const colorClasses = {
  indigo: {
    border: "border-indigo-200",
    headerBg: "bg-white",
    headerText: "text-gray-900",
    todayBg: "bg-indigo-100",
    todayText: "text-indigo-700",
    todayBorder: "border-indigo-300",
    selectedBg: "bg-indigo-500",
    selectedText: "text-white",
    selectedShadow: "shadow-sm",
    dayText: "text-gray-700",
    dayHoverBg: "hover:bg-indigo-50",
    dayHoverText: "hover:text-indigo-600",
    disabledText: "text-gray-300",
    chevron: "text-indigo-600",
    chevronHover: "hover:bg-indigo-50",
    monthYearHover: "hover:bg-indigo-50",
    dropdownBg: "bg-white",
    dropdownBorder: "border-indigo-200",
    dropdownShadow: "shadow-lg",
    dropdownItemHover: "hover:bg-indigo-50",
  },
  emerald: {
    border: "border-emerald-200",
    headerBg: "bg-white",
    headerText: "text-gray-900",
    todayBg: "bg-emerald-100",
    todayText: "text-emerald-700",
    todayBorder: "border-emerald-300",
    selectedBg: "bg-emerald-500",
    selectedText: "text-white",
    selectedShadow: "shadow-sm",
    dayText: "text-gray-700",
    dayHoverBg: "hover:bg-emerald-50",
    dayHoverText: "hover:text-emerald-600",
    disabledText: "text-gray-300",
    chevron: "text-emerald-600",
    chevronHover: "hover:bg-emerald-50",
    monthYearHover: "hover:bg-emerald-50",
    dropdownBg: "bg-white",
    dropdownBorder: "border-emerald-200",
    dropdownShadow: "shadow-lg",
    dropdownItemHover: "hover:bg-emerald-50",
  },
  amber: {
    border: "border-amber-200",
    headerBg: "bg-white",
    headerText: "text-gray-900",
    todayBg: "bg-amber-100",
    todayText: "text-amber-700",
    todayBorder: "border-amber-300",
    selectedBg: "bg-amber-500",
    selectedText: "text-white",
    selectedShadow: "shadow-sm",
    dayText: "text-gray-700",
    dayHoverBg: "hover:bg-amber-50",
    dayHoverText: "hover:text-amber-600",
    disabledText: "text-gray-300",
    chevron: "text-amber-600",
    chevronHover: "hover:bg-amber-50",
    monthYearHover: "hover:bg-amber-50",
    dropdownBg: "bg-white",
    dropdownBorder: "border-amber-200",
    dropdownShadow: "shadow-lg",
    dropdownItemHover: "hover:bg-amber-50",
  },
  purple: {
    border: "border-purple-200",
    headerBg: "bg-white",
    headerText: "text-gray-900",
    todayBg: "bg-purple-100",
    todayText: "text-purple-700",
    todayBorder: "border-purple-300",
    selectedBg: "bg-purple-500",
    selectedText: "text-white",
    selectedShadow: "shadow-sm",
    dayText: "text-gray-700",
    dayHoverBg: "hover:bg-purple-50",
    dayHoverText: "hover:text-purple-600",
    disabledText: "text-gray-300",
    chevron: "text-purple-600",
    chevronHover: "hover:bg-purple-50",
    monthYearHover: "hover:bg-purple-50",
    dropdownBg: "bg-white",
    dropdownBorder: "border-purple-200",
    dropdownShadow: "shadow-lg",
    dropdownItemHover: "hover:bg-purple-50",
  },
  rose: {
    border: "border-rose-200",
    headerBg: "bg-white",
    headerText: "text-gray-900",
    todayBg: "bg-rose-100",
    todayText: "text-rose-700",
    todayBorder: "border-rose-300",
    selectedBg: "bg-rose-500",
    selectedText: "text-white",
    selectedShadow: "shadow-sm",
    dayText: "text-gray-700",
    dayHoverBg: "hover:bg-rose-50",
    dayHoverText: "hover:text-rose-600",
    disabledText: "text-gray-300",
    chevron: "text-rose-600",
    chevronHover: "hover:bg-rose-50",
    monthYearHover: "hover:bg-rose-50",
    dropdownBg: "bg-white",
    dropdownBorder: "border-rose-200",
    dropdownShadow: "shadow-lg",
    dropdownItemHover: "hover:bg-rose-50",
  },
} as const;

type ColorScheme = keyof typeof colorClasses;

interface CustomCalendarProps {
  selectedDisplayDate: Date | null;
  handleDateSelect: (date: Date) => void;
  colorScheme?: ColorScheme;
  minDate?: Date;
  maxDate?: Date;
}

const TODAY = new Date();

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  selectedDisplayDate,
  handleDateSelect,
  colorScheme = "indigo",
  minDate,
  maxDate,
}) => {
  const [currentDate, setCurrentDate] = useState(
    () => selectedDisplayDate || new Date()
  );
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const today = TODAY;
  const colors = colorClasses[colorScheme];
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  // Generate year range (current year ± 50 years, but clamp to min/max)
  const currentYear = new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : currentYear - 50;
  const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 50;
  const yearRange = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  useEffect(() => {
    setCurrentDate(selectedDisplayDate || new Date());
  }, [selectedDisplayDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showYearDropdown && yearListRef.current) {
      const selectedYearIndex = yearRange.findIndex(
        (year) => year === currentDate.getFullYear()
      );
      if (selectedYearIndex !== -1) {
        const yearElement = yearListRef.current.children[
          selectedYearIndex
        ] as HTMLElement;
        if (yearElement) {
          yearElement.scrollIntoView({ block: "center", behavior: "instant" });
        }
      }
    }
  }, [showYearDropdown, currentDate, yearRange]);

  const currentMonthYear = useMemo(
    () => ({
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    }),
    [currentDate]
  );

  const todayInfo = useMemo(
    () => ({
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
    }),
    [today]
  );

  const selectedInfo = useMemo(() => {
    if (!selectedDisplayDate) return null;
    return {
      day: selectedDisplayDate.getDate(),
      month: selectedDisplayDate.getMonth(),
      year: selectedDisplayDate.getFullYear(),
    };
  }, [selectedDisplayDate]);

  const isToday = (day: number) => {
    return (
      todayInfo.day === day &&
      todayInfo.month === currentMonthYear.month &&
      todayInfo.year === currentMonthYear.year
    );
  };

  const isSelected = (day: number) => {
    if (!selectedInfo) return false;
    return (
      selectedInfo.day === day &&
      selectedInfo.month === currentMonthYear.month &&
      selectedInfo.year === currentMonthYear.year
    );
  };

  const isDisabled = (day: number) => {
    const dayDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    dayDate.setHours(0, 0, 0, 0);
    if (minDate && dayDate < minDate) return true;
    if (maxDate && dayDate > maxDate) return true;
    return false;
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate((prev) => new Date(year, prev.getMonth(), 1));
    setShowYearDropdown(false);
  };

  const handleMonthYearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowYearDropdown(!showYearDropdown);
  };

  const handleDayClick = (day: number) => {
    if (isDisabled(day)) return;
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    handleDateSelect(newDate);
  };

  const handleYearDropdownScroll = (e: React.UIEvent) => {
    e.stopPropagation();
  };

  const handleYearItemClick = (e: React.MouseEvent, year: number) => {
    e.stopPropagation();
    handleYearSelect(year);
  };

  return (
    <div
      className={`bg-white ${colors.border} border rounded-3xl ${colors.dropdownShadow} p-4 w-full max-w-[300px]`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className={`p-2 ${colors.chevronHover} rounded-3xl transition-colors`}
          aria-label="Previous month"
        >
          <ChevronLeft className={`w-4 h-4 ${colors.chevron}`} />
        </button>

        <div className="relative" ref={yearDropdownRef}>
          <button
            type="button"
            onClick={handleMonthYearClick}
            className={`px-3 py-2 ${colors.monthYearHover} rounded-3xl transition-colors flex items-center gap-2`}
            aria-haspopup="listbox"
            aria-expanded={showYearDropdown}
          >
            <h3 className={`text-sm font-semibold ${colors.headerText}`}>
              {format(currentDate, "MMM yyyy")}
            </h3>
            <ChevronDown
              className={`w-4 h-4 ${colors.chevron} transition-transform ${
                showYearDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showYearDropdown && (
            <div
              data-year-dropdown="true"
              className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 ${colors.dropdownBg} ${colors.dropdownBorder} border rounded-3xl ${colors.dropdownShadow} z-50 w-24 max-h-40 overflow-y-auto`}
              onScroll={handleYearDropdownScroll}
              ref={yearListRef}
              onClick={(e) => e.stopPropagation()}
              role="listbox"
            >
              {yearRange.map((year) => (
                <button
                  key={year}
                  type="button"
                  data-year-dropdown="true"
                  onClick={(e) => handleYearItemClick(e, year)}
                  className={`w-full px-3 py-2 text-sm ${
                    colors.dropdownItemHover
                  } transition-colors first:rounded-t-3xl last:rounded-b-3xl ${
                    year === currentDate.getFullYear()
                      ? `${colors.selectedBg} ${colors.selectedText}`
                      : colors.headerText
                  }`}
                  role="option"
                  aria-selected={year === currentDate.getFullYear()}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className={`p-2 ${colors.chevronHover} rounded-3xl transition-colors`}
          aria-label="Next month"
        >
          <ChevronRight className={`w-4 h-4 ${colors.chevron}`} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-3">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div
        key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
        className="grid grid-cols-7 gap-1"
      >
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="w-9 h-9" />
        ))}
        {days.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => handleDayClick(day)}
            disabled={isDisabled(day)}
            className={[
              "w-9 h-9 text-sm rounded-3xl font-medium flex items-center justify-center",
              isDisabled(day)
                ? `${colors.disabledText} cursor-not-allowed`
                : isSelected(day)
                ? `${colors.selectedBg} ${colors.selectedText} ${colors.selectedShadow}`
                : isToday(day)
                ? `${colors.todayBg} ${colors.todayText} border ${colors.todayBorder} font-semibold`
                : `${colors.dayText} ${colors.dayHoverBg} ${colors.dayHoverText}`,
            ].join(" ")}
            aria-label={`Select ${format(
              new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
              "dd MMM yyyy"
            )}`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {selectedDisplayDate
            ? `Selected: ${format(selectedDisplayDate, "dd/MM/yyyy")}`
            : "Select a date"}
        </p>
      </div>
    </div>
  );
};

export default CustomCalendar;
