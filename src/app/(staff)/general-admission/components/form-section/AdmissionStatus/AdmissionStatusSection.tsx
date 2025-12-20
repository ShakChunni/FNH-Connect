import React, { useMemo } from "react";
import { Activity, Bed } from "lucide-react";
import { useAdmissionInfo, useAdmissionActions } from "../../../stores";
import { ADMISSION_STATUS_OPTIONS, AdmissionStatus } from "../../../types";

const AdmissionStatusSection: React.FC = () => {
  const admissionInfo = useAdmissionInfo();
  const { updateAdmissionInfo } = useAdmissionActions();

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-amber-900 focus:ring-2 focus:ring-amber-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";
    return (value: string) =>
      value
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
  }, []);

  return (
    <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl p-4 sm:p-6 md:p-8 border border-amber-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 flex items-center justify-center">
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
            Admission Status
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Current status and room information
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Status Dropdown */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Status
          </label>
          <select
            className={inputClassName(admissionInfo.status)}
            value={admissionInfo.status}
            onChange={(e) =>
              updateAdmissionInfo("status", e.target.value as AdmissionStatus)
            }
          >
            {ADMISSION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Room/Ward */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              <Bed className="w-4 h-4 inline mr-1" />
              Room / Seat Number
            </label>
            <input
              type="text"
              className={inputClassName(admissionInfo.seatNumber)}
              value={admissionInfo.seatNumber}
              onChange={(e) =>
                updateAdmissionInfo("seatNumber", e.target.value)
              }
              placeholder="e.g., Room 101, Bed A"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Ward
            </label>
            <input
              type="text"
              className={inputClassName(admissionInfo.ward)}
              value={admissionInfo.ward}
              onChange={(e) => updateAdmissionInfo("ward", e.target.value)}
              placeholder="e.g., General Ward, ICU"
            />
          </div>
        </div>

        {/* Medical Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Diagnosis
            </label>
            <input
              type="text"
              className={inputClassName(admissionInfo.diagnosis)}
              value={admissionInfo.diagnosis}
              onChange={(e) => updateAdmissionInfo("diagnosis", e.target.value)}
              placeholder="Enter diagnosis"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              OT Type
            </label>
            <input
              type="text"
              className={inputClassName(admissionInfo.otType)}
              value={admissionInfo.otType}
              onChange={(e) => updateAdmissionInfo("otType", e.target.value)}
              placeholder="e.g., LUCS, D&E"
            />
          </div>
        </div>

        {/* Treatment */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Treatment
          </label>
          <textarea
            className={`${inputClassName(admissionInfo.treatment)} resize-none`}
            value={admissionInfo.treatment}
            onChange={(e) => updateAdmissionInfo("treatment", e.target.value)}
            placeholder="Treatment details..."
            rows={2}
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Remarks
          </label>
          <textarea
            className={`${inputClassName(admissionInfo.remarks)} resize-none`}
            value={admissionInfo.remarks}
            onChange={(e) => updateAdmissionInfo("remarks", e.target.value)}
            placeholder="Additional notes..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};

export default AdmissionStatusSection;
