import React, { useMemo } from "react";
import { Droplets } from "lucide-react";
import {
  useInfertilityMedicalInfo,
  useInfertilityActions,
} from "../../../app/(staff)/infertility/stores";

const BloodPressure: React.FC = () => {
  const medicalInfo = useInfertilityMedicalInfo();
  const { updateMedicalInfo } = useInfertilityActions();

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (value: string) =>
      value
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
  }, []);

  return (
    <div className="mb-6 border-t border-gray-200 pt-6 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <Droplets size={20} className="text-purple-500" />
        <span className="text-md font-semibold text-gray-800">
          Blood Pressure
        </span>
      </div>
      <input
        type="text"
        value={medicalInfo.bloodPressure}
        onChange={(e) => updateMedicalInfo("bloodPressure", e.target.value)}
        placeholder="e.g., 120/80"
        className={inputClassName(medicalInfo.bloodPressure)}
      />
    </div>
  );
};
export default BloodPressure;
