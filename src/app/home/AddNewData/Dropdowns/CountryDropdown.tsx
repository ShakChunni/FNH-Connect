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
}

const CountryDropdown: FC<CountryDropdownProps> = ({
  onSelect,
  defaultValue = "",
  style,
  onDropdownToggle,
  onDropdownOpenStateChange,
  options,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          className={`cursor-pointer px-4 hover:bg-blue-900 hover:text-white hover:rounded-lg flex items-center `}
          style={{
            ...style,
            height: isLastPreferred ? "56px" : "48px",
            paddingBottom: isLastPreferred ? "11px" : "auto",
          }}
        >
          <Text className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm 2xl:text-sm">
            {country}
          </Text>
        </div>
      );
    },
    [filteredCountries, handleSelect, preferredCountries]
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
              : "text-gray-400 font-light "
          } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
        >
          {selectedValue || "Select Country"}
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
              maxHeight: "400px",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="sticky top-0 bg-gray-50 z-10 p-3 border-b border-gray-200 shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 sm:p-2 md:p-2 lg:p-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 focus:outline-none text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm bg-white pr-10 transition-all duration-150 ease-in-out"
                  autoFocus
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

            <div className="p-2">
              {filteredCountries.length > 0 ? (
                <FixedSizeList
                  height={Math.min(48 * filteredCountries.length, 280)}
                  width="100%"
                  itemCount={filteredCountries.length}
                  itemSize={48}
                  overscanCount={5}
                  className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                >
                  {CountryItemRenderer}
                </FixedSizeList>
              ) : (
                <div className="p-4 text-center text-gray-500 text-xs sm:text-sm md:text-sm">
                  No countries found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

CountryDropdown.displayName = "CountryDropdown";
export default React.memo(CountryDropdown);
