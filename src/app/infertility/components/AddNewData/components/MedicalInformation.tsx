import React from "react";
import {
  Stethoscope,
  HeartPulse,
  Baby,
  Ruler,
  Droplets,
  Syringe,
  ClipboardList,
  UserCheck,
  Pill,
  FileText,
} from "lucide-react";
import InfertilityTypeDropdown from "../Dropdowns/InfertilityTypeDropdown";
import BloodGroupDropdown from "../Dropdowns/BloodGroupDropdown";
import ReferralSourceDropdown from "../Dropdowns/ReferralSourceDropdown";
import StatusDropdown from "../Dropdowns/StatusDropdown";

interface MedicalInfo {
  yearsMarried: number | null;
  yearsTrying: number | null;
  infertilityType: string;
  para: string;
  gravida: string;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodPressure: string;
  bloodGroup: string;
  medicalHistory: string;
  surgicalHistory: string;
  menstrualHistory: string;
  contraceptiveHistory: string;
  referralSource: string;
  chiefComplaint: string;
  treatmentPlan: string;
  medications: string;
  nextAppointment: Date | null;
  status: string;
  notes: string;
}

interface MedicalInformationProps {
  medicalInfo: MedicalInfo;
  updateMedicalInfo: (field: keyof MedicalInfo, value: any) => void;
  inputClassName: string;
  isMobile: boolean;
  isMd: boolean;
  bloodGroups: string[];
  infertilityTypes: string[];
  statusOptions: string[];
  referralSources: string[];
}

const sectionIconClass =
  "text-purple-500 bg-white rounded-md shadow p-1 mr-2 inline-block align-middle";
const sectionTitleClass =
  "flex items-center gap-2 text-md font-semibold text-gray-800 mb-4";

const MedicalInformation: React.FC<MedicalInformationProps> = ({
  medicalInfo,
  updateMedicalInfo,
  inputClassName,
  isMobile,
  isMd,
  bloodGroups,
  infertilityTypes,
  statusOptions,
  referralSources,
}) => (
  <div id="medical" className="mb-6 sm:mb-8 md:mb-10">
    {/* Main Header */}
    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border border-purple-200">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
          <Stethoscope
            className="text-purple-600"
            size={isMobile ? 20 : isMd ? 24 : 28}
          />
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

    <div className="space-y-8">
      {/* Marriage & Fertility History */}
      <div>
        <div className={sectionTitleClass}>
          <Baby size={18} className={sectionIconClass} />
          Marriage & Fertility History
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years Married
            </label>
            <input
              type="number"
              value={medicalInfo.yearsMarried || ""}
              onChange={(e) =>
                updateMedicalInfo(
                  "yearsMarried",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className={inputClassName}
              placeholder="Enter years married"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years Trying to Conceive
            </label>
            <input
              type="number"
              value={medicalInfo.yearsTrying || ""}
              onChange={(e) =>
                updateMedicalInfo(
                  "yearsTrying",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className={inputClassName}
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
              options={infertilityTypes}
              inputClassName={inputClassName}
            />
          </div>
        </div>
      </div>

      {/* Obstetric History */}
      <div>
        <div className={sectionTitleClass}>
          <HeartPulse size={18} className={sectionIconClass} />
          Obstetric History
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
              className={inputClassName}
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
              className={inputClassName}
              placeholder="Enter gravida"
            />
          </div>
        </div>
      </div>

      {/* Physical Measurements */}
      <div>
        <div className={sectionTitleClass}>
          <Ruler size={18} className={sectionIconClass} />
          Physical Measurements
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              value={medicalInfo.weight || ""}
              onChange={(e) =>
                updateMedicalInfo(
                  "weight",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className={inputClassName}
              placeholder="Enter weight"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              value={medicalInfo.height || ""}
              onChange={(e) =>
                updateMedicalInfo(
                  "height",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              className={inputClassName}
              placeholder="Enter height"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BMI
            </label>
            <input
              type="number"
              value={medicalInfo.bmi || ""}
              readOnly
              className={`${inputClassName} bg-gray-100 cursor-not-allowed`}
              placeholder="Auto-calculated"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blood Group
            </label>
            <BloodGroupDropdown
              value={medicalInfo.bloodGroup}
              onSelect={(v) => updateMedicalInfo("bloodGroup", v)}
              options={bloodGroups}
              inputClassName={inputClassName}
            />
          </div>
        </div>
      </div>

      {/* Blood Pressure */}
      <div>
        <div className={sectionTitleClass}>
          <Droplets size={18} className={sectionIconClass} />
          Blood Pressure
        </div>
        <input
          type="text"
          value={medicalInfo.bloodPressure}
          onChange={(e) => updateMedicalInfo("bloodPressure", e.target.value)}
          placeholder="e.g., 120/80"
          className={inputClassName}
        />
      </div>

      {/* Medical History */}
      <div>
        <div className={sectionTitleClass}>
          <ClipboardList size={18} className={sectionIconClass} />
          Medical & Surgical History
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
              className={`${inputClassName} h-24 resize-none`}
              placeholder="Enter medical history..."
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
              className={`${inputClassName} h-24 resize-none`}
              placeholder="Enter surgical history..."
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
              className={`${inputClassName} h-24 resize-none`}
              placeholder="Enter menstrual history..."
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
              className={`${inputClassName} h-24 resize-none`}
              placeholder="Enter contraceptive history..."
            />
          </div>
        </div>
      </div>

      {/* Visit Information */}
      <div>
        <div className={sectionTitleClass}>
          <UserCheck size={18} className={sectionIconClass} />
          Current Visit
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referral Source
            </label>
            <ReferralSourceDropdown
              value={medicalInfo.referralSource}
              onSelect={(v) => updateMedicalInfo("referralSource", v)}
              options={referralSources}
              inputClassName={inputClassName}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <StatusDropdown
              value={medicalInfo.status}
              onSelect={(v) => updateMedicalInfo("status", v)}
              options={statusOptions}
              inputClassName={inputClassName}
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
            className={`${inputClassName} h-24 resize-none`}
          />
        </div>
      </div>

      {/* Treatment Information */}
      <div>
        <div className={sectionTitleClass}>
          <Pill size={18} className={sectionIconClass} />
          Treatment & Medications
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
              className={`${inputClassName} h-24 resize-none`}
              placeholder="Enter treatment plan..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medications
            </label>
            <textarea
              value={medicalInfo.medications}
              onChange={(e) => updateMedicalInfo("medications", e.target.value)}
              className={`${inputClassName} h-24 resize-none`}
              placeholder="Enter current medications..."
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <div className={sectionTitleClass}>
          <FileText size={18} className={sectionIconClass} />
          Additional Notes
        </div>
        <textarea
          value={medicalInfo.notes}
          onChange={(e) => updateMedicalInfo("notes", e.target.value)}
          placeholder="Any additional notes..."
          className={`${inputClassName} h-32 resize-none`}
        />
      </div>
    </div>
  </div>
);

export default MedicalInformation;
