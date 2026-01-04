import React, { useMemo } from "react";
import { Building2 } from "lucide-react";
import { useAdmissionHospitalData, useAdmissionActions } from "../../../stores";
import HospitalTypeDropdown from "@/components/form-sections/Fields/HospitalTypeDropdown";
import ContactPhoneInput from "@/components/form-sections/Fields/ContactPhoneInput";
import ContactEmailInput from "@/components/form-sections/Fields/ContactEmailInput";

const AdmissionHospitalDetails: React.FC<{ readonly?: boolean }> = ({
  readonly = false,
}) => {
  const hospitalData = useAdmissionHospitalData();
  const { setHospitalData, setValidationStatus } = useAdmissionActions();

  const hospitalTypes = [
    "Government Hospital",
    "Private Hospital",
    "Clinic",
    "Medical Center",
    "Specialty Center",
    "Other",
  ];

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (
      value: string,
      isValid: boolean = true,
      disabled: boolean = false
    ) => {
      let style = disabled
        ? `bg-gray-200 border-2 border-gray-300 cursor-not-allowed ${baseStyle}`
        : baseStyle;
      if (!disabled) {
        if (!isValid && value) {
          style = `bg-red-50 border-2 border-red-500 ${baseStyle}`;
        } else {
          style += value
            ? ` bg-white border-2 border-green-700`
            : ` bg-gray-50 border-2 border-gray-300`;
        }
      }
      return style;
    };
  }, []);

  const handleHospitalDataChange = (
    field: keyof typeof hospitalData,
    value: string
  ) => {
    if (readonly) return;
    setHospitalData({ ...hospitalData, [field]: value });
  };

  const isExisting = hospitalData.id !== null;
  const isReadonly = readonly || isExisting;

  return (
    <div>
      {/* Type */}
      <div className="mb-3 sm:mb-4 relative">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
            Hospital Type<span className="text-red-500">*</span>
          </label>
          {isExisting && hospitalData.type && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
              <Building2 className="w-3 h-3 mr-1 text-blue-500" /> Auto-filled
            </span>
          )}
        </div>
        <HospitalTypeDropdown
          value={hospitalData.type}
          onSelect={(v) => handleHospitalDataChange("type", v)}
          options={hospitalTypes}
          disabled={isReadonly}
          inputClassName={inputClassName(hospitalData.type, true, isReadonly)}
        />
      </div>

      {/* Phone */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
            Phone Number
          </label>
          {isExisting && hospitalData.phoneNumber && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
              <Building2 className="w-3 h-3 mr-1 text-blue-500" /> Auto-filled
            </span>
          )}
        </div>
        <ContactPhoneInput
          value={hospitalData.phoneNumber}
          onChange={(val) => handleHospitalDataChange("phoneNumber", val)}
          onValidationChange={(isValid) =>
            setValidationStatus({ phone: isValid })
          }
          defaultCountry="BD"
          isAutofilled={isReadonly && !!hospitalData.phoneNumber}
        />
      </div>

      {/* Address */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
            Address
          </label>
          {isExisting && hospitalData.address && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm">
              <Building2 className="w-3 h-3 mr-1 text-purple-500" /> Auto-filled
            </span>
          )}
        </div>
        <textarea
          className={`${inputClassName(
            hospitalData.address,
            true,
            isReadonly
          )} resize-none`}
          value={hospitalData.address}
          onChange={(e) => handleHospitalDataChange("address", e.target.value)}
          placeholder="Hospital address"
          rows={2}
          disabled={isReadonly}
        />
      </div>

      {/* Email & Website */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
              Email
            </label>
            {isExisting && hospitalData.email && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-purple-500" />{" "}
                Auto-filled
              </span>
            )}
          </div>
          <ContactEmailInput
            value={hospitalData.email}
            onChange={(val) => handleHospitalDataChange("email", val)}
            onValidationChange={(isValid) =>
              setValidationStatus({ email: isValid })
            }
            placeholder="Hospital email"
            isAutofilled={isReadonly && !!hospitalData.email}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
              Website
            </label>
            {isExisting && hospitalData.website && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm">
                <Building2 className="w-3 h-3 mr-1 text-purple-500" />{" "}
                Auto-filled
              </span>
            )}
          </div>
          <input
            type="url"
            className={inputClassName(hospitalData.website, true, isReadonly)}
            value={hospitalData.website}
            onChange={(e) =>
              handleHospitalDataChange("website", e.target.value)
            }
            placeholder="Hospital website"
            disabled={isReadonly}
          />
        </div>
      </div>
    </div>
  );
};

export default AdmissionHospitalDetails;
