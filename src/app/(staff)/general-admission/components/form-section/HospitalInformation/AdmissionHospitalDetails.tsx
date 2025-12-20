import React, { useMemo } from "react";
import { Building2 } from "lucide-react";
import { useAdmissionHospitalData, useAdmissionActions } from "../../../stores";

const AdmissionHospitalDetails: React.FC<{ readonly?: boolean }> = ({
  readonly = false,
}) => {
  const hospitalData = useAdmissionHospitalData();
  const { setHospitalData } = useAdmissionActions();

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
      if (disabled) {
        return `bg-gray-200 border-2 border-gray-300 cursor-not-allowed ${baseStyle}`;
      }
      if (!isValid && value) {
        return `bg-red-50 border-2 border-red-500 ${baseStyle}`;
      }
      return value
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
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
    <div className="space-y-4">
      {/* Address */}
      <div>
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
            Hospital Address
          </label>
          {isExisting && !readonly && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200">
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

      {/* Phone & Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Phone Number
          </label>
          <input
            type="text"
            className={inputClassName(
              hospitalData.phoneNumber,
              true,
              isReadonly
            )}
            value={hospitalData.phoneNumber}
            onChange={(e) =>
              handleHospitalDataChange("phoneNumber", e.target.value)
            }
            placeholder="Hospital phone"
            disabled={isReadonly}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Hospital Type
          </label>
          <select
            className={inputClassName(hospitalData.type, true, isReadonly)}
            value={hospitalData.type}
            onChange={(e) => handleHospitalDataChange("type", e.target.value)}
            disabled={isReadonly}
          >
            <option value="">Select type</option>
            {hospitalTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdmissionHospitalDetails;
