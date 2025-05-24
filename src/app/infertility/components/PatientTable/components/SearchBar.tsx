import React, { useState, useRef, useEffect } from "react";
import { SearchIcon, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchField: string;
  setSearchField: (field: string) => void;
  onSearch: () => void;
}

const SearchBar = React.forwardRef<{ search: () => void }, SearchBarProps>(
  (
    { searchTerm, setSearchTerm, searchField, setSearchField, onSearch },
    ref
  ) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });
    const [isMounted, setIsMounted] = useState(false);

    // Search options
    const searchOptions = [
      { value: "organization", label: "Organization Name" },
      { value: "clientName", label: "Client Name" },
      { value: "clientPhone", label: "Client Phone" },
      { value: "clientEmail", label: "Client Email" },
    ];

    // Check if client-side
    useEffect(() => {
      setIsMounted(true);
    }, []);

    // Update dropdown position when it opens
    useEffect(() => {
      if (isDropdownOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left, // Position from left instead of right
          width: Math.max(rect.width * 2, 180), // Slightly wider
        });
      }
    }, [isDropdownOpen]);

    // Handle clicks outside the dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Expose search method through ref
    React.useImperativeHandle(ref, () => ({
      search: () => {
        onSearch();
      },
    }));

    // Handle search on Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        onSearch();
      }
    };

    // Get current option label
    const getCurrentOptionLabel = () => {
      return (
        searchOptions.find((option) => option.value === searchField)?.label ||
        "Search by"
      );
    };

    return (
      <div className="flex items-center space-x-2 z-[100]">
        <motion.div
          className="relative flex w-full md:w-80 lg:w-[450px] xl:w-[500px]"
          animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={`relative flex-grow flex items-center bg-gray-200 rounded-xl overflow-hidden ${
              isFocused ? "ring-2 ring-blue-900" : ""
            }`}
          >
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <motion.div
                animate={
                  isFocused
                    ? { scale: 1.1, color: "#1e3a8a" }
                    : { scale: 1, color: "#6b7280" }
                }
              >
                <SearchIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.div>
            </div>
            <input
              ref={inputRef}
              type="text"
              className="bg-transparent text-xs sm:text-sm text-gray-700 py-1.5 sm:py-2 px-3 sm:px-4 pl-8 sm:pl-10 focus:outline-none focus:ring-0 w-full transition-all duration-300"
              placeholder={`Search by ${getCurrentOptionLabel().toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
            />
            <div className="relative px-2 sm:px-3 h-full border-l border-gray-300 flex items-center">
              <button
                ref={buttonRef}
                className={`flex items-center justify-between py-1 sm:py-2 font-medium text-xs sm:text-sm transition-all duration-300 ${
                  isFocused ? "text-blue-900" : "text-gray-700"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              >
                <span className="mr-1 whitespace-nowrap hidden md:inline text-xs">
                  {getCurrentOptionLabel()}
                </span>
                <span className="mr-1 whitespace-nowrap md:hidden text-xs">
                  {getCurrentOptionLabel().split(" ")[0]}
                </span>
                <motion.div
                  animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </motion.div>
              </button>
            </div>
          </div>
        </motion.div>

        {isMounted && (
          <AnimatePresence>
            {isDropdownOpen && (
              <div
                className="fixed inset-0 bg-transparent z-50"
                onClick={() => setIsDropdownOpen(false)}
              >
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bg-white rounded-lg shadow-xl py-2 border border-gray-200"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {searchOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`px-4 py-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-100 transition-colors ${
                        searchField === option.value
                          ? "bg-blue-50 text-blue-900 font-medium border-l-4 border-blue-900"
                          : "text-gray-700"
                      }`}
                      onClick={() => {
                        setSearchField(option.value);
                        setIsDropdownOpen(false);
                        inputRef.current?.focus();
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
