import React, { useState, useEffect, useMemo } from "react";
import { User, Phone, Mail, Calendar, UserCheck, Droplets } from "lucide-react";
import AdmissionPatientSearch from "./AdmissionPatientSearch";
import { useAdmissionPatientData, useAdmissionActions } from "../../../stores";
import GenderDropdown from "@/components/form-sections/Fields/GenderDropdown";
import DateOfBirthDropdown from "@/components/form-sections/Fields/DobDropdown";
import ContactPhoneInput from "@/components/form-sections/Fields/ContactPhoneInput";
import ContactEmailInput from "@/components/form-sections/Fields/ContactEmailInput";
import BloodGroupDropdown from "@/components/form-sections/Fields/BloodGroupDropdown";

const AdmissionPatientInformation: React.FC = () => {
  const patientData = useAdmissionPatientData();
  const { setPatientData, setValidationStatus } = useAdmissionActions();

  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);

  // Sync validation to global store
  useEffect(() => {
    setValidationStatus({ phone: isPhoneValid, email: isEmailValid });
  }, [isPhoneValid, isEmailValid, setValidationStatus]);

  const isExisting = !!patientData.id;

  // Input class helper
  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";
    return (value: string) =>
      value
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-white border-2 border-gray-300 ${baseStyle}`;
  }, []);

  // Derived logic for description using store only
  const getDescription = () => {
    if (patientData.id)
      return "Patient details have been auto-filled from the database.";
    if (patientData.fullName && patientData.fullName.length > 0)
      return "Creating new patient record. Please fill in all required details.";
    return "Search for an existing patient or add a new patient to the system.";
  };

  // Patient DOB change handler
  const handlePatientDOBChange = (
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
    <div id="patient" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      {/* Header */}
      <div
        className={`bg-linear-to-r from-indigo-50 to-indigo-100 border-indigo-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md shrink-0">
            <User className={"text-indigo-600"} size={28} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                Patient Information
              </h3>
            </div>
            <p className="text-indigo-700 text-[11px] sm:text-xs font-medium leading-tight transition-colors duration-300 mt-1">
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Form Content */}
      <div className="space-y-4">
        {/* Row 1: Patient Full Name (full width) */}
        <AdmissionPatientSearch />

        {/* Row 2: Gender + Date of Birth (with age boxes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gender */}
          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
                Patient Gender<span className="text-red-500">*</span>
              </label>
              {isExisting && patientData.gender && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                  <User className="w-3 h-3 mr-1 text-blue-500" /> Auto-filled
                </span>
              )}
            </div>
            <GenderDropdown
              value={patientData.gender || ""}
              onSelect={(v) => setPatientData({ ...patientData, gender: v })}
              style={{ width: "100%" }}
              noDefaultSelection={true}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
                Date of Birth
              </label>
              {isExisting && patientData.dateOfBirth && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 shadow-sm">
                  <Calendar className="w-3 h-3 mr-1 text-rose-500" />{" "}
                  Auto-filled
                </span>
              )}
            </div>
            <DateOfBirthDropdown
              value={patientData.dateOfBirth}
              onChange={handlePatientDOBChange}
            />
          </div>
        </div>

        {/* Row 3: Phone Number + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
                Phone Number
              </label>
              {isExisting && patientData.phoneNumber && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
                  <Phone className="w-3 h-3 mr-1 text-indigo-500" /> Auto-filled
                </span>
              )}
            </div>
            <ContactPhoneInput
              value={patientData.phoneNumber}
              onChange={(val) =>
                setPatientData({ ...patientData, phoneNumber: val })
              }
              onValidationChange={setIsPhoneValid}
              defaultCountry="BD"
              isAutofilled={isExisting}
            />
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
                Email
              </label>
              {isExisting && patientData.email && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
                  <Mail className="w-3 h-3 mr-1 text-indigo-500" /> Auto-filled
                </span>
              )}
            </div>
            <ContactEmailInput
              value={patientData.email}
              onChange={(val) => setPatientData({ ...patientData, email: val })}
              onValidationChange={setIsEmailValid}
              placeholder="Patient email"
              isAutofilled={isExisting}
            />
          </div>
        </div>

        {/* Guardian Information Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <UserCheck className="text-indigo-500 w-4 h-4" />
            Guardian Information
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guardian Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
                  Guardian Name
                </label>
                {isExisting && patientData.guardianName && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
                    <UserCheck className="w-3 h-3 mr-1 text-indigo-500" />{" "}
                    Auto-filled
                  </span>
                )}
              </div>
              <input
                type="text"
                className={inputClassName(patientData.guardianName || "")}
                value={patientData.guardianName || ""}
                onChange={(e) => {
                  setPatientData({
                    ...patientData,
                    guardianName: e.target.value,
                  });
                }}
                placeholder="Guardian full name"
              />
            </div>

            {/* Guardian Phone */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
                  Guardian Phone
                </label>
                {isExisting && patientData.guardianPhone && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 shadow-sm">
                    <Phone className="w-3 h-3 mr-1 text-indigo-500" />{" "}
                    Auto-filled
                  </span>
                )}
              </div>
              <ContactPhoneInput
                value={patientData.guardianPhone}
                onChange={(val) =>
                  setPatientData({ ...patientData, guardianPhone: val })
                }
                onValidationChange={() => {}} // Could add separate validation if needed
                defaultCountry="BD"
                isAutofilled={isExisting}
              />
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blood Group */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
                  Blood Group
                </label>
                {isExisting && patientData.bloodGroup && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-200 shadow-sm">
                    <Droplets className="w-3 h-3 mr-1 text-red-500" />{" "}
                    Auto-filled
                  </span>
                )}
              </div>
              <BloodGroupDropdown
                value={patientData.bloodGroup || ""}
                onSelect={(val) =>
                  setPatientData({ ...patientData, bloodGroup: val })
                }
                options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                inputClassName={inputClassName(patientData.bloodGroup)}
              />
            </div>

            {/* Empty space for alignment if needed, or just let it occupy half */}
            <div className="hidden md:block"></div>

            {/* Address - Full width at the end like pathology */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                Address
              </label>
              <textarea
                className={`${inputClassName(patientData.address)} resize-none`}
                value={patientData.address}
                onChange={(e) =>
                  setPatientData({ ...patientData, address: e.target.value })
                }
                placeholder="Patient address"
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdmissionPatientInformation);
