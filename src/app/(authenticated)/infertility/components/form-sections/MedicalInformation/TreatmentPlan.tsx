import React, { useMemo } from "react";
import { Pill, FileText } from "lucide-react";
import {
  useInfertilityMedicalInfo,
  useInfertilityActions,
} from "../../../stores";

const TreatmentPlan: React.FC = () => {
  const medicalInfo = useInfertilityMedicalInfo();
  const { updateMedicalInfo } = useInfertilityActions();

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-slate-700 font-normal rounded-lg py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm  transition duration-200 placeholder:text-slate-400 placeholder:font-light text-xs sm:text-sm";
    return (value: string) =>
      value
        ? `bg-white border-2 border-emerald-700 ${baseStyle}`
        : `bg-slate-50 border-2 border-slate-300 ${baseStyle}`;
  }, []);

  return (
    <>
      <div className="mb-6 border-t border-slate-200 pt-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Pill size={20} className="text-purple-500" />
          <span className="text-base sm:text-lg font-bold text-slate-800">
            Treatment & Medications
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
              Treatment Plan
            </label>
            <textarea
              value={medicalInfo.treatmentPlan}
              onChange={(e) =>
                updateMedicalInfo("treatmentPlan", e.target.value)
              }
              className={`${inputClassName(
                medicalInfo.treatmentPlan
              )} resize-none min-h-[5rem]`}
              placeholder="Enter treatment plan..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
              Medications
            </label>
            <textarea
              value={medicalInfo.medications}
              onChange={(e) => updateMedicalInfo("medications", e.target.value)}
              className={`${inputClassName(
                medicalInfo.medications
              )} resize-none min-h-[5rem]`}
              placeholder="Enter current medications..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="mb-2 border-t border-slate-200 pt-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={20} className="text-purple-500" />
          <span className="text-base sm:text-lg font-bold text-slate-800">
            Additional Notes
          </span>
        </div>
        <textarea
          value={medicalInfo.notes}
          onChange={(e) => updateMedicalInfo("notes", e.target.value)}
          placeholder="Any additional notes..."
          className={`${inputClassName(
            medicalInfo.notes
          )} resize-none min-h-[6rem]`}
          rows={4}
        />
      </div>
    </>
  );
};
export default TreatmentPlan;
