import React, { useMemo } from "react";
import { MapPin } from "lucide-react";
import {
  useInfertilityPatientData,
  useInfertilityActions,
} from "../../../stores";

const PatientAddress: React.FC = () => {
  const patientData = useInfertilityPatientData();
  const { setPatientData } = useInfertilityActions();
  const isExisting = !!patientData.id;

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (value: string, disabled: boolean) =>
      disabled
        ? `bg-gray-200 border-2 border-gray-300 cursor-not-allowed ${baseStyle}`
        : `bg-white border-2 border-gray-300 ${baseStyle}`;
  }, []);

  return (
    <div className="mb-3 sm:mb-4">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
          Address
        </label>
        {isExisting && patientData.address && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
            <MapPin className="w-3 h-3 mr-1 text-indigo-500" /> Auto-filled
          </span>
        )}
      </div>
      <textarea
        className={`${inputClassName(patientData.address, false)} resize-none`}
        value={patientData.address}
        onChange={(e) =>
          setPatientData({ ...patientData, address: e.target.value })
        }
        placeholder="Patient address"
        rows={2}
      />
    </div>
  );
};
export default PatientAddress;
