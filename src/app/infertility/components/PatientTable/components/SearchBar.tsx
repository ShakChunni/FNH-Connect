import React, { useState, useRef, useEffect } from "react";
import { SearchIcon, X } from "lucide-react";
import { motion } from "framer-motion";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: () => void;
  onClear: () => void;
  enableAutoSearch?: boolean;
  debounceMs?: number;
  minSearchLength?: number;
}

const SearchBar = React.forwardRef<{ search: () => void }, SearchBarProps>(
  (
    {
      searchTerm,
      setSearchTerm,
      onSearch,
      onClear,
      enableAutoSearch = true,
      debounceMs = 500,
      minSearchLength = 2,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [borderColor, setBorderColor] = useState("#f3f4f6");
    const [textColor, setTextColor] = useState("black");
    const [borderWidth, setBorderWidth] = useState("1px");
    const [borderRadius, setBorderRadius] = useState("10px");
    const [isSearching, setIsSearching] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const lastSearchTerm = useRef<string>("");

    // Expose search method through ref
    React.useImperativeHandle(ref, () => ({
      search: () => {
        handleManualSearch();
      },
    }));

    // Debounced auto-search effect
    useEffect(() => {
      if (!enableAutoSearch) return;

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        setIsSearching(false);
      }

      // Early return conditions - don't set timeout at all
      // 1. Search term hasn't changed
      if (searchTerm === lastSearchTerm.current) {
        return;
      }

      // 2. Search term is too short and not empty (for clearing)
      const trimmedTerm = searchTerm.trim();
      if (trimmedTerm.length > 0 && trimmedTerm.length < minSearchLength) {
        return;
      }

      // 3. If search term is empty, trigger immediate clear
      if (trimmedTerm.length === 0) {
        lastSearchTerm.current = searchTerm;
        onSearch();
        return;
      }

      // Only set searching state and timeout if we're going to search
      setIsSearching(true);

      // Set new timeout for debounced search
      debounceRef.current = setTimeout(() => {
        lastSearchTerm.current = searchTerm;
        onSearch();
        setIsSearching(false);
      }, debounceMs);

      // Cleanup function
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        setIsSearching(false);
      };
    }, [searchTerm, enableAutoSearch, debounceMs, minSearchLength, onSearch]);

    // Manual search (immediate)
    const handleManualSearch = () => {
      // Clear any pending debounced search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      setIsSearching(false);
      lastSearchTerm.current = searchTerm;
      onSearch();
    };

    // Handle search on Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleManualSearch();
      }

      // ESC key to clear
      if (e.key === "Escape") {
        handleClear();
      }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchTerm(newValue);
    };

    const handleSearchClick = () => {
      handleManualSearch();
    };

    const handleClear = () => {
      // Clear any pending search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      setSearchTerm("");
      setIsSearching(false);
      lastSearchTerm.current = "";
      inputRef.current?.focus();
      onClear();
    };

    // Focus styling handlers
    const handleInputFocus = () => {
      setIsFocused(true);
      setBorderColor("#1e3a8a");
      setTextColor("#1e3a8a");
      setBorderWidth("2px");
      setBorderRadius("12px");
    };

    const handleInputBlur = () => {
      setIsFocused(false);
      setBorderColor("#f3f4f6");
      setTextColor("black");
      setBorderWidth("1px");
      setBorderRadius("10px");
    };

    // Show visual feedback for searching state
    const showSearchingIndicator =
      enableAutoSearch &&
      isSearching &&
      searchTerm.trim().length >= minSearchLength;

    return (
      <div className="flex items-center space-x-2 z-[100]">
        <motion.div
          className="relative flex w-full md:w-80 lg:w-[450px] xl:w-[500px]"
          transition={{ duration: 0.3 }}
        >
          <div
            style={{
              backgroundColor: "white",
              color: textColor,
              border: `${borderWidth} solid ${borderColor}`,
              borderRadius: borderRadius,
              display: "flex",
              alignItems: "center",
              height: "44px",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              transition:
                "border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              width: "100%",
            }}
            className="transition-all duration-300"
          >
            <input
              ref={inputRef}
              type="text"
              className="bg-slate50 text-2xs xs:text-xs sm:text-sm text-gray-700 py-3 px-4 pr-20 focus:outline-none focus:ring-0 w-full transition-all duration-300 h-full"
              placeholder={
                enableAutoSearch
                  ? `Search across relevant columns...`
                  : "Search across relevant columns..."
              }
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
            />

            <div className="absolute right-2 xs:right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              {/* Searching indicator */}
              {showSearchingIndicator && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center"
                >
                  <div className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4">
                    <div className="animate-spin rounded-full h-full w-full border-2 border-blue-200 border-t-blue-600"></div>
                  </div>
                </motion.div>
              )}

              {/* Clear button */}
              {searchTerm && !showSearchingIndicator && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  aria-label="Clear search"
                  className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 xs:p-0.5 sm:p-1"
                  onClick={handleClear}
                  tabIndex={0}
                >
                  <X className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                </motion.button>
              )}

              {/* Search button */}
              <button
                type="button"
                aria-label="Search"
                className={`text-gray-500 hover:text-blue-900 transition-colors p-0.5 xs:p-0.5 sm:p-1 ${
                  isFocused ? "text-blue-900" : ""
                } ${
                  showSearchingIndicator ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleSearchClick}
                disabled={showSearchingIndicator}
                tabIndex={0}
              >
                <motion.div
                  animate={{
                    color: isFocused ? "#1e3a8a" : undefined,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <SearchIcon className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                </motion.div>
              </button>
            </div>
          </div>

          {/* Auto-search hint */}
          {enableAutoSearch &&
            isFocused &&
            searchTerm.length < minSearchLength &&
            searchTerm.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-xs text-gray-600 z-50"
              >
                Type {minSearchLength - searchTerm.length} more character
                {minSearchLength - searchTerm.length > 1 ? "s" : ""} for
                auto-search
              </motion.div>
            )}
        </motion.div>
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";

export default React.memo(SearchBar);
