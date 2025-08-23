import React, { useState, useEffect, useCallback } from "react";
import CustomCalendar from "./CustomCalendar";
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  addYears,
  addMonths,
  addDays,
  isAfter,
  isValid,
  subYears,
  subMonths,
  subDays,
} from "date-fns";

interface DateOfBirthDropdownProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  colorScheme?: "indigo" | "emerald" | "amber" | "purple" | "rose";
}

function clampDate(date: Date, min?: Date, max?: Date): Date {
  let d = date;
  if (min && isAfter(min, d)) d = min;
  if (max && isAfter(d, max)) d = max;
  return d;
}

function getAgeFromDate(date: Date, today: Date) {
  if (!date || !isValid(date)) return { years: "", months: "", days: "" };
  let years = differenceInYears(today, date);
  let months = differenceInMonths(today, addYears(date, years));
  let days = differenceInDays(today, addYears(addMonths(date, months), years));
  // Adjust for negative values
  if (months < 0) months = 0;
  if (days < 0) days = 0;
  return {
    years: years.toString(),
    months: months.toString(),
    days: days.toString(),
  };
}

function getDateFromAge(
  { years, months, days }: { years: string; months: string; days: string },
  today: Date
) {
  let y = parseInt(years) || 0;
  let m = parseInt(months) || 0;
  let d = parseInt(days) || 0;
  let date = subYears(today, y);
  date = subMonths(date, m);
  date = subDays(date, d);
  return date;
}

const today = new Date();

const DateOfBirthDropdown: React.FC<DateOfBirthDropdownProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  colorScheme = "indigo",
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ?? null);
  const [age, setAge] = useState<{
    years: string;
    months: string;
    days: string;
  }>({
    years: "",
    months: "",
    days: "",
  });

  // Sync age fields when date changes
  useEffect(() => {
    if (selectedDate && isValid(selectedDate)) {
      setAge(getAgeFromDate(selectedDate, today));
    } else {
      setAge({ years: "", months: "", days: "" });
    }
  }, [selectedDate]);

  // Sync date when age fields change
  useEffect(() => {
    // Only update if at least one field is filled
    if (age.years || age.months || age.days) {
      const date = getDateFromAge(age, today);
      if (isValid(date) && !isAfter(date, today)) {
        setSelectedDate(date);
        onChange(date);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [age.years, age.months, age.days]);

  // Sync with parent value
  useEffect(() => {
    if (
      value &&
      (!selectedDate || value.getTime() !== selectedDate.getTime())
    ) {
      setSelectedDate(value);
    }
  }, [value]);

  const handleCalendarSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onChange(date);
      setAge(getAgeFromDate(date, today));
    },
    [onChange]
  );

  const handleAgeInput = (field: "years" | "months" | "days", val: string) => {
    // Only allow numbers and empty string
    if (/^\d*$/.test(val)) {
      setAge((prev) => ({
        ...prev,
        [field]: val,
      }));
    }
  };

  // Prevent future dates
  const calendarMaxDate = maxDate ?? today;

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {/* Calendar Side */}
      <div className="flex-1 min-w-[260px]">
        <CustomCalendar
          selectedDisplayDate={selectedDate}
          handleDateSelect={handleCalendarSelect}
          colorScheme={colorScheme}
          minDate={minDate}
          maxDate={calendarMaxDate}
        />
      </div>
      {/* Age Input Side */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white border border-gray-200 rounded-3xl shadow-lg p-6 min-w-[220px]">
        <div className="w-full flex flex-col gap-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2 text-center">
            Enter Age
          </label>
          <div className="flex flex-row gap-2 justify-center">
            <div className="flex flex-col items-center">
              <input
                type="number"
                min={0}
                max={150}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center text-base focus:ring-2 focus:ring-indigo-400"
                value={age.years}
                onChange={(e) => handleAgeInput("years", e.target.value)}
                aria-label="Years"
              />
              <span className="text-xs text-gray-500 mt-1">Years</span>
            </div>
            <div className="flex flex-col items-center">
              <input
                type="number"
                min={0}
                max={11}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center text-base focus:ring-2 focus:ring-indigo-400"
                value={age.months}
                onChange={(e) => handleAgeInput("months", e.target.value)}
                aria-label="Months"
              />
              <span className="text-xs text-gray-500 mt-1">Months</span>
            </div>
            <div className="flex flex-col items-center">
              <input
                type="number"
                min={0}
                max={31}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-14 px-2 py-2 border border-gray-300 rounded-lg text-center text-base focus:ring-2 focus:ring-indigo-400"
                value={age.days}
                onChange={(e) => handleAgeInput("days", e.target.value)}
                aria-label="Days"
              />
              <span className="text-xs text-gray-500 mt-1">Days</span>
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-400 text-center">
          <span>
            {selectedDate
              ? `DOB: ${selectedDate.toLocaleDateString()}`
              : "Select date or enter age"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DateOfBirthDropdown;
