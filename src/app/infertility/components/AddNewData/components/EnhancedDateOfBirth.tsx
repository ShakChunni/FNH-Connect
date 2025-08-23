import React, { useState, useEffect, useCallback } from "react";
import {
  isValid,
  isAfter,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  addYears,
  addMonths,
  subYears,
  subMonths,
  subDays,
} from "date-fns";
import CustomCalendar from "../Dropdowns/CustomCalendar";

interface EnhancedDateOfBirthProps {
  value?: Date | null;
  onChange: (
    date: Date | null,
    age?: { years: number; months: number; days: number }
  ) => void;
  minDate?: Date;
  maxDate?: Date;
  colorScheme?: "indigo" | "emerald" | "amber" | "purple" | "rose";
  label?: string;
  placeholder?: string;
  error?: string;
}

function clampDate(date: Date, min?: Date, max?: Date): Date {
  let d = date;
  if (min && isAfter(min, d)) d = min;
  if (max && isAfter(d, max)) d = max;
  return d;
}

function getAgeFromDate(date: Date, today: Date) {
  if (!date || !isValid(date)) return { years: 0, months: 0, days: 0 };

  let years = differenceInYears(today, date);
  let tempDate = addYears(date, years);
  let months = differenceInMonths(today, tempDate);
  tempDate = addMonths(tempDate, months);
  let days = differenceInDays(today, tempDate);

  // Ensure non-negative values
  if (months < 0) {
    years -= 1;
    months = 12 + months;
  }
  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    ).getDate();
    days = daysInPrevMonth + days;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
  };
}

function getDateFromAge(
  age: { years: number; months: number; days: number },
  today: Date
) {
  let date = subYears(today, age.years);
  date = subMonths(date, age.months);
  date = subDays(date, age.days);
  return date;
}

const today = new Date();

const EnhancedDateOfBirth: React.FC<EnhancedDateOfBirthProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  colorScheme = "indigo",
  label = "Date of Birth",
  placeholder = "Select date of birth",
  error,
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

  const [inputMode, setInputMode] = useState<"calendar" | "age">("calendar");

  // Sync age fields when date changes
  useEffect(() => {
    if (selectedDate && isValid(selectedDate)) {
      const ageData = getAgeFromDate(selectedDate, today);
      setAge({
        years: ageData.years.toString(),
        months: ageData.months.toString(),
        days: ageData.days.toString(),
      });
    } else {
      setAge({ years: "", months: "", days: "" });
    }
  }, [selectedDate]);

  // Sync date when age fields change (only when in age input mode)
  useEffect(() => {
    if (inputMode === "age" && (age.years || age.months || age.days)) {
      const ageData = {
        years: parseInt(age.years) || 0,
        months: parseInt(age.months) || 0,
        days: parseInt(age.days) || 0,
      };

      const date = getDateFromAge(ageData, today);
      if (isValid(date) && !isAfter(date, today)) {
        const clampedDate = clampDate(date, minDate, maxDate);
        setSelectedDate(clampedDate);
        onChange(clampedDate, ageData);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [age.years, age.months, age.days, inputMode, minDate, maxDate]);

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
      const clampedDate = clampDate(date, minDate, maxDate);
      setSelectedDate(clampedDate);
      const ageData = getAgeFromDate(clampedDate, today);
      onChange(clampedDate, ageData);
      setAge({
        years: ageData.years.toString(),
        months: ageData.months.toString(),
        days: ageData.days.toString(),
      });
    },
    [onChange, minDate, maxDate]
  );

  const handleAgeInput = (field: "years" | "months" | "days", val: string) => {
    // Only allow numbers and empty string
    if (/^\d*$/.test(val)) {
      // Apply reasonable limits
      let numVal = parseInt(val) || 0;
      if (field === "years" && numVal > 150) numVal = 150;
      if (field === "months" && numVal > 11) numVal = 11;
      if (field === "days" && numVal > 31) numVal = 31;

      setAge((prev) => ({
        ...prev,
        [field]: numVal > 0 ? numVal.toString() : "",
      }));
    }
  };

  // Prevent future dates
  const calendarMaxDate = maxDate ?? today;

  return (
    <div className="space-y-4">
      {/* Label and Input Mode Toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-gray-700 text-sm font-semibold">
          {label}
        </label>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setInputMode("calendar")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              inputMode === "calendar"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setInputMode("age")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              inputMode === "age"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Age
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

      {/* Input Content */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {inputMode === "calendar" ? (
          /* Calendar Mode */
          <div className="p-4">
            <CustomCalendar
              selectedDisplayDate={selectedDate}
              handleDateSelect={handleCalendarSelect}
              colorScheme={colorScheme}
              minDate={minDate}
              maxDate={calendarMaxDate}
            />
            {selectedDate && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Selected:</span>{" "}
                  {selectedDate.toLocaleDateString()}
                </div>
                {age.years && (
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Age:</span> {age.years} years,{" "}
                    {age.months} months, {age.days} days
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Age Input Mode */
          <div className="p-6">
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                Enter Age
              </h4>
              <p className="text-sm text-gray-600">
                We'll calculate the date of birth automatically
              </p>
            </div>

            <div className="flex justify-center gap-4 mb-6">
              <div className="flex flex-col items-center">
                <label className="text-xs font-medium text-gray-600 mb-2">
                  Years
                </label>
                <input
                  type="number"
                  min={0}
                  max={150}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  value={age.years}
                  onChange={(e) => handleAgeInput("years", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex flex-col items-center">
                <label className="text-xs font-medium text-gray-600 mb-2">
                  Months
                </label>
                <input
                  type="number"
                  min={0}
                  max={11}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  value={age.months}
                  onChange={(e) => handleAgeInput("months", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex flex-col items-center">
                <label className="text-xs font-medium text-gray-600 mb-2">
                  Days
                </label>
                <input
                  type="number"
                  min={0}
                  max={31}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  value={age.days}
                  onChange={(e) => handleAgeInput("days", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {selectedDate && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <span className="font-medium">Calculated DOB:</span>{" "}
                  {selectedDate.toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDateOfBirth;
