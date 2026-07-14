"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, MapPin, User } from "lucide-react";
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
  const detailsId = useId();
  const parsed = useMemo(() => parseBangladeshAddress(value), [value]);
  const [detailsDraft, setDetailsDraft] = useState(parsed.addressDetails);
  const [district, setDistrict] = useState<BangladeshDistrict | "">(
    parsed.district,
  );
  const lastEmittedValueRef = useRef<string | null>(null);

  useEffect(() => {
    if (value === lastEmittedValueRef.current) {
      lastEmittedValueRef.current = null;
      return;
    }

    setDetailsDraft(parsed.addressDetails);
    setDistrict(parsed.district);
  }, [parsed.addressDetails, parsed.district, value]);

  const emitAddress = useCallback(
    (details: string, nextDistrict: BangladeshDistrict | "") => {
      const nextAddress = formatBangladeshAddress(details, nextDistrict);
      lastEmittedValueRef.current = nextAddress;
      onChange(nextAddress);
    },
    [onChange],
  );

  const handleDistrictChange = useCallback(
    (nextDistrict: BangladeshDistrict) => {
      setDistrict(nextDistrict);
      emitAddress(detailsDraft, nextDistrict);
    },
    [detailsDraft, emitAddress],
  );

  const handleDetailsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextDetails = event.target.value;
      setDetailsDraft(nextDetails);
      emitAddress(nextDetails, district);
    },
    [district, emitAddress],
  );

  const exactAddress = formatBangladeshAddress(detailsDraft, district);

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.6fr)]">
        <div>
          <label
            htmlFor={`${detailsId}-district`}
            className="mb-1.5 block text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm"
          >
            District / Zilla
            <span className="text-red-500">*</span>
          </label>
          <DistrictDropdown
            id={`${detailsId}-district`}
            value={district}
            onSelect={handleDistrictChange}
            disabled={disabled}
            isAutofilled={isAutofilled}
          />
          {!district ? (
            <p className="mt-1.5 text-[11px] font-medium text-amber-700 sm:text-xs">
              Select a district before saving this patient.
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={detailsId}
            className="mb-1.5 block text-xs font-semibold text-gray-700 sm:mb-2 sm:text-sm"
          >
            Other Address
            <span className="ml-1 text-xs font-normal text-gray-400">
              (optional)
            </span>
          </label>
          <input
            id={detailsId}
            type="text"
            value={detailsDraft}
            onChange={handleDetailsChange}
            disabled={disabled}
            placeholder="Village, union, upazila, road or house"
            className={`h-12 w-full rounded-lg border-2 px-3 py-2 text-xs font-normal text-gray-700 outline-none transition-all duration-300 placeholder:font-light placeholder:text-gray-400 focus:border-blue-900 focus:ring-2 focus:ring-blue-950 hover:shadow-md disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 sm:px-4 sm:text-sm md:h-14 ${
              detailsDraft.trim()
                ? "border-green-700 bg-white"
                : "border-gray-300 bg-white"
            }`}
          />
          <p className="mt-1.5 rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1.5 text-[11px] font-semibold leading-4 text-indigo-700 sm:text-xs">
            Do not type the district here again. Select it once in the dropdown
            above, then enter only village, union, upazila, road or house
            details in this box.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-500 sm:text-xs">
              Exact address on report / receipt
            </p>
            {district ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                <Check className="h-3 w-3" /> Ready
              </span>
            ) : null}
          </div>
          <p
            className={`mt-1.5 break-words text-xs leading-5 sm:text-sm ${
              exactAddress
                ? "font-semibold text-gray-800"
                : "font-medium text-gray-400"
            }`}
          >
            {exactAddress || "Select a district to complete the address"}
          </p>
        </div>

        {parsed.isLegacy && isAutofilled ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs lg:col-span-2"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This saved address used an older zilla spelling. Select the
              district again to standardize it.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default PatientAddressFields;
