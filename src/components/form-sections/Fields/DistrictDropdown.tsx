"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import {
  BANGLADESH_DISTRICTS,
  type BangladeshDistrict,
} from "@/lib/bangladeshAddress";

interface DistrictDropdownProps {
  id?: string;
  value: BangladeshDistrict | "";
  onSelect: (district: BangladeshDistrict) => void;
  disabled?: boolean;
  isAutofilled?: boolean;
}

const DistrictDropdown: React.FC<DistrictDropdownProps> = ({
  id,
  value,
  onSelect,
  disabled = false,
  isAutofilled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredDistricts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [...BANGLADESH_DISTRICTS];
    return BANGLADESH_DISTRICTS.filter((district) =>
      district.toLowerCase().includes(term),
    );
  }, [searchTerm]);

  useEffect(() => {
    setFocusedIndex(0);
  }, [searchTerm, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [isOpen]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (disabled) return;
      if (open) {
        setIsOpen(true);
      } else {
        closeDropdown();
      }
    },
    [disabled, closeDropdown],
  );

  const handleSelect = useCallback(
    (district: BangladeshDistrict) => {
      onSelect(district);
      closeDropdown();
    },
    [onSelect, closeDropdown],
  );

  const handleKeyDownOnList = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((index) =>
          Math.min(index + 1, Math.max(filteredDistricts.length - 1, 0)),
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const next = filteredDistricts[focusedIndex];
        if (next) {
          handleSelect(next);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeDropdown();
      }
    },
    [closeDropdown, filteredDistricts, focusedIndex, handleSelect],
  );

  const handleKeyDownOnButton = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowDown" || event.key === "Enter") {
        event.preventDefault();
        handleOpenChange(true);
      }
    },
    [handleOpenChange],
  );

  return (
    <>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        onClick={() => handleOpenChange(!isOpen)}
        onKeyDown={handleKeyDownOnButton}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Bangladesh district"
        className={`text-gray-700 font-normal rounded-lg flex justify-between items-center w-full px-3 sm:px-4 py-2 h-12 md:h-14 outline-none transition-all duration-300 border-2 ${
          disabled
            ? "bg-gray-200 border-gray-300 cursor-not-allowed"
            : value
              ? "bg-white border-green-700 cursor-pointer focus:border-blue-950 focus:ring-2 focus:ring-blue-950 shadow-sm hover:shadow-md"
              : "bg-gray-50 border-gray-300 cursor-pointer focus:border-blue-950 focus:ring-2 focus:ring-blue-950 shadow-sm hover:shadow-md"
        }`}
      >
        <span
          className={`flex items-center gap-2 ${
            value
              ? "text-gray-700 font-normal"
              : "text-gray-400 font-light"
          } text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm`}
        >
          {isAutofilled && value ? (
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          ) : null}
          {value || "Select district"}
        </span>
        <ChevronDown
          className={`transition-transform duration-200 text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        onClose={closeDropdown}
        buttonRef={buttonRef}
        className="z-110000 overflow-hidden"
      >
        <div
          className="bg-white"
          onKeyDown={handleKeyDownOnList}
        >
          <div className="sticky top-0 bg-gray-50 z-10 p-3 border-b border-gray-200 shadow-sm">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search districts..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const next = filteredDistricts[focusedIndex];
                    if (next) handleSelect(next);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    closeDropdown();
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setFocusedIndex((index) =>
                      Math.min(
                        index + 1,
                        Math.max(filteredDistricts.length - 1, 0),
                      ),
                    );
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setFocusedIndex((index) => Math.max(index - 1, 0));
                  }
                }}
                className="w-full p-2 pl-9 pr-9 rounded-xl border-2 border-gray-200 focus:border-blue-950 focus:ring-2 focus:ring-blue-950 focus:outline-none text-xs sm:text-sm bg-white transition-all duration-150 ease-in-out"
                aria-label="Search districts"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div
            className="overflow-y-auto p-2 max-h-[220px] sm:max-h-[280px]"
            role="listbox"
            aria-label="Bangladesh districts"
          >
            {filteredDistricts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-xs sm:text-sm">
                No districts found
              </div>
            ) : (
              filteredDistricts.map((district, index) => {
                const isSelected = district === value;
                const isFocused = index === focusedIndex;
                return (
                  <div
                    key={district}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelect(district);
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`cursor-pointer px-4 py-3 rounded-md mx-1 text-xs sm:text-sm transition-colors duration-150 ${
                      isSelected
                        ? "bg-blue-900 text-white"
                        : isFocused
                          ? "bg-blue-50 text-gray-800"
                          : "text-gray-700 hover:bg-blue-900 hover:text-white"
                    }`}
                  >
                    {district}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DropdownPortal>
    </>
  );
};

export default DistrictDropdown;
