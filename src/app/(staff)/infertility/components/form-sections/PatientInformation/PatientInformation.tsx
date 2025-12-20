import React from "react";
import { User, Heart, Phone, Mail, Calendar } from "lucide-react";
import PatientSearch from "./PatientSearch";
import {
  useInfertilityPatientData,
  useInfertilitySpouseData,
  useInfertilityActions,
  useInfertilityValidationStatus,
} from "../../../stores";
import GenderDropdown from "@/components/form-sections/Fields/GenderDropdown";
import DateOfBirthDropdown from "@/components/form-sections/Fields/DobDropdown";
import ContactPhoneInput from "@/components/form-sections/Fields/ContactPhoneInput";
import ContactEmailInput from "@/components/form-sections/Fields/ContactEmailInput";
import { useState, useEffect, useMemo } from "react";

const PatientInformation: React.FC = () => {
  const patientData = useInfertilityPatientData();
  const spouseData = useInfertilitySpouseData();
  const { setPatientData, setSpouseData, setValidationStatus } =
    useInfertilityActions();
  const validationStatus = useInfertilityValidationStatus();

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
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
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

  // Spouse DOB change handler
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
              <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
                Patient Information
              </h3>
            </div>
            <p className="text-indigo-700 text-xs sm:text-sm font-medium leading-tight transition-colors duration-300 mt-1">
              {getDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Form Content */}
      <div className="space-y-4">
        {/* Row 1: Patient Full Name (full width) */}
        <PatientSearch />

        {/* Row 2: Gender + Date of Birth (with age boxes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gender */}
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Patient Gender<span className="text-red-500">*</span>
            </label>
            <GenderDropdown
              value={patientData.gender || "Female"}
              onSelect={(v) => setPatientData({ ...patientData, gender: v })}
              style={{ width: "100%" }}
              autofilled={false}
            />
          </div>

          {/* Date of Birth + Age Boxes */}
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

        {/* Row 3: Phone Number + Email (side by side) */}
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

        {/* Spouse Information Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="text-rose-500 w-5 h-5" />
            Spouse Information
          </h4>

          {/* Row 4: Spouse Name (full width) */}
          <div className="mb-4">
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Spouse Name
            </label>
            <input
              type="text"
              className={inputClassName(spouseData.name)}
              value={spouseData.name}
              onChange={(e) => {
                const newName = e.target.value;
                setSpouseData({ ...spouseData, name: newName });
                // Also update guardianName to keep data in sync
                setPatientData({ ...patientData, guardianName: newName });
              }}
              placeholder="Spouse full name"
            />
          </div>

          {/* Row 5: Spouse Date of Birth + Age Boxes (full width, calendar half + age boxes half) */}
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Spouse Date of Birth
            </label>
            <DateOfBirthDropdown
              value={spouseData.dateOfBirth}
              onChange={handleSpouseDOBChange}
            />
          </div>
        </div>

        {/* Additional Patient Details */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Address */}
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

export default React.memo(PatientInformation);
