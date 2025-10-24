import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Flatpickr from "react-flatpickr";
import { X } from "lucide-react";
import "flatpickr/dist/flatpickr.min.css";

interface AgeObject {
  years: number;
  months: number;
  days: number;
}

interface DobDropdownProps {
  value: Date | null;
  onChange: (date: Date | null, age?: AgeObject) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const calculateAge = (dob: Date): AgeObject => {
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();

  if (days < 0) {
    const prevMonth = (now.getMonth() - 1 + 12) % 12;
    const prevMonthYear =
      prevMonth === 11 ? now.getFullYear() - 1 : now.getFullYear();
    days += daysInMonth(prevMonthYear, prevMonth);
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }

  return { years, months, days };
};

const clampNumberInput = (v: number) =>
  Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;

const DobDropdown: React.FC<DobDropdownProps> = ({
  value,
  onChange,
  placeholder = "Select date of birth",
  style,
}) => {
  const flatpickrRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [years, setYears] = useState<number | "">(() =>
    value ? calculateAge(value).years : ""
  );
  const [months, setMonths] = useState<number | "">(() =>
    value ? calculateAge(value).months : ""
  );
  const [days, setDays] = useState<number | "">(() =>
    value ? calculateAge(value).days : ""
  );

  // sync from parent value
  useEffect(() => {
    setSelectedDate(value);
    if (value) {
      const a = calculateAge(value);
      setYears(a.years);
      setMonths(a.months);
      setDays(a.days);
    } else {
      setYears("");
      setMonths("");
      setDays("");
      // Force clear the Flatpickr input when value is null
      if (flatpickrRef.current && flatpickrRef.current.flatpickr) {
        flatpickrRef.current.flatpickr.clear();
      }
    }
  }, [value]);

  const flatpickrOptions = useMemo(
    () => ({
      dateFormat: "F j, Y",
      maxDate: "today",
      allowInput: true,
      onOpen: (_selectedDates: Date[], _dateStr: string, instance: any) => {
        if (!selectedDate && instance && instance.input) {
          // leave blank
        }
      },
    }),
    [selectedDate]
  );

  const handleDateChange = useCallback(
    (dates: Date[]) => {
      const date = dates && dates[0] ? dates[0] : null;
      setSelectedDate(date);
      if (date) {
        const age = calculateAge(date);
        setYears(age.years);
        setMonths(age.months);
        setDays(age.days);
        onChange(date, age);
      } else {
        setYears("");
        setMonths("");
        setDays("");
        onChange(null);
      }
    },
    [onChange]
  );

  const composeDateFromAge = useCallback(
    (y: number | "", m: number | "", d: number | "") => {
      const anyFilled = !(y === "" && m === "" && d === "");
      if (!anyFilled) {
        setSelectedDate(null);
        // Force clear Flatpickr
        if (flatpickrRef.current && flatpickrRef.current.flatpickr) {
          flatpickrRef.current.flatpickr.clear();
        }
        onChange(null);
        return;
      }

      const yearsNum = clampNumberInput(Number(y || 0));
      const monthsNum = clampNumberInput(Number(m || 0));
      const daysNum = clampNumberInput(Number(d || 0));

      const now = new Date();
      // start with today then subtract
      const composed = new Date(now.getTime());
      composed.setFullYear(composed.getFullYear() - yearsNum);
      // subtract months
      composed.setMonth(composed.getMonth() - monthsNum);
      // subtract days
      composed.setDate(composed.getDate() - daysNum);

      // normalize and compute accurate age
      const age = calculateAge(composed);
      setSelectedDate(composed);
      setYears(age.years);
      setMonths(age.months);
      setDays(age.days);
      onChange(composed, age);
    },
    [onChange]
  );

  const handleYearsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const parsed = raw === "" ? "" : parseInt(raw, 10);
      const val =
        parsed === "" || Number.isNaN(parsed) ? "" : Math.max(0, parsed);
      setYears(val);
      composeDateFromAge(val, months, days);
    },
    [composeDateFromAge, months, days]
  );

  const handleMonthsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const parsed = raw === "" ? "" : parseInt(raw, 10);
      // clamp months to 0-11 for input UX
      const val =
        parsed === "" || Number.isNaN(parsed)
          ? ""
          : Math.max(0, Math.min(11, parsed));
      setMonths(val);
      composeDateFromAge(years, val, days);
    },
    [composeDateFromAge, years, days]
  );

  const handleDaysChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const parsed = raw === "" ? "" : parseInt(raw, 10);
      const val =
        parsed === "" || Number.isNaN(parsed)
          ? ""
          : Math.max(0, Math.min(31, parsed));
      setDays(val);
      composeDateFromAge(years, months, val);
    },
    [composeDateFromAge, years, months]
  );

  const clearAll = useCallback(() => {
    setSelectedDate(null);
    setYears("");
    setMonths("");
    setDays("");
    // Force clear Flatpickr
    if (flatpickrRef.current && flatpickrRef.current.flatpickr) {
      flatpickrRef.current.flatpickr.clear();
    }
    onChange(null);
  }, [onChange]);

  // Check if any age input has a meaningful value (not 0 and not empty)
  const hasValidYears = years !== "" && years !== 0;
  const hasValidMonths = months !== "" && months !== 0;
  const hasValidDays = days !== "" && days !== 0;
  const hasAnyValidAge = hasValidYears || hasValidMonths || hasValidDays;

  const hasAnyValue = selectedDate || hasAnyValidAge;

  // Input styling function matching PatientInformation
  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";

    return (hasValue: boolean) => {
      if (hasValue) {
        return `bg-white border-2 border-green-700 ${baseStyle}`;
      } else {
        return `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
      }
    };
  }, []);

  const ageInputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-3 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

    return (hasValue: boolean) => {
      if (hasValue) {
        return `bg-white border-2 border-green-700 pr-8 ${baseStyle}`;
      } else {
        return `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
      }
    };
  }, []);

  return (
    <div
      style={style}
      className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4"
    >
      {/* Date Picker */}
      <div className="w-full md:w-1/2 relative">
        <Flatpickr
          ref={flatpickrRef}
          value={selectedDate ? [selectedDate] : []}
          onChange={handleDateChange}
          options={flatpickrOptions}
          placeholder={placeholder}
          className={`${inputClassName(!!selectedDate)} pr-10 cursor-pointer`}
        />
        {selectedDate && (
          <button
            type="button"
            onClick={clearAll}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Age Inputs */}
      <div className="w-full md:w-1/2 relative">
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className={ageInputClassName(hasValidYears)}
              value={years === "" ? "" : years}
              onChange={handleYearsChange}
              onWheel={(e) => (e.target as HTMLElement).blur()}
              placeholder="Years"
              aria-label="Years"
            />
            {hasValidYears && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                {years === 1 ? "yr" : "yrs"}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={11}
              className={ageInputClassName(hasValidMonths)}
              value={months === "" ? "" : months}
              onChange={handleMonthsChange}
              onWheel={(e) => (e.target as HTMLElement).blur()}
              placeholder="Months"
              aria-label="Months"
            />
            {hasValidMonths && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                {months === 1 ? "mo" : "mos"}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={31}
              className={ageInputClassName(hasValidDays)}
              value={days === "" ? "" : days}
              onChange={handleDaysChange}
              onWheel={(e) => (e.target as HTMLElement).blur()}
              placeholder="Days"
              aria-label="Days"
            />
            {hasValidDays && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                {days === 1 ? "day" : "days"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DobDropdown);
