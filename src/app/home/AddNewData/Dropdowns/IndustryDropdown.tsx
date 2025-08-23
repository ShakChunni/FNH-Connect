import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FC,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Text } from "@radix-ui/themes";
import { FixedSizeList } from "react-window";
import industryJson from "../../../../data/industry.json";

interface IndustryDropdownProps {
  onSelect: (value: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  options?: string[];
  onNotification?: (
    message: string,
    type: "success" | "error" | "info"
  ) => void;
  disabled?: boolean;
}

const defaultIndustries: string[] = industryJson.industries;

const IndustryDropdown: FC<IndustryDropdownProps> = ({
  onSelect,
  defaultValue = "",
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
  options = [],
  onNotification,
  disabled = false,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownReady, setIsDropdownReady] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [customValue, setCustomValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      // Always close the dropdown with animation, regardless of disabled state
      setIsOpen(false);
      setIsCreatingNew(false);
      setSearchTerm("");
      onDropdownToggle(false);
      onDropdownOpenStateChange(false);

      // Only update value and call onSelect if not disabled
      if (!disabled) {
        setSelectedValue(value);
        onSelect(value);
      }
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange, disabled]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      // Prevent opening when disabled, but allow closing
      if (disabled && open) return;

      if (open) {
        setIsDropdownReady(true);
        setIsCreatingNew(false);
        setSearchTerm("");
        updateDropdownPosition();
        requestAnimationFrame(() => {
          setIsOpen(true);
        });
      } else {
        setIsOpen(false);
        setIsCreatingNew(false);
        setSearchTerm("");
      }
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [
      onDropdownToggle,
      onDropdownOpenStateChange,
      updateDropdownPosition,
      disabled,
    ]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsCreatingNew(false);
        setSearchTerm("");
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleScroll = useCallback(
    (event: Event) => {
      if (isOpen) {
        const target = event.target as Element;

        if (dropdownRef.current && dropdownRef.current.contains(target)) {
          return;
        }

        if (buttonRef.current && buttonRef.current.contains(target)) {
          return;
        }

        setIsOpen(false);
        setIsCreatingNew(false);
        setSearchTerm("");
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [isOpen, onDropdownToggle, onDropdownOpenStateChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleScroll, { capture: true });
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", updateDropdownPosition);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDropdownPosition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen, handleClickOutside, handleScroll, updateDropdownPosition]);

  const handleCustomInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomValue(e.target.value);
      setError("");
    },
    []
  );

  const handleCustomSelect = useCallback(async () => {
    if (!customValue.trim() || disabled) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onNotification) {
        onNotification(
          `Industry "${customValue}" created successfully!`,
          "success"
        );
      }

      handleSelect(customValue);
      setCustomValue("");
    } catch (err) {
      const errorMessage = "Failed to create industry. Please try again.";
      setError(errorMessage);
      if (onNotification) {
        onNotification(errorMessage, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [customValue, handleSelect, onNotification, disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.key === "Enter") {
        handleCustomSelect();
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setIsCreatingNew(false);
        setSearchTerm("");
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [handleCustomSelect, onDropdownToggle, onDropdownOpenStateChange, disabled]
  );

  const openCustomInput = useCallback(() => {
    if (disabled) return;
    setIsCreatingNew(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [disabled]);

  // Filter and combine all options
  const allOptions = useMemo(() => {
    const combinedOptions = [...defaultIndustries, ...options];
    const uniqueOptions = Array.from(new Set(combinedOptions));

    if (!searchTerm) return uniqueOptions;

    return uniqueOptions.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Memoize item renderer for the virtualized list
  const ItemRenderer = useMemo(() => {
    const Component = ({
      index,
      style,
    }: {
      index: number;
      style: React.CSSProperties;
    }) => (
      <div
        key={allOptions[index]}
        onClick={() => handleSelect(allOptions[index])}
        className={`px-4 py-3 transition-colors duration-200 rounded-md mx-1 flex items-center overflow-hidden ${
          disabled
            ? "cursor-not-allowed text-gray-400"
            : "cursor-pointer hover:bg-blue-900 hover:text-white"
        }`}
        style={{ ...style, width: "calc(100% - 8px)" }}
      >
        <Text className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm truncate">
          {allOptions[index]}
        </Text>
      </div>
    );

    Component.displayName = "ItemRenderer";
    return Component;
  }, [allOptions, handleSelect, disabled]);

  const dropdownContent = (
    <AnimatePresence>
      {(isOpen || isDropdownReady) && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, height: 0 }}
          animate={
            isOpen ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }
          }
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-[60]"
          style={{
            position: "absolute",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: window.innerWidth < 640 ? "350px" : "450px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          }}
          onAnimationComplete={() => {
            if (!isOpen) setIsDropdownReady(false);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="sticky top-0 bg-gray-50 z-10 p-3 border-b border-gray-200 shadow-sm">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 rounded-xl border-2 border-gray-200 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 focus:outline-none text-xs sm:text-sm bg-white transition-all duration-150 ease-in-out"
              />
            </div>
          </div>

          {/* Virtualized list for industry options */}
          {allOptions.length > 0 && (
            <FixedSizeList
              height={Math.min(
                window.innerWidth < 640 ? 200 : 240,
                allOptions.length * 48
              )}
              width="100%"
              itemCount={allOptions.length}
              itemSize={48}
              overscanCount={5}
              className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
              style={{ overflowX: "hidden" }}
            >
              {ItemRenderer}
            </FixedSizeList>
          )}

          {allOptions.length === 0 && searchTerm && (
            <div className="px-4 py-3 text-gray-500 text-xs sm:text-sm">
              No industries found matching &quot;{searchTerm}&quot;
            </div>
          )}

          <AnimatePresence>
            {!isCreatingNew && (
              <motion.div
                initial={{ opacity: 1, height: "auto" }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-t-2 border-gray-200"
              >
                <div
                  onClick={openCustomInput}
                  className={`px-4 py-3 transition-colors duration-200 rounded-md mx-1 flex items-center justify-between ${
                    disabled
                      ? "cursor-not-allowed text-gray-400"
                      : "cursor-pointer hover:bg-blue-900 hover:text-white"
                  }`}
                >
                  <Text className="font-semibold text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
                    Create New Industry
                  </Text>
                  <span className="text-lg sm:text-xl font-bold">+</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCreatingNew && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="border-t-2 border-gray-200 p-2"
              >
                <div className="bg-blue-950 rounded-lg border border-gray-300 flex items-stretch overflow-hidden focus-within:ring-2 focus-within:ring-blue-950 focus-within:border-blue-950">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customValue}
                    onChange={handleCustomInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter custom industry"
                    className="flex-grow px-3 sm:px-4 py-2 bg-white border-none rounded-l-lg outline-none transition-all duration-300 text-xs sm:text-sm"
                    disabled={isSubmitting || disabled}
                  />
                  <div className="flex items-center bg-white">
                    <div className="h-[60%] mx-2 sm:mx-4 border-l border-gray-200" />
                    <button
                      onClick={handleCustomSelect}
                      disabled={isSubmitting || disabled}
                      className={`h-full ${
                        isSubmitting || disabled
                          ? "bg-gray-500"
                          : "bg-blue-900 hover:bg-blue-950"
                      } text-white text-xs sm:text-sm font-semibold py-2 px-3 sm:px-4 transition duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-opacity-50`}
                    >
                      {isSubmitting ? "Adding..." : "Select"}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="text-red-500 text-xs sm:text-sm px-3 py-1 mt-1">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div onClick={(e) => e.stopPropagation()} style={style}>
        <button
          ref={buttonRef}
          onClick={() => handleOpenChange(!isOpen)}
          disabled={disabled}
          className={`text-gray-700 font-normal rounded-lg flex justify-between items-center w-full px-3 sm:px-4 py-2 h-12 md:h-14 outline-none transition-all duration-300 border-2 ${
            disabled
              ? "bg-gray-200 border-gray-300 cursor-not-allowed"
              : selectedValue
              ? "bg-white border-green-700 cursor-pointer focus:border-blue-950 focus:ring-2 focus:ring-blue-950 shadow-sm hover:shadow-md"
              : "bg-gray-50 border-gray-300 cursor-pointer focus:border-blue-950 focus:ring-2 focus:ring-blue-950 shadow-sm hover:shadow-md"
          }`}
        >
          <span
            className={`${
              selectedValue
                ? "text-gray-700 font-normal"
                : "text-gray-400 font-light"
            } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
          >
            {selectedValue || "Select Industry"}
          </span>
        </button>
      </div>

      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

IndustryDropdown.displayName = "IndustryDropdown";
export default React.memo(IndustryDropdown);
