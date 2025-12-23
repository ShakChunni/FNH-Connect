"use client";
import React, { useMemo } from "react";
import { Stethoscope } from "lucide-react";
import {
  useAdmissionDepartmentData,
  useAdmissionDoctorData,
  useAdmissionInfo,
  useAdmissionActions,
} from "../../../stores";
import DepartmentDropdown from "./DepartmentDropdown";
import DoctorDropdown from "./DoctorDropdown";
import type { Department, Doctor } from "../../../types";

interface DepartmentSelectionProps {
  readonly?: boolean;
  allowEditComplaint?: boolean;
  hideWardRoom?: boolean;
}

const DepartmentSelection: React.FC<DepartmentSelectionProps> = ({
  readonly = false,
  allowEditComplaint = false,
  hideWardRoom = false,
}) => {
  const departmentData = useAdmissionDepartmentData();
  const doctorData = useAdmissionDoctorData();
  const { setDepartmentData, setDoctorData } = useAdmissionActions();

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-purple-900 focus:ring-2 focus:ring-purple-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";
    return (value: string | number | null, disabled: boolean = false) => {
      if (disabled) {
        return `bg-gray-200 border-2 border-gray-300 cursor-not-allowed ${baseStyle}`;
      }
      const hasValue = value !== null && value !== "";
      return hasValue
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
    };
  }, []);

  const handleDepartmentChange = (
    id: number | null,
    department?: Department
  ) => {
    setDepartmentData({
      id: id || null,
      name: department?.name || "",
    });
  };

  const handleDoctorChange = (id: number | null, doctor?: Doctor) => {
    setDoctorData({
      id: id || null,
      fullName: doctor?.fullName || "",
      specialization: doctor?.specialization || "",
    });
  };

  const admissionInfo = useAdmissionInfo();
  const { updateAdmissionInfo } = useAdmissionActions();

  const getDescription = () => {
    if (departmentData.id && doctorData.id) {
      return `${departmentData.name} • Dr. ${doctorData.fullName}`;
    }
    return "Select admission department and referring doctor";
  };

  return (
    <div id="department" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      {/* Header */}
      <div
        className={`bg-linear-to-r from-purple-50 to-purple-100 border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md shrink-0">
            <Stethoscope className={"text-purple-600"} size={28} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                Department & Doctor
              </h3>
            </div>
            <p className="text-purple-700 text-[11px] sm:text-xs font-medium leading-tight transition-colors duration-300 mt-1">
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Department Dropdown */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Department<span className="text-red-500">*</span>
          </label>
          <DepartmentDropdown
            value={departmentData.id}
            onSelect={handleDepartmentChange}
            disabled={readonly}
            inputClassName={inputClassName(departmentData.id, readonly)}
          />
        </div>

        {/* Doctor Dropdown */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Referred By / Doctor<span className="text-red-500">*</span>
          </label>
          <DoctorDropdown
            value={doctorData.id}
            onSelect={handleDoctorChange}
            disabled={readonly}
            inputClassName={inputClassName(doctorData.id, readonly)}
          />
        </div>

        {/* Chief Complaint - Full Width Row */}
        <div className="sm:col-span-2 mt-2">
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Chief Complaint
          </label>
          <textarea
            className={`${inputClassName(
              admissionInfo.chiefComplaint,
              readonly && !allowEditComplaint
            )} min-h-[100px] resize-none py-3`}
            placeholder="Enter patient's chief complaint / reasons for admission..."
            value={admissionInfo.chiefComplaint}
            onChange={(e) =>
              updateAdmissionInfo("chiefComplaint", e.target.value)
            }
            disabled={readonly && !allowEditComplaint}
          />
        </div>

        {/* Ward & Room - Grid Row */}
        {!hideWardRoom && (
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {/* Ward / Cabin */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                Ward / Cabin
              </label>
              <input
                type="text"
                className={inputClassName(
                  admissionInfo.ward,
                  readonly && !allowEditComplaint
                )}
                placeholder="Enter Ward/Cabin (e.g. Male Ward)"
                value={admissionInfo.ward || ""}
                onChange={(e) => updateAdmissionInfo("ward", e.target.value)}
                disabled={readonly && !allowEditComplaint}
              />
            </div>

            {/* Room / Seat Number */}
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                Room / Seat No.
              </label>
              <input
                type="text"
                className={inputClassName(
                  admissionInfo.seatNumber,
                  readonly && !allowEditComplaint
                )}
                placeholder="Enter Room/Seat No (e.g. 102)"
                value={admissionInfo.seatNumber || ""}
                onChange={(e) =>
                  updateAdmissionInfo("seatNumber", e.target.value)
                }
                disabled={readonly && !allowEditComplaint}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DepartmentSelection);
