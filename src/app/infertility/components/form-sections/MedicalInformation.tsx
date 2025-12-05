import React, { useMemo } from "react";
import {
  Stethoscope,
  HeartPulse,
  Baby,
  Ruler,
  Droplets,
  ClipboardList,
  UserCheck,
  Pill,
  FileText,
} from "lucide-react";
import InfertilityTypeDropdown from "./Fields/InfertilityTypeDropdown";
import BloodGroupDropdown from "./Fields/BloodGroupDropdown";
import ReferralSourceDropdown from "./Fields/ReferralSourceDropdown";
import StatusDropdown from "./Fields/StatusDropdown";
import {
  useInfertilityMedicalInfo,
  useInfertilityPatientData,
  useInfertilityActions,
} from "../../stores";

// Default options - can be overridden by passing to the store in the future
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const INFERTILITY_TYPES = ["Primary", "Secondary"];
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

const MedicalInformation: React.FC = () => {
  // Get medical info and patient data from Zustand store
  const medicalInfo = useInfertilityMedicalInfo();
  const patientData = useInfertilityPatientData();
  const { updateMedicalInfo, setPatientData } = useInfertilityActions();

  // Blood group is part of patient data, not medical info
  const handleBloodGroupChange = (value: string) => {
    setPatientData({ ...patientData, bloodGroup: value });
  };

  // Dynamic input styling function
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
      if (!disabled) {
        if (!isValid && value !== "" && value !== null) {
          style = `bg-red-50 border-2 border-red-500 ${baseStyle}`;
        } else {
          style +=
            value !== "" && value !== null
              ? ` bg-white border-2 border-green-700`
              : ` bg-gray-50 border-2 border-gray-300`;
        }
      }
      return style;
    };
  }, []);

  // Simple validation for numbers (years, weight, height, bmi)
  const isNumberValid = (v: number | null) =>
    v === null || (!isNaN(Number(v)) && Number(v) >= 0);

  return (
    <div id="medical" className="mb-4 sm:mb-4 md:mb-2">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border border-purple-200">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 bg-white rounded-lg shadow flex items-center justify-center border border-purple-200">
            <Stethoscope className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-purple-900 leading-tight mb-0.5 sm:mb-1">
              Medical Information
            </h3>
            <p className="text-purple-700/80 text-xs sm:text-sm font-medium leading-tight">
              Fertility and medical history details
            </p>
          </div>
        </div>
      </div>

      {/* Marriage & Fertility History */}
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

      {/* Obstetric History */}
      <div className="mb-6 border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <HeartPulse size={20} className="text-purple-500" />
          <span className="text-md font-semibold text-gray-800">
            Obstetric History
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Physical Measurements */}
      <div className="mb-6 border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Ruler size={20} className="text-purple-500" />
          <span className="text-md font-semibold text-gray-800">
            Physical Measurements
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
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
              placeholder="Enter height"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BMI
            </label>
            <input
              type="number"
              value={medicalInfo.bmi ?? ""}
              readOnly
              className={`${inputClassName(
                medicalInfo.bmi,
                true,
                true
              )} bg-gray-100 cursor-not-allowed`}
              placeholder="Auto-calculated"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Blood Pressure */}
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

      {/* Medical & Surgical History */}
      <div className="mb-6 border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList size={20} className="text-purple-500" />
          <span className="text-md font-semibold text-gray-800">
            Medical & Surgical History
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical History
            </label>
            <textarea
              value={medicalInfo.medicalHistory}
              onChange={(e) =>
                updateMedicalInfo("medicalHistory", e.target.value)
              }
              className={`${inputClassName(
                medicalInfo.medicalHistory
              )} resize-none min-h-[5rem]`}
              placeholder="Enter medical history..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Surgical History
            </label>
            <textarea
              value={medicalInfo.surgicalHistory}
              onChange={(e) =>
                updateMedicalInfo("surgicalHistory", e.target.value)
              }
              className={`${inputClassName(
                medicalInfo.surgicalHistory
              )} resize-none min-h-[5rem]`}
              placeholder="Enter surgical history..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Menstrual History
            </label>
            <textarea
              value={medicalInfo.menstrualHistory}
              onChange={(e) =>
                updateMedicalInfo("menstrualHistory", e.target.value)
              }
              className={`${inputClassName(
                medicalInfo.menstrualHistory
              )} resize-none min-h-[5rem]`}
              placeholder="Enter menstrual history..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraceptive History
            </label>
            <textarea
              value={medicalInfo.contraceptiveHistory}
              onChange={(e) =>
                updateMedicalInfo("contraceptiveHistory", e.target.value)
              }
              className={`${inputClassName(
                medicalInfo.contraceptiveHistory
              )} resize-none min-h-[5rem]`}
              placeholder="Enter contraceptive history..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Current Visit */}
      <div className="mb-6 border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <UserCheck size={20} className="text-purple-500" />
          <span className="text-md font-semibold text-gray-800">
            Current Visit
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chief Complaint
          </label>
          <textarea
            value={medicalInfo.chiefComplaint}
            onChange={(e) =>
              updateMedicalInfo("chiefComplaint", e.target.value)
            }
            placeholder="Primary reason for visit..."
            className={`${inputClassName(
              medicalInfo.chiefComplaint
            )} resize-none min-h-[5rem]`}
            rows={3}
          />
        </div>
      </div>

      {/* Treatment & Medications */}
      <div className="mb-6 border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Pill size={20} className="text-purple-500" />
          <span className="text-md font-semibold text-gray-800">
            Treatment & Medications
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Additional Notes */}
      <div className="mb-2 border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={20} className="text-purple-500" />
          <span className="text-md font-semibold text-gray-800">
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
    </div>
  );
};

MedicalInformation.displayName = "MedicalInformation";
export default React.memo(MedicalInformation);
