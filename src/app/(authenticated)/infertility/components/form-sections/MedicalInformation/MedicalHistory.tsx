import React, { useMemo } from "react";
import { ClipboardList, Droplets } from "lucide-react";
import {
  useInfertilityMedicalInfo,
  useInfertilityActions,
} from "../../../stores";

const MedicalHistory: React.FC = () => {
  const medicalInfo = useInfertilityMedicalInfo();
  const { updateMedicalInfo } = useInfertilityActions();

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (value: string) =>
      value
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
  }, []);

  // Also putting Blood Pressure here or create separate?
  // Plan said BP with PhysicalMeasurements, but original code had separate section.
  // I put BP in PhysicalMeasurements in Plan? No, Plan said "Height, Weight, BMI, Blood Pressure".
  // Wait, original code had BP in separate "Blood Pressure" section.
  // I forgot to include BP input in `PhysicalMeasurements.tsx` just now! I put Helper: Blood Group instead.
  // Let me check my previous file `PhysicalMeasurements.tsx`.
  // It has `Weight`, `Height`, `BMI`, `BloodGroup`. No BP.
  // I should create a separate small component `BloodPressure.tsx` or stick it into `MedicalHistory.tsx` or `PhysicalMeasurements.tsx`.
  // I'll create `BloodPressure.tsx` quickly or append it to `PhysicalMeasurements`.
  // I'll do separate `BloodPressure.tsx` to be clean.

  return (
    <div className="mb-6 border-t border-gray-200 pt-6 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList size={20} className="text-purple-500" />
        <span className="text-base sm:text-lg font-bold text-gray-800">
          Medical & Surgical History
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Medical History
          </label>
          <textarea
            value={medicalInfo.medicalHistory}
            onChange={(e) =>
              updateMedicalInfo("medicalHistory", e.target.value)
            }
            className={`${inputClassName(
              medicalInfo.medicalHistory
            )} resize-none min-h-20`}
            placeholder="Enter medical history..."
            rows={3}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Surgical History
          </label>
          <textarea
            value={medicalInfo.surgicalHistory}
            onChange={(e) =>
              updateMedicalInfo("surgicalHistory", e.target.value)
            }
            className={`${inputClassName(
              medicalInfo.surgicalHistory
            )} resize-none min-h-20`}
            placeholder="Enter surgical history..."
            rows={3}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Menstrual History
          </label>
          <textarea
            value={medicalInfo.menstrualHistory}
            onChange={(e) =>
              updateMedicalInfo("menstrualHistory", e.target.value)
            }
            className={`${inputClassName(
              medicalInfo.menstrualHistory
            )} resize-none min-h-20`}
            placeholder="Enter menstrual history..."
            rows={3}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Contraceptive History
          </label>
          <textarea
            value={medicalInfo.contraceptiveHistory}
            onChange={(e) =>
              updateMedicalInfo("contraceptiveHistory", e.target.value)
            }
            className={`${inputClassName(
              medicalInfo.contraceptiveHistory
            )} resize-none min-h-20`}
            placeholder="Enter contraceptive history..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
export default MedicalHistory;
