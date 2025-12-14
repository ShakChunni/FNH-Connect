import React, { useMemo } from "react";
import { Ruler } from "lucide-react";
import {
  useInfertilityMedicalInfo,
  useInfertilityPatientData,
  useInfertilityActions,
} from "../../../app/(staff)/infertility/stores";
import BloodGroupDropdown from "../Fields/BloodGroupDropdown";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const PhysicalMeasurements: React.FC = () => {
  const medicalInfo = useInfertilityMedicalInfo();
  const patientData = useInfertilityPatientData();
  const { updateMedicalInfo, setPatientData } = useInfertilityActions();

  const handleBloodGroupChange = (value: string) => {
    setPatientData({ ...patientData, bloodGroup: value });
  };

  const isNumberValid = (v: number | null) =>
    v === null || (!isNaN(Number(v)) && Number(v) >= 0);

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (
      value: string | number | null,
      isValid: boolean = true,
      disabled: boolean = false
    ) => {
      let style = disabled
        ? `bg-gray-200 border-2 border-gray-300 cursor-not-allowed ${baseStyle}`
        : baseStyle;
      if (!disabled && value !== "" && value !== null) {
        style += ` bg-white border-2 border-green-700`;
      } else if (!disabled) {
        style += ` bg-gray-50 border-2 border-gray-300`;
      }
      return style;
    };
  }, []);

  return (
    <div className="mb-6 border-t border-gray-200 pt-6 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Ruler size={20} className="text-purple-500" />
        <span className="text-md font-semibold text-gray-800">
          Physical Measurements
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            value={medicalInfo.weight ?? ""}
            onChange={(e) =>
              updateMedicalInfo(
                "weight",
                e.target.value ? parseFloat(e.target.value) : null
              )
            }
            className={inputClassName(
              medicalInfo.weight,
              isNumberValid(medicalInfo.weight)
            )}
            placeholder="Enter weight"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height (cm)
          </label>
          <input
            type="number"
            value={medicalInfo.height ?? ""}
            onChange={(e) =>
              updateMedicalInfo(
                "height",
                e.target.value ? parseFloat(e.target.value) : null
              )
            }
            className={inputClassName(
              medicalInfo.height,
              isNumberValid(medicalInfo.height)
            )}
            placeholder="Enter height"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            BMI
          </label>
          <input
            type="number"
            value={medicalInfo.bmi ?? ""}
            readOnly
            className={inputClassName(medicalInfo.bmi, true, true)}
            placeholder="Auto-calculated"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Blood Group
          </label>
          <BloodGroupDropdown
            value={patientData.bloodGroup}
            onSelect={handleBloodGroupChange}
            options={BLOOD_GROUPS}
            inputClassName={inputClassName(patientData.bloodGroup)}
          />
        </div>
      </div>
    </div>
  );
};
export default PhysicalMeasurements;
