import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FC,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [customValue, setCustomValue] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue]);

  const handleSelect = useCallback(
    (value: string) => {
      setSelectedValue(value);
      onSelect(value);
      setIsOpen(false);
      onDropdownToggle(false);
      onDropdownOpenStateChange(false);
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        setIsCreatingNew(false);
      }
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsCreatingNew(false);
        onDropdownToggle(false);
        onDropdownOpenStateChange(false);
      }
    },
    [onDropdownToggle, onDropdownOpenStateChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleCustomInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomValue(e.target.value);
    },
    []
  );

  const handleCustomSelect = useCallback(() => {
    if (customValue.trim()) {
      handleSelect(customValue);
      setIsCreatingNew(false);
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
          className="cursor-pointer px-4 py-3 hover:bg-blue-900 hover:text-white hover:rounded-lg flex items-center"
          style={{ height: "48px" }}
        >
          <Text className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
            {value}
          </Text>
        </div>
      )),
    [handleSelect]
  );

  return (
    <div ref={dropdownRef} onClick={(e) => e.stopPropagation()} style={style}>
      <button
        onClick={() => handleOpenChange(!isOpen)}
        className={`${
          selectedValue
            ? "bg-white border-2 border-green-600"
            : "bg-gray-50 border border-gray-300"
        } text-[#2A3136] font-normal rounded-lg flex justify-between items-center w-full cursor-pointer px-4 py-2 h-14 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-shadow duration-300`}
      >
        <span
          className={`${
            selectedValue
              ? "text-[#2A3136] font-normal"
              : "text-gray-400 font-light"
          } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
        >
          {selectedValue || "Select Type"}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.95,
              transition: {
                duration: 0.2,
                ease: "easeOut",
              },
            }}
            className="absolute z-50 bg-white border border-gray-300 rounded-lg mt-1 w-[calc(100%-48px)] overflow-hidden"
            style={{
              maxHeight: "300px",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="overflow-y-auto" style={{ maxHeight: "280px" }}>
              {dropdownItems}
            </div>

            <AnimatePresence>
              {!isCreatingNew && (
                <motion.div
                  initial={{ opacity: 1, height: "auto" }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <div
                    onClick={openCustomInput}
                    className="border-t-2 border-gray-200 cursor-pointer px-4 py-3 hover:bg-blue-900 hover:text-white hover:rounded-lg flex items-center justify-between"
                  >
                    <Text className="font-semibold text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
                      Create New Type
                    </Text>
                    <span className="text-xl font-bold">+</span>
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
                    duration: 0.4,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                  className="flex flex-col px-2"
                >
                  <div className="mt-2 mb-2 bg-blue-950 rounded-lg border border-gray-300 flex items-stretch overflow-hidden focus-within:ring-2 focus-within:ring-blue-950 focus-within:border-blue-950">
                    <input
                      ref={inputRef}
                      type="text"
                      value={customValue}
                      onChange={handleCustomInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter custom type"
                      className="flex-grow px-4 py-2 bg-white border-none rounded-l-lg outline-none transition-all duration-300 text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm"
                    />
                    <div className="flex items-center bg-white">
                      <div className="h-[80%] mx-4 border-l border-gray-200" />
                      <button
                        onClick={handleCustomSelect}
                        className="h-full bg-blue-900 hover:bg-blue-950 text-white text-sm font-semibold py-2 px-4 transition duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-opacity-50"
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
    </div>
  );
};

export default TypeDropdown;
