import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { TaskData } from "../PreDefinedTasks";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { FaChevronDown } from "react-icons/fa";

interface TaskInputProps {
  task: TaskData & {
    historicalTimeSpent?: number;
    totalTimeSpent?: number;
    measurementType?:
      | "QUANTITY_ONLY"
      | "TIME_ONLY"
      | "BOTH"
      | "COMPLETION_ONLY";
    targetQuantity?: number;
    targetTime?: number;
  };
  isAdHoc?: boolean;
  index: number;
  isMobile: boolean;
  handleInputChange: (
    task: TaskData,
    index: number,
    field: "qty" | "time",
    value: string
  ) => void;
  handleDailyTimeUnitChange: (index: number) => void;
  updateTask: (id: number, qty: number, time: number) => void;
}

const TaskInput: React.FC<TaskInputProps> = React.memo(
  ({
    task,
    index,
    isMobile,
    handleInputChange,
    handleDailyTimeUnitChange,
    updateTask,
    isAdHoc,
  }) => {
    const [timeUnit, setTimeUnit] = useState("hr");
    const [localValue, setLocalValue] = useState("");
    const [previousValue, setPreviousValue] = useState({
      qty: task.qty,
      time: task.time,
    });
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
    });

    const [hasBeenEdited, setHasBeenEdited] = useState(false);
    const [timeHasBeenEdited, setTimeHasBeenEdited] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const isQuantityEnabled = useMemo(() => {
      return (
        task.measurementType === "QUANTITY_ONLY" ||
        task.measurementType === "BOTH" ||
        !task.measurementType
      ); // Default to enabled if not specified
    }, [task.measurementType]);

    const isTimeEnabled = useMemo(() => {
      // If measurementType is explicitly set, respect it first
      if (task.measurementType === "QUANTITY_ONLY") return false;
      if (task.measurementType === "TIME_ONLY") return true;

      // For BOTH or if not specified, enable time unless it's a PROSPECT type
      return (
        task.measurementType === "BOTH" ||
        (!task.measurementType && task.type !== "PROSPECT")
      );
    }, [task.measurementType, task.type]);

    // Initial load only - convert server value (minutes) to hours if needed
    useEffect(() => {
      const value = task.time === "0" ? "" : task.time;
      if (value) {
        const numValue = parseFloat(value);
        if (timeUnit === "hr") {
          setLocalValue(
            numValue === 0
              ? ""
              : (numValue / 60).toFixed(2).replace(/\.00$/, "")
          );
        } else {
          setLocalValue(numValue === 0 ? "" : numValue.toString());
        }
      } else {
        setLocalValue("");
      }
    }, [task.time, timeUnit]);

    useEffect(() => {
      if (isDropdownOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
    }, [isDropdownOpen]);

    const handleTimeUnitChange = useCallback(
      (newTimeUnit: string) => {
        setTimeUnit(newTimeUnit);
        setIsDropdownOpen(false);

        if (localValue) {
          const numValue = parseFloat(localValue);
          if (!isNaN(numValue)) {
            // Convert display value when switching units
            const newValue =
              newTimeUnit === "hr"
                ? (numValue / 60).toFixed(2).replace(/\.00$/, "")
                : (numValue * 60).toString();
            setLocalValue(newValue);
          }
        }
        handleDailyTimeUnitChange(index);
      },
      [localValue, index, handleDailyTimeUnitChange]
    );

    const handleQtyChange = useCallback(
      (value: string) => {
        setHasBeenEdited(true);
        const newQty = parseInt(value) || 0;

        // Update local state
        handleInputChange(task, index, "qty", value);

        // Trigger update without setTimeout
        updateTask(task.id, newQty, parseInt(task.time) || 0);
      },
      [task, index, handleInputChange, updateTask]
    );

    const handleTimeInput = useCallback(
      (value: string) => {
        setTimeHasBeenEdited(true);
        setLocalValue(value);

        const numValue = parseFloat(value) || 0;
        const finalValue = timeUnit === "hr" ? numValue * 60 : numValue;

        // Update local state
        handleInputChange(task, index, "time", finalValue.toString());

        // Trigger update without setTimeout
        updateTask(task.id, parseInt(task.qty) || 0, finalValue);
      },
      [task, index, timeUnit, handleInputChange, updateTask]
    );

    const handleClickOutside = useCallback((event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }, []);

    useEffect(() => {
      if (isDropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isDropdownOpen, handleClickOutside]);
    const inputClasses = useMemo(
      () =>
        `w-full h-full text-xs xl:text-sm bg-transparent outline-none border-none text-center focus:border-blue-950`,
      []
    );

    const containerClasses = useMemo(
      () => ({
        qty: `xl:w-[10%] h-16 rounded-xl text-gray-700 ${
          !isQuantityEnabled ? "bg-gray-200" : "bg-gray-50"
        } flex items-center justify-center focus-within:ring-4 focus-within:ring-blue-950 shadow-md border border-gray-200 transition-all duration-300 ease-in-out ${
          isMobile ? "w-full" : ""
        } ${!isQuantityEnabled ? "cursor-not-allowed" : ""}`,
        time: `xl:w-[15%] h-16 rounded-xl ${
          !isTimeEnabled ? "bg-gray-200" : "bg-gray-50"
        } flex items-center justify-center focus-within:ring-4 focus-within:ring-blue-950 shadow-md border border-gray-200 relative transition-all duration-300 ease-in-out ${
          isMobile ? "w-full" : ""
        } ${
          !isTimeEnabled || task.type === "PROSPECT" ? "cursor-not-allowed" : ""
        }`,
        history: `w-40 h-16 rounded-xl bg-gray-50 flex items-center justify-between px-3 shadow-md border border-gray-200 cursor-not-allowed ${
          isMobile ? "w-full" : ""
        }`,
      }),
      [isMobile, task.type, isQuantityEnabled, isTimeEnabled]
    );

    // Memoize dropdown content to prevent unnecessary re-renders
    const dropdownContent = useMemo(
      () => (
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="fixed bg-white border border-gray-300 rounded-xl shadow-lg z-[9999] overflow-hidden min-w-[100px]"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }}
            >
              {["min", "hr"].map((unit) => (
                <div
                  key={unit}
                  onClick={() => handleTimeUnitChange(unit)}
                  className={`cursor-pointer px-4 py-3 transition-colors duration-150 hover:bg-blue-900 hover:text-white ${
                    timeUnit === unit ? "bg-blue-950 text-white" : ""
                  }`}
                >
                  {unit}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      ),
      [isDropdownOpen, timeUnit, handleTimeUnitChange, dropdownPosition]
    );

    // Format time display function
    const formatTimeDisplay = useCallback((minutes: number) => {
      if (!minutes || minutes === 0) return "0 mins";

      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);

      if (hours === 0) return `${mins} mins`;
      if (mins === 0) return `${hours} hr`;
      return `${hours} hr ${mins} mins`;
    }, []);

    // Calculate total time (current input + historical)
    const totalTime = useMemo(() => {
      const currentTime = parseInt(task.time) || 0;
      const historicalTime = task.historicalTimeSpent || 0;
      return currentTime + historicalTime;
    }, [task.time, task.historicalTimeSpent]);

    return (
      <>
        <div className={containerClasses.qty}>
          <input
            type="number"
            min="0"
            step="1"
            disabled={!isQuantityEnabled}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === ".") {
                e.preventDefault();
              }
            }}
            value={!hasBeenEdited && task.qty === "0" ? "" : task.qty}
            onChange={(e) => handleQtyChange(e.target.value)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            placeholder={isQuantityEnabled ? "Qty" : "N/A"}
            className={`${inputClasses} ${
              !isQuantityEnabled ? "opacity-50" : ""
            }`}
          />
        </div>

        <div className={containerClasses.time}>
          <div className="flex flex-col w-full h-full">
            <div className="flex items-center w-full relative flex-1">
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={!isTimeEnabled}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") {
                    e.preventDefault();
                  }
                }}
                value={localValue}
                onChange={(e) => handleTimeInput(e.target.value)}
                placeholder={!isTimeEnabled ? "N/A" : "Time"}
                className={`${inputClasses} pr-0 ${
                  !isTimeEnabled ? "opacity-50" : ""
                }`}
              />
              {isTimeEnabled && (
                <div className="absolute text-xs 2xl:right-2 xl:right-0 right-4 inset-y-0 flex items-center">
                  <button
                    ref={buttonRef}
                    className="text-xs xl:text-sm text-gray-600 rounded-lg px-2 py-1 cursor-pointer transition-all duration-300 ease-in-out hover:text-blue-900 transform font-semibold flex items-center gap-1"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                  >
                    {timeUnit}
                    <FaChevronDown
                      className={`w-2 h-2 transition-transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {createPortal(dropdownContent, document.body)}
                </div>
              )}
            </div>

            {isAdHoc && (task.historicalTimeSpent ?? 0) > 0 && (
              <div className="flex items-center justify-center w-full py-1 px-2 border-t border-gray-200">
                <span className="2xl:text-xs xl:text-2xs text-xs text-gray-500 font-medium mr-1">
                  Total:
                </span>
                <span className="2xl:text-xs xl:text-2xs text-xs font-semibold text-blue-900">
                  {formatTimeDisplay(totalTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
);

TaskInput.displayName = "TaskInput";

export default TaskInput;
