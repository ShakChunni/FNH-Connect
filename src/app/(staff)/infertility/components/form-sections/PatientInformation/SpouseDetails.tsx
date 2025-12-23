import React, { useMemo } from "react";
import { Heart, User } from "lucide-react";
import {
  useInfertilitySpouseData,
  useInfertilityActions,
} from "../../../stores";
import DateOfBirthDropdown from "../../../../../../components/form-sections/Fields/DobDropdown";

import NumberInput from "@/components/form-sections/Fields/NumberInput";

const SpouseDetails: React.FC = () => {
  const spouseData = useInfertilitySpouseData();
  const { setSpouseData } = useInfertilityActions();

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (value: string) =>
      value
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-white border-2 border-gray-300 ${baseStyle}`;
  }, []);

  const handleSpouseDOBChange = (
    date: Date | null,
    age?: { years: number; months: number; days: number }
  ) => {
    setSpouseData({
      ...spouseData,
      dateOfBirth: date,
      age: age ? age.years : null,
    });
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Heart className="text-rose-500 w-5 h-5" />
        Spouse Information
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Spouse Name
          </label>
          <input
            type="text"
            className={inputClassName(spouseData.name)}
            value={spouseData.name}
            onChange={(e) =>
              setSpouseData({ ...spouseData, name: e.target.value })
            }
            placeholder="Spouse full name"
          />
        </div>
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Spouse Date of Birth
          </label>
          <div className="relative">
            <DateOfBirthDropdown
              value={spouseData.dateOfBirth}
              onChange={handleSpouseDOBChange}
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Spouse Age
          </label>
          <NumberInput
            className="bg-gray-100 border-2 border-gray-300 text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full cursor-not-allowed"
            value={spouseData.age ?? ""}
            readOnly
            placeholder="Auto-calculated"
          />
        </div>
      </div>
    </div>
  );
};
export default SpouseDetails;
