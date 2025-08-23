import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Text } from "@radix-ui/themes";
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
} from "libphonenumber-js";
import Flag from "react-world-flags";
import { FaChevronDown } from "react-icons/fa";
import { FixedSizeList } from "react-window";

interface Country {
  name: string;
  code: string;
  dialCode: string;
}

interface ContactPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  defaultCountry?: string;
  isAutofilled?: boolean;
}

const generateCountries = (): Country[] => {
  const countryCodes = getCountries();
  return countryCodes
    .map((code) => {
      let name = "";
      try {
        name =
          new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
      } catch (e) {
        name = code;
      }
      return {
        name,
        code,
        dialCode: `+${getCountryCallingCode(code)}`,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

const commonCountryCodes = ["MY", "SG"];

const useSortedCountries = () => {
  return useMemo(() => {
    const countries = generateCountries();
    const commonCountries = commonCountryCodes
      .map((code) => countries.find((c) => c.code === code))
      .filter(Boolean) as Country[];
    const otherCountries = countries.filter(
      (c) => !commonCountryCodes.includes(c.code)
    );
    return [...commonCountries, ...otherCountries];
  }, []);
};

const LazyFlag = memo(
  ({ code, ...props }: { code: string; [key: string]: any }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
      <div
        className="relative"
        style={{ width: "1.2em", height: "1.2em", marginRight: "0.25rem" }}
      >
        {!isLoaded && (
          <div className="w-full h-full bg-gray-200 rounded-sm absolute"></div>
        )}
        <Flag
          code={code}
          onLoad={() => setIsLoaded(true)}
          style={{
            width: "1.2em",
            height: "1.2em",
            opacity: isLoaded ? 1 : 0,
          }}
          {...props}
        />
      </div>
    );
  }
);
LazyFlag.displayName = "LazyFlag";

const CountryItem = memo(
  ({
    country,
    onSelect,
    style,
  }: {
    country: Country;
    onSelect: (country: Country) => void;
    style?: React.CSSProperties;
  }) => {
    return (
      <div
        onClick={() => onSelect(country)}
        className="cursor-pointer px-4 py-3 hover:bg-blue-900 hover:text-white hover:rounded-lg flex items-center"
        style={{ height: "48px", ...style }}
      >
        <LazyFlag code={country.code} />
        <Text className="flex-1 text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm">
          {country.name}
        </Text>
        <Text className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm font-medium">
          {country.dialCode}
        </Text>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.country.code === nextProps.country.code
);
CountryItem.displayName = "CountryItem";

const ContactPhoneInput: React.FC<ContactPhoneInputProps> = memo(
  ({
    value,
    onChange,
    onValidationChange,
    defaultCountry = "MY",
    isAutofilled = false,
  }) => {
    const sortedCountries = useSortedCountries();
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isDropdownReady, setIsDropdownReady] = useState<boolean>(false);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(
      null
    );
    const [localValue, setLocalValue] = useState<string>("");
    const [isValid, setIsValid] = useState<boolean>(true);
    const [isTouched, setIsTouched] = useState<boolean>(false);
    const [showValidation, setShowValidation] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [hasUserInput, setHasUserInput] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<FixedSizeList>(null);

    const findCountryByDialCode = useCallback(
      (dialCode: string): Country | undefined => {
        return sortedCountries.find(
          (country) =>
            dialCode.startsWith(country.dialCode) ||
            country.dialCode.startsWith(dialCode)
        );
      },
      [sortedCountries]
    );

    const findCountryByCode = useCallback(
      (code: string): Country | undefined => {
        return sortedCountries.find(
          (country) => country.code === code.toUpperCase()
        );
      },
      [sortedCountries]
    );

    const cleanPhoneNumber = useCallback((phoneNumber: string): string => {
      return phoneNumber.replace(/[^\d+]/g, "");
    }, []);

    const extractNumberWithoutDialCode = useCallback(
      (phoneNumber: string): string => {
        if (!phoneNumber.startsWith("+")) return phoneNumber;
        const cleanedNumber = cleanPhoneNumber(phoneNumber);

        for (const country of sortedCountries) {
          if (cleanedNumber.startsWith(country.dialCode)) {
            return cleanedNumber.substring(country.dialCode.length);
          }
        }

        const match = cleanedNumber.match(/^\+\d+/);
        if (match) {
          return cleanedNumber.substring(match[0].length);
        }

        return cleanedNumber;
      },
      [sortedCountries, cleanPhoneNumber]
    );

    useEffect(() => {
      const defaultCountryData = findCountryByCode(defaultCountry);
      if (defaultCountryData) {
        setSelectedCountry(defaultCountryData);
      } else {
        const malaysia = findCountryByCode("MY");
        if (malaysia) setSelectedCountry(malaysia);
      }
    }, [defaultCountry, findCountryByCode]);

    const handleSelectCountry = useCallback(
      (country: Country) => {
        setSelectedCountry(country);
        setIsDropdownOpen(false);

        const trimmedValue = localValue.trim();
        if (!trimmedValue) {
          onChange("");
          setLocalValue("");
          validatePhoneNumber("");
          return;
        }

        const cleanedValue = cleanPhoneNumber(localValue);

        if (!cleanedValue.startsWith("+")) {
          const newValue = country.dialCode + cleanedValue;
          onChange(newValue);
          validatePhoneNumber(newValue);
        } else {
          const numberWithoutDialCode =
            extractNumberWithoutDialCode(cleanedValue);
          const newValue = country.dialCode + numberWithoutDialCode;
          onChange(newValue);
          setLocalValue(numberWithoutDialCode);
          validatePhoneNumber(newValue);
        }

        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      },
      [localValue, onChange, extractNumberWithoutDialCode, cleanPhoneNumber]
    );

    const validatePhoneNumber = useCallback(
      (fullPhoneNumber: string) => {
        if (!fullPhoneNumber.trim()) {
          setIsValid(true);
          if (onValidationChange) onValidationChange(true);
          return;
        }

        if (fullPhoneNumber.replace(/\s/g, "") === "") {
          setIsValid(true);
          if (onValidationChange) onValidationChange(true);
          return;
        }

        try {
          const isValidNumber = isValidPhoneNumber(fullPhoneNumber);
          setIsValid(isValidNumber);
          if (onValidationChange) {
            onValidationChange(isValidNumber);
          }
        } catch (error) {
          setIsValid(false);
          if (onValidationChange) {
            onValidationChange(false);
          }
        }
      },
      [onValidationChange]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let newInput = e.target.value;
        setHasUserInput(true);

        if (!newInput.trim()) {
          onChange("");
          validatePhoneNumber("");
          setLocalValue("");
          return;
        }

        if (
          selectedCountry &&
          selectedCountry.dialCode.endsWith("0") &&
          newInput.length === 1 &&
          newInput === "0"
        ) {
          return;
        }

        setLocalValue(newInput);

        let fullPhoneNumber = "";

        if (newInput.startsWith("+")) {
          const cleanedInput = cleanPhoneNumber(newInput);
          const potentialCountry = findCountryByDialCode(cleanedInput);

          if (potentialCountry) {
            setSelectedCountry(potentialCountry);
            const numberPart = extractNumberWithoutDialCode(cleanedInput);
            fullPhoneNumber = cleanedInput;
            onChange(cleanedInput);
          } else {
            fullPhoneNumber = cleanedInput;
            onChange(cleanedInput);
          }
        } else {
          if (
            selectedCountry &&
            selectedCountry.dialCode.endsWith("0") &&
            newInput.startsWith("0")
          ) {
            newInput = newInput.substring(1);
            setLocalValue(newInput);
          }

          fullPhoneNumber = selectedCountry
            ? selectedCountry.dialCode + newInput
            : newInput;
          onChange(fullPhoneNumber);
        }

        validatePhoneNumber(fullPhoneNumber);
      },
      [
        findCountryByDialCode,
        selectedCountry,
        onChange,
        validatePhoneNumber,
        cleanPhoneNumber,
        extractNumberWithoutDialCode,
      ]
    );

    const handleInputBlur = useCallback(() => {
      setIsTouched(true);
      setShowValidation(true);
    }, []);

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
      },
      []
    );

    const toggleDropdown = useCallback(() => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      } else {
        setIsDropdownReady(true);
        requestAnimationFrame(() => {
          setIsDropdownOpen(true);
        });
      }
    }, [isDropdownOpen]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    useEffect(() => {
      if (value && value !== (selectedCountry?.dialCode || "") + localValue) {
        if (value.startsWith("+")) {
          const cleanedValue = cleanPhoneNumber(value);
          const matchedCountry = findCountryByDialCode(cleanedValue);
          if (matchedCountry) {
            setSelectedCountry(matchedCountry);
            const numberPart = extractNumberWithoutDialCode(cleanedValue);
            setLocalValue(numberPart);
            setHasUserInput(true);
          } else {
            setLocalValue(cleanedValue);
            setHasUserInput(true);
          }
        } else {
          setLocalValue(value);
          setHasUserInput(true);
        }
        validatePhoneNumber(value);
        if (value.trim()) {
          setIsTouched(true);
          setShowValidation(true);
        }
      } else if (!value && localValue) {
        setLocalValue("");
        setHasUserInput(false);
        setIsTouched(false);
        setShowValidation(false);
      }
    }, [
      value,
      selectedCountry,
      localValue,
      findCountryByDialCode,
      extractNumberWithoutDialCode,
      cleanPhoneNumber,
      validatePhoneNumber,
    ]);

    const filteredCountries = useMemo(() => {
      if (!searchTerm) return sortedCountries;
      return sortedCountries.filter(
        (country) =>
          country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          country.dialCode.includes(searchTerm) ||
          country.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [sortedCountries, searchTerm]);

    useEffect(() => {
      if (isDropdownOpen) {
        const searchInput = document.querySelector(
          ".country-search-input"
        ) as HTMLInputElement;
        if (searchInput) {
          setTimeout(() => {
            searchInput.focus();
          }, 50);
        }
      } else {
        setSearchTerm("");
      }
    }, [isDropdownOpen]);

    const shouldShowValidation = isTouched && showValidation;
    const shouldShowSuccess =
      (isAutofilled || (isTouched && hasUserInput)) &&
      isValid &&
      localValue.trim().length > 0;
    const shouldShowError = shouldShowValidation && !isValid;

    return (
      <div className="relative w-full" ref={dropdownRef}>
        <div
          className={`
            flex w-full rounded-lg overflow-hidden
            ${
              isAutofilled
                ? "border-2 border-green-300 bg-green-50"
                : shouldShowSuccess
                ? "border border-green-700 ring-1 ring-green-700 bg-white"
                : shouldShowError
                ? "border-2 border-red-700 ring-2 ring-red-700 bg-gray-50"
                : "border-2 border-gray-300 bg-gray-50"
            }
            focus-within:border-blue-900 focus-within:ring-2 focus-within:ring-blue-950
            shadow-sm hover:shadow-md transition-all duration-300
          `}
        >
          <div
            className="flex items-center bg-gray-200 px-3 py-2 cursor-pointer h-14"
            style={{ minWidth: "90px", maxWidth: "90px" }}
            onClick={toggleDropdown}
          >
            {selectedCountry && (
              <div className="flex items-center">
                <LazyFlag
                  code={selectedCountry.code}
                  style={{
                    width: "1.5em",
                    height: "1.2em",
                    marginRight: "0.5rem",
                  }}
                />
                <span className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm font-medium">
                  {selectedCountry.dialCode}
                </span>
                <FaChevronDown
                  className={`ml-1 text-xs sm:text-sm transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            )}
            {!selectedCountry && (
              <div className="flex items-center">
                <LazyFlag code="MY" style={{ marginRight: "0.5rem" }} />
                <span className="text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm font-medium">
                  +60
                </span>
                <FaChevronDown
                  className={`ml-1 text-xs sm:text-sm transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="tel"
            className={`
              flex-1 px-3 py-2 text-[#2A3136] outline-none h-14 font-normal 
              text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm 
              placeholder:text-gray-400 placeholder:font-light
              ${
                isAutofilled
                  ? "bg-green-50"
                  : shouldShowSuccess
                  ? "bg-white"
                  : "bg-gray-50"
              }
            `}
            placeholder="Enter phone number"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => setShowValidation(false)}
          />
        </div>

        <AnimatePresence>
          {shouldShowValidation && !isValid && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
              className="overflow-hidden"
            >
              <p className="text-red-600 text-xs mt-1">
                Please enter a valid phone number!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(isDropdownOpen || isDropdownReady) && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={
                isDropdownOpen
                  ? {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      height: "auto",
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      },
                    }
                  : { opacity: 0, y: -10, scale: 0.95, height: 0 }
              }
              exit={{
                opacity: 0,
                y: -10,
                scale: 0.95,
                height: 0,
                transition: { duration: 0.2, ease: "easeOut" },
              }}
              className="absolute z-50 bg-white border border-gray-300 rounded-lg mt-1 w-full overflow-hidden"
              style={{
                maxHeight: "400px",
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
              }}
              onAnimationComplete={() => {
                if (!isDropdownOpen) setIsDropdownReady(false);
              }}
            >
              <div className="sticky top-0 bg-gray-50 z-10 p-3 border-b border-gray-200 shadow-sm">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="country-search-input w-full p-2 sm:p-2 md:p-2 lg:p-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 focus:outline-none text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm bg-white transition-all duration-150 ease-in-out"
                    autoFocus
                  />
                </div>
              </div>
              {isDropdownOpen && (
                <FixedSizeList
                  ref={listRef}
                  height={300}
                  width="100%"
                  itemCount={filteredCountries.length}
                  itemSize={48}
                  overscanCount={5}
                  className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                >
                  {({ index, style }) => (
                    <CountryItem
                      key={filteredCountries[index].code}
                      country={filteredCountries[index]}
                      onSelect={handleSelectCountry}
                      style={style}
                    />
                  )}
                </FixedSizeList>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
ContactPhoneInput.displayName = "ContactPhoneInput";
export default ContactPhoneInput;
