"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, MapPin, User, X } from "lucide-react";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import {
  formatBangladeshAddress,
  getBangladeshDistrictSuggestions,
  parseBangladeshAddress,
  type BangladeshDistrict,
} from "@/lib/bangladeshAddress";

interface PatientAddressFieldsProps {
  value: string;
  onChange: (address: string) => void;
  isAutofilled?: boolean;
  disabled?: boolean;
}

function getLastAddressSegment(address: string): string {
  const segments = address.split(",").map((segment) => segment.trim());
  return segments[segments.length - 1] ?? "";
}

function removeLastAddressSegment(address: string): string {
  const segments = address
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.length > 1 ? segments.slice(0, -1).join(", ") : "";
}

const PatientAddressFields: React.FC<PatientAddressFieldsProps> = ({
  value,
  onChange,
  isAutofilled = false,
  disabled = false,
}) => {
  const addressId = useId();
  const suggestionsId = `${addressId}-suggestions`;
  const parsed = useMemo(() => parseBangladeshAddress(value), [value]);
  const [detailsDraft, setDetailsDraft] = useState(parsed.addressDetails);
  const [selectedDistrict, setSelectedDistrict] = useState<
    BangladeshDistrict | ""
  >(parsed.district);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const addressInputRef = useRef<HTMLTextAreaElement>(null);
  const lastEmittedValueRef = useRef<string | null>(null);

  const districtQuery = getLastAddressSegment(detailsDraft);
  const suggestions = useMemo(
    () => getBangladeshDistrictSuggestions(districtQuery),
    [districtQuery],
  );

  useEffect(() => {
    if (value === lastEmittedValueRef.current) {
      lastEmittedValueRef.current = null;
      return;
    }

    setDetailsDraft(parsed.addressDetails || value.trim());
    setSelectedDistrict(parsed.district);
    setIsSuggestionOpen(false);
  }, [parsed.addressDetails, parsed.district, value]);

  const emitAddress = useCallback(
    (nextDetails: string, district: BangladeshDistrict | "") => {
      const nextAddress = district
        ? formatBangladeshAddress(nextDetails, district)
        : nextDetails;

      lastEmittedValueRef.current = nextAddress;
      onChange(nextAddress);
    },
    [onChange],
  );

  const handleAddressChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextDetails = event.target.value;
      setDetailsDraft(nextDetails);

      if (selectedDistrict) {
        setIsSuggestionOpen(false);
        emitAddress(nextDetails, selectedDistrict);
        return;
      }

      setIsSuggestionOpen(getLastAddressSegment(nextDetails).length >= 2);
      emitAddress(nextDetails, "");
    },
    [emitAddress, selectedDistrict],
  );

  const handleDistrictSelect = useCallback(
    (district: BangladeshDistrict) => {
      const nextDetails = removeLastAddressSegment(detailsDraft);
      setDetailsDraft(nextDetails);
      setSelectedDistrict(district);
      setIsSuggestionOpen(false);
      emitAddress(nextDetails, district);
    },
    [detailsDraft, emitAddress],
  );

  const clearDistrictSelection = useCallback(() => {
    const nextDetails = detailsDraft.trim();
    setSelectedDistrict("");
    setIsSuggestionOpen(getLastAddressSegment(nextDetails).length >= 2);
    emitAddress(nextDetails, "");
    window.requestAnimationFrame(() => addressInputRef.current?.focus());
  }, [detailsDraft, emitAddress]);

  const showSuggestions =
    isSuggestionOpen && !selectedDistrict && suggestions.length > 0;

  return (
    <section
      aria-label="Patient address"
      className="rounded-xl border-2 border-indigo-100 bg-indigo-50/40 p-3 sm:p-4"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold text-indigo-800 sm:text-sm">
            Patient Address
          </span>
        </div>
        {isAutofilled && value ? (
          <span className="hidden items-center rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 shadow-sm sm:inline-flex">
            <User className="mr-1 h-3 w-3 text-blue-500" /> Auto-filled
          </span>
        ) : null}
      </div>

      <div className="relative">
        <label
          htmlFor={addressId}
          className="mb-1.5 block text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm"
        >
          Address
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id={addressId}
          ref={addressInputRef}
          value={detailsDraft}
          onChange={handleAddressChange}
          onFocus={() => {
            if (!selectedDistrict && districtQuery.length >= 2) {
              setIsSuggestionOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsSuggestionOpen(false);
          }}
          disabled={disabled}
          rows={2}
          placeholder="House/road, village, union, upazila, and zilla"
          className={`min-h-24 w-full resize-y rounded-lg border-2 px-3 py-2.5 text-xs font-normal leading-6 text-gray-700 outline-none transition-all duration-300 placeholder:font-light placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-950 hover:shadow-md sm:px-4 sm:text-sm ${
            disabled
              ? "cursor-not-allowed border-gray-300 bg-gray-200"
              : selectedDistrict
                ? "border-green-300 bg-white shadow-sm"
                : detailsDraft.trim()
                  ? "border-green-700 bg-white shadow-sm"
                  : "border-gray-300 bg-white shadow-sm"
          }`}
          aria-autocomplete="list"
          aria-controls={suggestionsId}
        />

        <DropdownPortal
          isOpen={showSuggestions}
          onClose={() => setIsSuggestionOpen(false)}
          buttonRef={addressInputRef}
          className="max-h-64 overflow-y-auto p-1"
        >
          <div id={suggestionsId} role="listbox" aria-label="Zilla suggestions">
            <div className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Select zilla
            </div>
            {suggestions.map((district) => (
              <button
                key={district}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleDistrictSelect(district)}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs text-gray-700 transition-colors hover:bg-indigo-50 sm:text-sm"
              >
                <span>{district}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
                  Use this zilla
                </span>
              </button>
            ))}
          </div>
        </DropdownPortal>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium sm:text-xs">
          {selectedDistrict ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1.5 text-gray-600 shadow-sm">
              <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                <Check className="h-3.5 w-3.5 text-green-600" />
                {selectedDistrict}
              </span>
              <span className="text-gray-400">Zilla selected</span>
              <button
                type="button"
                onClick={clearDistrictSelection}
                disabled={disabled}
                className="rounded-md p-0.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Remove selected zilla"
                title="Remove zilla and edit it manually"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-gray-500">
              Type the complete address. Suggestions appear when the last part
              matches a zilla.
            </span>
          )}
        </div>

        {parsed.isLegacy && isAutofilled ? (
          <div
            role="status"
            className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This saved address uses an older district spelling. Choose a
              suggestion if you want to standardize it.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PatientAddressFields;
