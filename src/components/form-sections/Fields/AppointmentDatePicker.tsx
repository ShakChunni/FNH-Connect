import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Flatpickr from "react-flatpickr";
import { X, Calendar } from "lucide-react";
import "flatpickr/dist/flatpickr.min.css";

interface AppointmentDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  minDate?: string | Date;
  label?: string;
}

/**
 * Appointment Date Picker Component
 * Uses Flatpickr for selecting future dates (appointments, follow-ups, etc.)
 * Similar styling to DOB dropdown but without age calculation
 */
const AppointmentDatePicker: React.FC<AppointmentDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  style,
  minDate = "today",
  label,
}) => {
  const flatpickrRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);

  // Sync from parent value
  useEffect(() => {
    setSelectedDate(value);
    if (!value && flatpickrRef.current && flatpickrRef.current.flatpickr) {
      flatpickrRef.current.flatpickr.clear();
    }
  }, [value]);

  const flatpickrOptions = useMemo(
    () => ({
      dateFormat: "F j, Y",
      minDate: minDate,
      allowInput: true,
      // Ensure flatpickr calendar is appended to body and above modal overlay
      appendTo: typeof document !== "undefined" ? document.body : undefined,
      onReady: (_selectedDates: Date[], _dateStr: string, instance: any) => {
        if (instance && instance.calendarContainer) {
          instance.calendarContainer.style.zIndex = "110000";
        }
      },
    }),
    [minDate]
  );

  const handleDateChange = useCallback(
    (dates: Date[]) => {
      const date = dates && dates[0] ? dates[0] : null;
      setSelectedDate(date);
      onChange(date);
    },
    [onChange]
  );

  const clearDate = useCallback(() => {
    setSelectedDate(null);
    if (flatpickrRef.current && flatpickrRef.current.flatpickr) {
      flatpickrRef.current.flatpickr.clear();
    }
    onChange(null);
  }, [onChange]);

  // Input styling function matching PatientInformation
  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";

    return selectedDate
      ? `bg-white border-2 border-green-700 ${baseStyle}`
      : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
  }, [selectedDate]);

  return (
    <div style={style} className="w-full">
      <div className="relative">
        <Calendar
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10"
          size={18}
        />
        <Flatpickr
          ref={flatpickrRef}
          value={selectedDate ? [selectedDate] : []}
          onChange={handleDateChange}
          options={flatpickrOptions}
          placeholder={placeholder}
          className={`${inputClassName} pl-10 pr-10 cursor-pointer`}
        />
        {selectedDate && (
          <button
            type="button"
            onClick={clearDate}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(AppointmentDatePicker);
