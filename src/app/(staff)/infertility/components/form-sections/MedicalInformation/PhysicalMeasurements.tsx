import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Ruler } from "lucide-react";
import {
  useInfertilityMedicalInfo,
  useInfertilityPatientData,
  useInfertilityActions,
} from "../../../stores";
import BloodGroupDropdown from "../../../../../../components/form-sections/Fields/BloodGroupDropdown";
import NumberInput from "@/components/form-sections/Fields/NumberInput";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type HeightUnit = "cm" | "ft";

// Conversion helpers
const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

const feetInchesToCm = (feet: number, inches: number): number => {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
};

const PhysicalMeasurements: React.FC = () => {
  const medicalInfo = useInfertilityMedicalInfo();
  const patientData = useInfertilityPatientData();
  const { updateMedicalInfo, setPatientData } = useInfertilityActions();

  // Height unit state - default to feet/inches
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("ft");
  const [feetValue, setFeetValue] = useState<number | null>(null);
  const [inchesValue, setInchesValue] = useState<number | null>(null);

  // Sync feet/inches when height changes from outside (e.g., patient loaded)
  useEffect(() => {
    if (medicalInfo.height && heightUnit === "ft") {
      const { feet, inches } = cmToFeetInches(medicalInfo.height);
      setFeetValue(feet);
      setInchesValue(inches);
    }
  }, [medicalInfo.height, heightUnit]);

  const handleBloodGroupChange = (value: string) => {
    setPatientData({ ...patientData, bloodGroup: value });
  };

  const handleHeightUnitChange = (unit: HeightUnit) => {
    if (unit === heightUnit) return;

    if (unit === "ft" && medicalInfo.height) {
      // Convert cm to feet/inches for display
      const { feet, inches } = cmToFeetInches(medicalInfo.height);
      setFeetValue(feet);
      setInchesValue(inches);
    }
    setHeightUnit(unit);
  };

  const handleFeetInchesChange = useCallback(
    (feet: number | null, inches: number | null) => {
      setFeetValue(feet);
      setInchesValue(inches);

      // Convert to cm and update store (always store in cm)
      if (feet !== null || inches !== null) {
        const cmValue = feetInchesToCm(feet || 0, inches || 0);
        updateMedicalInfo("height", cmValue > 0 ? cmValue : null);
      } else {
        updateMedicalInfo("height", null);
      }
    },
    [updateMedicalInfo]
  );

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
        <span className="text-base sm:text-lg font-bold text-gray-800">
          Physical Measurements
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Weight (kg)
          </label>
          <NumberInput
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

        {/* Height with Unit Switcher */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700">
              Height
            </label>
            {/* Unit Switcher */}
            <div className="relative flex bg-gray-100 rounded-full p-0.5 shadow-inner">
              <div
                className={`absolute top-0.5 h-[calc(100%-4px)] rounded-full bg-purple-500 shadow-md transition-all duration-300 ease-out ${
                  heightUnit === "cm"
                    ? "left-0.5 w-[calc(50%-2px)]"
                    : "left-[50%] w-[calc(50%-2px)]"
                }`}
              />
              <button
                type="button"
                onClick={() => handleHeightUnitChange("cm")}
                className={`relative z-10 px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full transition-colors duration-200 cursor-pointer ${
                  heightUnit === "cm"
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                cm
              </button>
              <button
                type="button"
                onClick={() => handleHeightUnitChange("ft")}
                className={`relative z-10 px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full transition-colors duration-200 cursor-pointer ${
                  heightUnit === "ft"
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                ft
              </button>
            </div>
          </div>

          {heightUnit === "cm" ? (
            <NumberInput
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
              placeholder="Enter height in cm"
            />
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <NumberInput
                  value={feetValue ?? ""}
                  onChange={(e) =>
                    handleFeetInchesChange(
                      e.target.value ? parseInt(e.target.value) : null,
                      inchesValue
                    )
                  }
                  className={inputClassName(
                    feetValue,
                    isNumberValid(feetValue)
                  )}
                  placeholder="Feet"
                  max={9}
                />
              </div>
              <div className="flex-1">
                <NumberInput
                  value={inchesValue ?? ""}
                  onChange={(e) =>
                    handleFeetInchesChange(
                      feetValue,
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className={inputClassName(
                    inchesValue,
                    isNumberValid(inchesValue)
                  )}
                  placeholder="Inches"
                  max={11}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            BMI
          </label>
          <NumberInput
            value={medicalInfo.bmi ?? ""}
            readOnly
            className={inputClassName(medicalInfo.bmi, true, true)}
            placeholder="Auto-calculated"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
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
