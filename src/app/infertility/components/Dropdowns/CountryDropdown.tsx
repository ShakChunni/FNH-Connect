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
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { Text } from "@radix-ui/themes";
import countriesData from "world-countries/countries.json";
import { FixedSizeList } from "react-window";
import { IoCloseCircle } from "react-icons/io5";

interface CountryDropdownProps {
  onSelect: (value: string) => void;
  defaultValue?: string;
  style?: React.CSSProperties;
  onDropdownToggle: (isOpen: boolean) => void;
  onDropdownOpenStateChange: (isOpen: boolean) => void;
  options: string[];
  disabled?: boolean;
}

const CountryDropdown: FC<CountryDropdownProps> = ({
  onSelect,
  defaultValue = "",
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
  options,
  disabled = false,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownReady, setIsDropdownReady] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  // portal will handle position

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  // DropdownPortal manages updating placement

  const handleSelect = useCallback(
    (value: string) => {
      // Always close the dropdown with animation, regardless of disabled state
      setIsOpen(false);
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
      if (disabled && open) return;
      setIsOpen(open);
      setSearchTerm("");
      onDropdownToggle(open);
      onDropdownOpenStateChange(open);
    },
    [onDropdownToggle, onDropdownOpenStateChange, disabled]
  );

  // DropdownPortal will control click outside and repositioning

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const preferredCountries = useMemo(() => ["Malaysia", "Singapore"], []);

  const allCountries = useMemo(() => {
    const countriesList = countriesData.map((country) => country.name.common);
    const filteredList = countriesList.filter(
      (country) => !preferredCountries.includes(country)
    );
    return [...preferredCountries, ...filteredList];
  }, [preferredCountries]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return allCountries;
    return allCountries.filter((country) =>
      country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allCountries]);

  const CountryItemRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const country = filteredCountries[index];
      const isPreferred = preferredCountries.includes(country);
      const isLastPreferred =
        country === preferredCountries[preferredCountries.length - 1];

      return (
        <div
          key={country}
          onClick={() => handleSelect(country)}
          className={`px-4 py-3 transition-colors duration-200 rounded-md mx-1 flex items-center overflow-hidden ${
            disabled
              ? "cursor-not-allowed text-gray-400"
              : "cursor-pointer hover:bg-blue-900 hover:text-white"
          }`}
          style={{
            ...style,
            height: isLastPreferred ? "56px" : "48px",
            paddingBottom: isLastPreferred ? "11px" : "auto",
            width: "calc(100% - 8px)",
          }}
        >
          <Text className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm 2xl:text-sm truncate">
            {country}
          </Text>
        </div>
      );
    },
    [filteredCountries, handleSelect, preferredCountries, disabled]
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
          className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-110000"
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
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 rounded-xl border-2 border-gray-200 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 focus:outline-none text-xs sm:text-sm bg-white pr-10 transition-all duration-150 ease-in-out"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <IoCloseCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Virtualized list for countries */}
          <div className="p-2">
            {filteredCountries.length > 0 ? (
              <FixedSizeList
                height={Math.min(
                  window.innerWidth < 640 ? 200 : 280,
                  filteredCountries.length * 48
                )}
                width="100%"
                itemCount={filteredCountries.length}
                itemSize={48}
                overscanCount={5}
                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                style={{ overflowX: "hidden" }}
              >
                {CountryItemRenderer}
              </FixedSizeList>
            ) : (
              <div className="p-4 text-center text-gray-500 text-xs sm:text-sm">
                No countries found
              </div>
            )}
          </div>
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
            {selectedValue || "Select Country"}
          </span>
        </button>
      </div>

      <DropdownPortal isOpen={isOpen} onClose={() => handleOpenChange(false)} buttonRef={buttonRef} className="z-110000 overflow-hidden">
        {dropdownContent}
      </DropdownPortal>
    </>
  );
};

CountryDropdown.displayName = "CountryDropdown";
export default React.memo(CountryDropdown);
