import React, { useMemo } from "react";
import { UserCheck } from "lucide-react";
import {
  useInfertilityMedicalInfo,
  useInfertilityActions,
} from "../../../stores";
import ReferralSourceDropdown from "../../../../../../components/form-sections/Fields/ReferralSourceDropdown";
import StatusDropdown from "../../../../../../components/form-sections/Fields/StatusDropdown";

const STATUS_OPTIONS = ["Active", "Follow-up", "Completed", "Discontinued"];
const REFERRAL_SOURCES = [
  "Self-referral",
  "Gynecologist",
  "General Practitioner",
  "Friend/Family",
  "Online",
  "Advertisement",
  "Other Hospital",
  "Other",
];

const CurrentVisit: React.FC = () => {
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
        <UserCheck size={20} className="text-purple-500" />
        <span className="text-base sm:text-lg font-bold text-gray-800">
          Current Visit
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Referral Source
          </label>
          <ReferralSourceDropdown
            value={medicalInfo.referralSource}
            onSelect={(v) => updateMedicalInfo("referralSource", v)}
            options={REFERRAL_SOURCES}
            inputClassName={inputClassName(medicalInfo.referralSource)}
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
            Status
          </label>
          <StatusDropdown
            value={medicalInfo.status}
            onSelect={(v) => updateMedicalInfo("status", v)}
            options={STATUS_OPTIONS}
            inputClassName={inputClassName(medicalInfo.status)}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
          Chief Complaint
        </label>
        <textarea
          value={medicalInfo.chiefComplaint}
          onChange={(e) => updateMedicalInfo("chiefComplaint", e.target.value)}
          placeholder="Primary reason for visit..."
          // Override height
          className={`${inputClassName(medicalInfo.chiefComplaint).replace(
            "h-12 md:h-14",
            ""
          )} resize-none min-h-20`}
          rows={3}
        />
      </div>
    </div>
  );
};
export default CurrentVisit;
