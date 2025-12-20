import React, { useMemo } from "react";
import { User } from "lucide-react";
import { useAdmissionPatientData, useAdmissionActions } from "../../../stores";

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const AdmissionPatientDetails: React.FC = () => {
  const patientData = useAdmissionPatientData();
  const { setPatientData, setValidationStatus } = useAdmissionActions();

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-indigo-900 focus:ring-2 focus:ring-indigo-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (value: string | number | null, isValid: boolean = true) => {
      const hasValue = value !== null && value !== "" && value !== 0;
      if (!isValid && hasValue) {
        return `bg-red-50 border-2 border-red-500 ${baseStyle}`;
      }
      return hasValue
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
    };
  }, []);

  const handlePatientDataChange = (
    field: keyof typeof patientData,
    value: string | number | Date | null
  ) => {
    const updates: Partial<typeof patientData> = { [field]: value };

    // Auto-generate fullName when firstName or lastName changes
    if (field === "firstName" || field === "lastName") {
      const firstName =
        field === "firstName" ? (value as string) : patientData.firstName;
      const lastName =
        field === "lastName" ? (value as string) : patientData.lastName;
      updates.fullName = `${firstName} ${lastName}`.trim();
    }

    // Calculate age when DOB changes
    if (field === "dateOfBirth" && value) {
      const dob = new Date(value as string);
      const age = Math.floor(
        (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      updates.age = age;
    }

    setPatientData(updates);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientData({ phoneNumber: value });
    // Simple phone validation
    const isValid = !value || /^[0-9+\-() ]{7,15}$/.test(value);
    setValidationStatus({ phone: isValid });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientData({ email: value });
    // Simple email validation
    const isValid = !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setValidationStatus({ email: isValid });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-6 md:p-8 border border-indigo-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
          <User className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
            Patient Information
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Enter patient details
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              First Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={inputClassName(patientData.firstName)}
              value={patientData.firstName}
              onChange={(e) =>
                handlePatientDataChange("firstName", e.target.value)
              }
              placeholder="Enter first name"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Last Name
            </label>
            <input
              type="text"
              className={inputClassName(patientData.lastName)}
              value={patientData.lastName}
              onChange={(e) =>
                handlePatientDataChange("lastName", e.target.value)
              }
              placeholder="Enter last name"
            />
          </div>
        </div>

        {/* Gender, DOB, Age */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Gender<span className="text-red-500">*</span>
            </label>
            <select
              className={inputClassName(patientData.gender)}
              value={patientData.gender}
              onChange={(e) =>
                handlePatientDataChange("gender", e.target.value)
              }
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              className={inputClassName(
                patientData.dateOfBirth?.toString() || ""
              )}
              value={
                patientData.dateOfBirth
                  ? new Date(patientData.dateOfBirth)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(e) =>
                handlePatientDataChange(
                  "dateOfBirth",
                  e.target.value ? new Date(e.target.value) : null
                )
              }
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Age
            </label>
            <input
              type="number"
              className={`${inputClassName(
                patientData.age
              )} bg-gray-100 cursor-not-allowed`}
              value={patientData.age ?? ""}
              readOnly
              placeholder="Auto-calculated"
            />
          </div>
        </div>

        {/* Phone, Email, Blood Group */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              className={inputClassName(patientData.phoneNumber)}
              value={patientData.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="Enter phone"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Email
            </label>
            <input
              type="email"
              className={inputClassName(patientData.email)}
              value={patientData.email}
              onChange={handleEmailChange}
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Blood Group
            </label>
            <select
              className={inputClassName(patientData.bloodGroup)}
              value={patientData.bloodGroup}
              onChange={(e) =>
                handlePatientDataChange("bloodGroup", e.target.value)
              }
            >
              <option value="">Select</option>
              {BLOOD_GROUP_OPTIONS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Address
          </label>
          <textarea
            className={`${inputClassName(patientData.address)} resize-none`}
            value={patientData.address}
            onChange={(e) => handlePatientDataChange("address", e.target.value)}
            placeholder="Enter patient address"
            rows={2}
          />
        </div>

        {/* Guardian Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Guardian Name
            </label>
            <input
              type="text"
              className={inputClassName(patientData.guardianName)}
              value={patientData.guardianName}
              onChange={(e) =>
                handlePatientDataChange("guardianName", e.target.value)
              }
              placeholder="Enter guardian name"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Guardian Phone
            </label>
            <input
              type="tel"
              className={inputClassName(patientData.guardianPhone)}
              value={patientData.guardianPhone}
              onChange={(e) =>
                handlePatientDataChange("guardianPhone", e.target.value)
              }
              placeholder="Enter guardian phone"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionPatientDetails;
