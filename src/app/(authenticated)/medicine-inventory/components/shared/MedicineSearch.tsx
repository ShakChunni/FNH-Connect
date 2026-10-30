/**
 * Medicine Search Component
 * Searchable dropdown for selecting medicines with stock info and inline add capability
 */

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClientPortal } from "@/components/ui/ClientPortal";
import {
  Pill,
  Loader2,
  PlusCircle,
  X,
  Check,
  AlertTriangle,
  Layers,
  ChevronDown,
} from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useFetchMedicines, useFetchMedicineGroups } from "../../hooks";
import type { Medicine } from "../../types";
import {
  getMedicineDisplayName,
  getMedicineGenericSubtitle,
} from "../../utils/medicineDisplay";
import { TONE_BADGE, TONE_TEXT } from "@/lib/statusStyles";

interface MedicineSearchProps {
  value: number | null;
  displayValue: string;
  onChange: (medicine: Medicine | null) => void;
  onAddNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  showStock?: boolean;
  stockFilter?: "all" | "inStock" | "lowStock";
}

export const MedicineSearch: React.FC<MedicineSearchProps> = ({
  value,
  displayValue,
  onChange,
  onAddNew,
  placeholder = "Search medicine...",
  disabled = false,
  error = false,
  showStock = true,
  stockFilter = "all",
}) => {
  const [searchQuery, setSearchQuery] = useState(displayValue);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const groupFilterButtonRef = useRef<HTMLButtonElement>(null);
  const [isGroupFilterOpen, setIsGroupFilterOpen] = useState(false);

  // Sync search query with display value from parent
  useEffect(() => {
    if (displayValue !== searchQuery && !isOpen) {
      setSearchQuery(displayValue);
    }
  }, [displayValue, isOpen]);

  // Fetch medicines with search
  const { data, isLoading, isError, refetch } = useFetchMedicines({
    search: isOpen ? searchQuery : undefined,
    groupId: selectedGroupId ?? undefined,
    lowStockOnly: stockFilter === "lowStock",
    limit: 20,
  });
  const { data: groups = [] } = useFetchMedicineGroups(true);

  const medicines = data?.data || [];

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Filter medicines based on search and stock
  const filteredMedicines = useMemo(() => {
    let result = medicines;

    // Filter by stock availability if needed (for sales)
    if (stockFilter === "inStock") {
      result = result.filter((m) => m.currentStock > 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          getMedicineDisplayName(m).toLowerCase().includes(query) ||
          m.genericName.toLowerCase().includes(query) ||
          (m.group?.name || "").toLowerCase().includes(query),
      );
    }

    return result;
  }, [medicines, searchQuery, stockFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (newQuery.length >= 1) {
      updateDropdownPosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    // Clear selection when typing
    if (value) {
      onChange(null);
    }
  };

  const handleSelectMedicine = (medicine: Medicine) => {
    onChange(medicine);
    setSearchQuery(getMedicineDisplayName(medicine));
    setIsOpen(false);
  };

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
    setSelectedGroupId(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (!value) {
          setSearchQuery(displayValue);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, displayValue]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();

    const handleScrollResize = () => {
      if (isOpen) updateDropdownPosition();
    };

    window.addEventListener("scroll", handleScrollResize, true);
    window.addEventListener("resize", handleScrollResize);

    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) {
      setIsGroupFilterOpen(false);
    }
  }, [isOpen]);

  const inputClassName = useMemo(() => {
    const base =
      "text-slate-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 pr-10 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm transition-colors placeholder:text-slate-400 placeholder:font-light text-xs sm:text-sm";

    if (disabled) {
      return `${base} bg-slate-200 border-2 border-slate-300 cursor-not-allowed`;
    }

    if (error) {
      return `${base} bg-red-50 border-2 border-red-500 cursor-pointer`;
    }

    if (value) {
      return `${base} bg-white border-2 border-emerald-600 cursor-pointer`;
    }

    return `${base} bg-white border-2 border-slate-300 cursor-pointer`;
  }, [disabled, error, value]);

  const showNoResults =
    isOpen &&
    !isLoading &&
    filteredMedicines.length === 0 &&
    searchQuery.trim().length > 0;
  const showResults = isOpen && filteredMedicines.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchQuery.length >= 1 || medicines.length > 0) {
              updateDropdownPosition();
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClassName} pl-10`}
        />
        {value && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* Dropdown Portal */}
      {isOpen && (
        <ClientPortal>
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[100001]"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: "320px",
              }}
            >
              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="ml-2 text-sm text-slate-500">
                    Searching...
                  </span>
                </div>
              )}

              {/* Group Filter */}
              {!isLoading && (
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60">
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Filter by Group
                  </label>
                  <button
                    ref={groupFilterButtonRef}
                    type="button"
                    onClick={() => setIsGroupFilterOpen(!isGroupFilterOpen)}
                    className="w-full h-9 px-2.5 flex items-center justify-between gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">
                        {selectedGroupId
                          ? groups.find((group) => group.id === selectedGroupId)
                              ?.name || "All groups"
                          : "All groups"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isGroupFilterOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <DropdownPortal
                    isOpen={isGroupFilterOpen}
                    onClose={() => setIsGroupFilterOpen(false)}
                    buttonRef={groupFilterButtonRef}
                    className="w-48"
                  >
                    <div className="py-1 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedGroupId(null);
                          setIsGroupFilterOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer ${
                          !selectedGroupId
                            ? "text-fnh-navy bg-fnh-navy/5"
                            : "text-slate-700"
                        }`}
                      >
                        All Groups
                      </button>
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            setSelectedGroupId(group.id);
                            setIsGroupFilterOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer ${
                            selectedGroupId === group.id
                              ? "text-fnh-navy bg-fnh-navy/5"
                              : "text-slate-700"
                          }`}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                  </DropdownPortal>
                </div>
              )}

              {/* Results */}
              {showResults && (
                <div className="max-h-[240px] overflow-y-auto">
                  {filteredMedicines.map((medicine) => {
                    const isLowStock =
                      medicine.currentStock <= medicine.lowStockThreshold;
                    const isOutOfStock = medicine.currentStock === 0;

                    return (
                      <button
                        key={medicine.id}
                        onClick={() => handleSelectMedicine(medicine)}
                        disabled={stockFilter === "inStock" && isOutOfStock}
                        className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 cursor-pointer ${
                          value === medicine.id ? "bg-blue-50" : ""
                        } ${
                          stockFilter === "inStock" && isOutOfStock
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isOutOfStock
                              ? `${TONE_BADGE.danger} ring-1 ring-inset`
                              : isLowStock
                                ? `${TONE_BADGE.warning} ring-1 ring-inset`
                                : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          <Pill className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {getMedicineDisplayName(medicine)}
                            </p>
                            {medicine.strength && (
                              <span className="text-xs text-slate-500">
                                {medicine.strength}
                              </span>
                            )}
                          </div>
                          {getMedicineGenericSubtitle(medicine) && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Generic: {getMedicineGenericSubtitle(medicine)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">
                              {medicine.group?.name || "Unknown Group"}
                            </span>
                            {showStock && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span
                                  className={`text-xs font-medium ${
                                    isOutOfStock
                                      ? TONE_TEXT.danger
                                      : isLowStock
                                        ? TONE_TEXT.warning
                                        : TONE_TEXT.success
                                  }`}
                                >
                                  {isOutOfStock
                                    ? "Out of stock"
                                    : `${medicine.currentStock} in stock`}
                                </span>
                                {isLowStock && !isOutOfStock && (
                                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {value === medicine.id && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Load failed */}
              {isError && (
                <div role="alert" className="p-4 text-center">
                  <p className="text-sm font-medium text-red-700">
                    Could not load medicines.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-3 h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* No Results + Add New */}
              {showNoResults && !isError && (
                <div className="p-4">
                  <p className="text-sm text-slate-500 mb-3 text-center">
                    No medicines found for &quot;{searchQuery}&quot;
                  </p>
                  {onAddNew && (
                    <button
                      onClick={handleAddNew}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">
                        Add new medicine
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Quick Add Option at Bottom */}
              {showResults && onAddNew && (
                <div className="border-t border-slate-100 p-2">
                  <button
                    onClick={handleAddNew}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">
                      Add new medicine
                    </span>
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ClientPortal>
      )}
    </div>
  );
};

export default MedicineSearch;
