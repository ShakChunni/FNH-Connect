import React, { useMemo } from "react";
import { Baby } from "lucide-react";
import {
  useInfertilityMedicalInfo,
  useInfertilityActions,
} from "../../../stores";
import InfertilityTypeDropdown from "../../../../../../components/form-sections/Fields/InfertilityTypeDropdown";

const INFERTILITY_TYPES = ["Primary", "Secondary"];

const MarriageFertility: React.FC = () => {
  const medicalInfo = useInfertilityMedicalInfo();
  const { updateMedicalInfo } = useInfertilityActions();

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
      if (!disabled && !isValid && value !== null && value !== "") {
        // Simple number validation visual
        style = `bg-red-50 border-2 border-red-500 ${baseStyle}`;
      }
      // We can assume valid for now or add complex logic
      if (!disabled && value !== "" && value !== null) {
        style += ` bg-white border-2 border-green-700`;
      } else if (!disabled) {
        style += ` bg-gray-50 border-2 border-gray-300`;
      }
      return style;
    };
  }, []);

  const isNumberValid = (v: number | null) =>
    v === null || (!isNaN(Number(v)) && Number(v) >= 0);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Baby size={20} className="text-purple-500" />
        <span className="text-md font-semibold text-gray-800">
          Marriage & Fertility History
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years Married
          </label>
          <input
            type="number"
            value={medicalInfo.yearsMarried ?? ""}
            onChange={(e) =>
              updateMedicalInfo(
                "yearsMarried",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className={inputClassName(
              medicalInfo.yearsMarried,
              isNumberValid(medicalInfo.yearsMarried)
            )}
            placeholder="Enter years married"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years Trying to Conceive
          </label>
          <input
            type="number"
            value={medicalInfo.yearsTrying ?? ""}
            onChange={(e) =>
              updateMedicalInfo(
                "yearsTrying",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className={inputClassName(
              medicalInfo.yearsTrying,
              isNumberValid(medicalInfo.yearsTrying)
            )}
            placeholder="Enter years trying"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Infertility Type
          </label>
          <InfertilityTypeDropdown
            value={medicalInfo.infertilityType}
            onSelect={(v) => updateMedicalInfo("infertilityType", v)}
            options={INFERTILITY_TYPES}
            inputClassName={inputClassName(medicalInfo.infertilityType)}
          />
        </div>
      </div>
    </div>
  );
};
export default MarriageFertility;
