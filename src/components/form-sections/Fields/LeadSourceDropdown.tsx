import { DropdownPortal } from "@/components/ui/DropdownPortal";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FC,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
// createPortal replaced by DropdownPortal
import { Text } from "@radix-ui/themes";
import { ChevronDown, Building2 } from "lucide-react"; // <-- Import Building2

interface LeadSourceDropdownProps {
  onSelect: (value: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  options: string[];
  disabled?: boolean;
  autofilled?: boolean;
}
const leadSources = [
  "Client Referral",
  "Email",
  "WhatsApp",
  "LinkedIn",
  "Cold Call",
  "Shopee",
  "Instagram",
  "Existing Client",
  "Event",
  "Warm Lead",
  "Referral",
  "Personal",
  "Lazada",
];

const LeadSourceDropdown: FC<LeadSourceDropdownProps> = ({
  onSelect,
  defaultValue = "",
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
  options,
  disabled = false,
  autofilled = false,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownReady, setIsDropdownReady] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [customValue, setCustomValue] = useState<string>("");
  // dropdown position will be handled by DropdownPortal

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  // Portal handles position, do not calculate manually anymore

  const handleSelect = useCallback(
    (value: string) => {
      setIsOpen(false);
      setIsCreatingNew(false);
      onDropdownToggle(false);
      onDropdownOpenStateChange(false);

      if (!disabled) {
        setSelectedValue(value);
        onSelect(value);
      }
    },
    [onSelect, onDropdownToggle, onDropdownOpenStateChange, disabled]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled && open) return;
      setIsOpen(open);
      setIsCreatingNew(false);
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [onDropdownToggle, onDropdownOpenStateChange, disabled]
  );

  // DropdownPortal will control click outside and scroll handling

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

  const filteredOptions = useMemo(
    () => options.filter((option) => !leadSources.includes(option)),
    [options]
  );

  const allLeadSources = useMemo(
    () => [...leadSources, ...filteredOptions],
    [filteredOptions]
  );

  const dropdownItems = useMemo(
    () =>
      allLeadSources.map((source) => (
        <div
          key={source}
          onClick={() => handleSelect(source)}
          className={`cursor-pointer px-4 py-3 transition-colors duration-200 rounded-md mx-1 ${
            disabled
              ? "cursor-not-allowed text-gray-400"
              : "hover:bg-blue-900 hover:text-white"
          }`}
        >
          <Text className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
            {source}
          </Text>
        </div>
      )),
    [handleSelect, allLeadSources, disabled]
  );

  const dropdownContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, height: 0 }}
          animate={
            isOpen ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }
          }
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-110000"
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
                    Create New Lead Source
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
                    placeholder="Enter custom lead source"
                    className="grow px-3 sm:px-4 py-2 bg-white border-none rounded-l-lg outline-none transition-all duration-300 text-xs sm:text-sm"
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
        style={style}
      >
        <span
          className={`flex items-center gap-2 ${
            selectedValue
              ? "text-gray-700 font-normal"
              : "text-gray-400 font-light"
          } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
        >
          {selectedValue || "Select Lead Source"}
        </span>
        {/* Only show badge if autofilled */}
        {autofilled ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm ml-2 gap-1">
            <Building2 className="w-3 h-3 mr-1 text-blue-500" />
            Auto-filled
          </span>
        ) : (
          <ChevronDown
            className={`transition-transform duration-200 text-gray-400 ${
              isOpen ? "rotate-180" : ""
            }`}
            size={16}
          />
        )}
      </button>

      <DropdownPortal isOpen={isOpen} onClose={() => handleOpenChange(false)} buttonRef={buttonRef} className="z-110000 overflow-hidden">
        {dropdownContent}
      </DropdownPortal>
    </>
  );
};

export default LeadSourceDropdown;
