import React, { useMemo } from "react";
import { Activity, Bed } from "lucide-react";
import { useAdmissionInfo, useAdmissionActions } from "../../../stores";
import { ADMISSION_STATUS_OPTIONS, AdmissionStatus } from "../../../types";
import StatusDropdown from "@/components/form-sections/Fields/StatusDropdown";

const AdmissionStatusSection: React.FC = () => {
  const admissionInfo = useAdmissionInfo();
  const { updateAdmissionInfo } = useAdmissionActions();

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-amber-900 focus:ring-2 focus:ring-amber-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (value: string) =>
      value
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
  }, []);

  // Get status options as string array for dropdown
  const statusOptions = useMemo(
    () => ADMISSION_STATUS_OPTIONS.map((opt) => opt.label),
    []
  );

  // Get current status label
  const currentStatusLabel = useMemo(() => {
    const option = ADMISSION_STATUS_OPTIONS.find(
      (o) => o.value === admissionInfo.status
    );
    return option?.label || admissionInfo.status;
  }, [admissionInfo.status]);

  // Handle status selection - convert label back to value
  const handleStatusSelect = (label: string) => {
    const option = ADMISSION_STATUS_OPTIONS.find((o) => o.label === label);
    if (option) {
      updateAdmissionInfo("status", option.value as AdmissionStatus);
    }
  };

  return (
    <div id="status" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      {/* Header - matching pathology section style */}
      <div className="bg-linear-to-r from-amber-50 to-orange-100 border-amber-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md shrink-0">
            <Activity className="text-amber-600" size={28} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
              Admission Status
            </h3>
            <p className="text-amber-700 text-[11px] sm:text-xs font-medium leading-tight transition-colors duration-300 mt-1">
              Current status and room information
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-4 sm:space-y-5">
        {/* Status Dropdown */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Status
          </label>
          <StatusDropdown
            value={currentStatusLabel}
            onSelect={handleStatusSelect}
            options={statusOptions}
            inputClassName={inputClassName(admissionInfo.status)}
          />
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
