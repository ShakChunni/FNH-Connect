import React, { useMemo } from "react";
import { User, Calendar } from "lucide-react";
import {
  useInfertilityPatientData,
  useInfertilityActions,
} from "../../../stores";
import GenderDropdown from "../../../../../../components/form-sections/Fields/GenderDropdown";
import DateOfBirthDropdown from "../../../../../../components/form-sections/Fields/DobDropdown";

const PatientPersonalDetails: React.FC = () => {
  const patientData = useInfertilityPatientData();
  const { setPatientData } = useInfertilityActions();

  // Determine if autofilled (has ID)
  const isExisting = !!patientData.id;

  const inputClassName = useMemo(() => {
    // Reusing standard class
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
      return style;
    };
  }, []);

  const handleDOBChange = (
    date: Date | null,
    age?: { years: number; months: number; days: number }
  ) => {
    setPatientData({
      ...patientData,
      dateOfBirth: date,
      age: age ? age.years : null,
    });
  };

  return (
    <>
      <div className="mb-3 sm:mb-4">
        <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
          Patient Gender<span className="text-red-500">*</span>
        </label>
        <GenderDropdown
          value={patientData.gender || "Female"}
          onSelect={(v) => setPatientData({ ...patientData, gender: v })}
          style={{ width: "100%" }}
          autofilled={false} // Maybe set true if isExisting? User didn't ask for strict mimic of badging perfectly everywhere, just cleanup.
        />
      </div>

      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
            Patient Date of Birth
          </label>
          {isExisting && patientData.dateOfBirth && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 shadow-sm">
              <Calendar className="w-3 h-3 mr-1 text-rose-500" /> Auto-filled
            </span>
          )}
        </div>
        <div className="relative">
          <DateOfBirthDropdown
            value={patientData.dateOfBirth}
            onChange={handleDOBChange}
          />
        </div>
      </div>

      <div className="mb-3 sm:mb-4">
        <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
          Patient Age (Years)
        </label>
        <input
          type="number"
          value={patientData.age ?? ""}
          readOnly
          className={inputClassName(patientData.age, true, true)} // Read-only derived
          placeholder="Auto-calculated from DOB"
        />
      </div>
    </>
  );
};

export default PatientPersonalDetails;
