"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, MapPin, User } from "lucide-react";
import DistrictDropdown from "./DistrictDropdown";
import {
  formatBangladeshAddress,
  parseBangladeshAddress,
  type BangladeshDistrict,
} from "@/lib/bangladeshAddress";

interface PatientAddressFieldsProps {
  value: string;
  onChange: (address: string) => void;
  isAutofilled?: boolean;
  disabled?: boolean;
}

const PatientAddressFields: React.FC<PatientAddressFieldsProps> = ({
  value,
  onChange,
  isAutofilled = false,
  disabled = false,
}) => {
  const mainAddressId = useId();
  const otherAddressId = useId();
  const parsed = useMemo(() => parseBangladeshAddress(value), [value]);
  const { addressDetails, district, isLegacy } = parsed;
  const [detailsDraft, setDetailsDraft] = useState(addressDetails);
  const lastEmittedValueRef = useRef<string | null>(null);

  useEffect(() => {
    if (value === lastEmittedValueRef.current) {
      lastEmittedValueRef.current = null;
      return;
    }

    setDetailsDraft(addressDetails);
  }, [addressDetails, value]);

  const canonicalPreview = useMemo(
    () => formatBangladeshAddress(detailsDraft, district),
    [detailsDraft, district],
  );
  const showLegacyWarning = isLegacy && isAutofilled;

  const handleDistrictChange = useCallback(
    (next: BangladeshDistrict) => {
      const nextAddress = formatBangladeshAddress(detailsDraft, next);
      setDetailsDraft(parseBangladeshAddress(nextAddress).addressDetails);
      lastEmittedValueRef.current = nextAddress;
      onChange(nextAddress);
    },
    [detailsDraft, onChange],
  );

  const handleDetailsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextDetails = event.target.value;
      const nextAddress = district
        ? `${nextDetails}, ${district}`
        : nextDetails;

      setDetailsDraft(nextDetails);
      lastEmittedValueRef.current = nextAddress;
      onChange(nextAddress);
    },
    [district, onChange],
  );

  return (
    <section
      aria-label="Patient address"
      className="rounded-xl border-2 border-indigo-100 bg-indigo-50/40 p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
            <MapPin className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs sm:text-sm font-semibold text-indigo-800">
            Patient Address
          </span>
        </div>
        {isAutofilled && value ? (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
            <User className="w-3 h-3 mr-1 text-blue-500" /> Auto-filled
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.6fr)] gap-4">
        <div>
          <label
            htmlFor={mainAddressId}
            className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2"
          >
            Main Address (District)
            <span className="text-red-500">*</span>
          </label>
          <DistrictDropdown
            id={mainAddressId}
            value={district}
            onSelect={handleDistrictChange}
            disabled={disabled}
            isAutofilled={isAutofilled}
          />
          {showLegacyWarning && !district ? (
            <p className="mt-1.5 text-[11px] sm:text-xs text-amber-700 font-medium">
              Select a district to standardize this address before saving.
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={otherAddressId}
            className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2"
          >
            Other Address
          </label>
          <input
            id={otherAddressId}
            type="text"
            value={detailsDraft}
            onChange={handleDetailsChange}
            disabled={disabled}
            placeholder="Village, union, upazila, road or house (optional)"
            className="text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-3 sm:px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm bg-white border-2 border-gray-300 disabled:bg-gray-200 disabled:border-gray-300 disabled:cursor-not-allowed"
          />
          <p className="mt-1.5 text-[11px] sm:text-xs text-gray-500 font-medium">
            Village, union, upazila, road or house (optional)
          </p>
        </div>

        {district ? (
          <p className="lg:col-span-2 text-[11px] sm:text-xs text-indigo-700 font-semibold bg-white border border-indigo-100 rounded-lg px-3 py-2">
            Saved as: {canonicalPreview}
          </p>
        ) : null}

        {showLegacyWarning && district ? (
          <div
            role="status"
            className="lg:col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-[11px] sm:text-xs px-3 py-2"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Legacy address: a recognized alias was upgraded to{" "}
              <span className="font-semibold">{district}</span>. Save to write
              the canonical value.
            </p>
          </div>
        ) : null}

        {showLegacyWarning && !district ? (
          <div
            role="status"
            className="lg:col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-[11px] sm:text-xs px-3 py-2"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Legacy address: select a district to standardize this address
              before saving.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PatientAddressFields;
