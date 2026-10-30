import React, { useMemo } from "react";
import { HeartPulse } from "lucide-react";
import {
  useInfertilityMedicalInfo,
  useInfertilityActions,
} from "../../../stores";

const ObstetricHistory: React.FC = () => {
  const medicalInfo = useInfertilityMedicalInfo();
  const { updateMedicalInfo } = useInfertilityActions();

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-slate-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm  transition duration-200 placeholder:text-slate-400 placeholder:font-light text-xs sm:text-sm";
    return (value: string) =>
      value
        ? `bg-white border-2 border-emerald-700 ${baseStyle}`
        : `bg-slate-50 border-2 border-slate-300 ${baseStyle}`;
  }, []);

  return (
    <div className="mb-6 border-t border-slate-200 pt-6 mt-6">
      <div className="flex items-center gap-2 mb-2">
        <HeartPulse size={20} className="text-purple-500" />
        <span className="text-base sm:text-lg font-bold text-slate-800">
          Obstetric History
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
            Para
          </label>
          <input
            type="text"
            value={medicalInfo.para}
            onChange={(e) => updateMedicalInfo("para", e.target.value)}
            className={inputClassName(medicalInfo.para)}
            placeholder="Enter para"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
            Gravida
          </label>
          <input
            type="text"
            value={medicalInfo.gravida}
            onChange={(e) => updateMedicalInfo("gravida", e.target.value)}
            className={inputClassName(medicalInfo.gravida)}
            placeholder="Enter gravida"
          />
        </div>
      </div>
    </div>
  );
};
export default ObstetricHistory;
