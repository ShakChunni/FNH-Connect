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

interface TypeDropdownProps {
  onSelect: (value: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
}

const typeValues = ["KOL", "Video", "KOL Retainer", "Annual Report"];

const TypeDropdown: FC<TypeDropdownProps> = ({
  onSelect,
  defaultValue = "",
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownReady, setIsDropdownReady] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [customValue, setCustomValue] = useState<string>("");
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
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
      setSelectedValue(value);
      onSelect(value);
      setIsOpen(false);
      setIsCreatingNew(false);
      setCustomValue("");
      onDropdownToggle(false);
      onDropdownOpenStateChange(false);
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setIsDropdownReady(true);
        setIsCreatingNew(false);
        updateDropdownPosition();
        requestAnimationFrame(() => {
          setIsOpen(true);
        });
      } else {
        setIsOpen(false);
        setIsCreatingNew(false);
      }
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [onDropdownToggle, onDropdownOpenStateChange, updateDropdownPosition]
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
    },
    []
  );

  const handleCustomSelect = useCallback(() => {
    if (customValue.trim()) {
      handleSelect(customValue);
      setCustomValue("");
    }
  }, [customValue, handleSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleCustomSelect();
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setIsCreatingNew(false);
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [handleCustomSelect, onDropdownToggle, onDropdownOpenStateChange]
  );

  const openCustomInput = useCallback(() => {
    setIsCreatingNew(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  const dropdownItems = useMemo(
    () =>
      typeValues.map((value) => (
        <div
          key={value}
          onClick={() => handleSelect(value)}
          className="cursor-pointer px-4 py-3 hover:bg-blue-900 hover:text-white transition-colors duration-200 rounded-md mx-1"
        >
          <Text className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
            {value}
          </Text>
        </div>
      )),
    [handleSelect]
  );

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
            maxHeight: window.innerWidth < 640 ? "300px" : "400px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          }}
          onAnimationComplete={() => {
            if (!isOpen) setIsDropdownReady(false);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="overflow-y-auto p-2"
            style={{ maxHeight: window.innerWidth < 640 ? "220px" : "280px" }}
          >
            {dropdownItems}
          </div>

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
                  className="cursor-pointer px-4 py-3 hover:bg-blue-900 hover:text-white transition-colors duration-200 rounded-md mx-1 flex items-center justify-between"
                >
                  <Text className="font-semibold text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
                    Create New Type
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
                    placeholder="Enter custom type"
                    className="flex-grow px-3 sm:px-4 py-2 bg-white border-none rounded-l-lg outline-none transition-all duration-300 text-xs sm:text-sm"
                  />
                  <div className="flex items-center bg-white">
                    <div className="h-[60%] mx-2 sm:mx-4 border-l border-gray-200" />
                    <button
                      onClick={handleCustomSelect}
                      className="h-full bg-blue-900 hover:bg-blue-950 text-white text-xs sm:text-sm font-semibold py-2 px-3 sm:px-4 transition duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-opacity-50"
                    >
                      Select
                    </button>
                  </div>
                </div>
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
          className={`${selectedValue ? "bg-white" : "bg-gray-50"} border-2 ${
            selectedValue ? "border-green-700" : "border-gray-300"
          } text-gray-700 font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-3 sm:px-4 py-2 h-12 md:h-14 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300`}
        >
          <span
            className={`${
              selectedValue
                ? "text-gray-700 font-normal"
                : "text-gray-400 font-light"
            } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
          >
            {selectedValue || "Select Type"}
          </span>
        </button>
      </div>

      {typeof window !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </>
  );
};

export default TypeDropdown;
