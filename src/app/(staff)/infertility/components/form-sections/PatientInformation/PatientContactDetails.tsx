import React, { useMemo, useState, useEffect } from "react";
import { Phone, Mail, User } from "lucide-react";
import {
  useInfertilityPatientData,
  useInfertilityActions,
  useInfertilityValidationStatus,
} from "../../../stores";
import ContactPhoneInput from "../ContactPhoneInput";
import ContactEmailInput from "../ContactEmailInput";

const PatientContactDetails: React.FC = () => {
  const patientData = useInfertilityPatientData();
  const { setPatientData, setValidationStatus } = useInfertilityActions();
  const validationStatus = useInfertilityValidationStatus(); // To init if needed, but we write to it mostly.

  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [isEmailValid, setIsEmailValid] = useState(true);

  // Sync validation to global store
  useEffect(() => {
    setValidationStatus({ phone: isPhoneValid, email: isEmailValid });
  }, [isPhoneValid, isEmailValid, setValidationStatus]);

  const isExisting = !!patientData.id;

  const inputClassName = useMemo(() => {
    // Reusing standard class
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (
      value: string,
      isValid: boolean = true,
      disabled: boolean = false
    ) => {
      let style = disabled
        ? `bg-gray-200 border-2 border-gray-300 cursor-not-allowed ${baseStyle}`
        : baseStyle;
      if (!disabled) {
        if (!isValid && value) {
          style = `bg-red-50 border-2 border-red-500 ${baseStyle}`;
        } else {
          style += value
            ? ` bg-white border-2 border-green-700`
            : ` bg-gray-50 border-2 border-gray-300`;
        }
      }
      return style;
    };
  }, []);

  return (
    <>
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
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

      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <label className="block text-gray-700 text-sm sm:text-base font-semibold">
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

      {/* Guardian Name - often for minors or specific contexts, but part of patient info */}
      <div className="mb-3 sm:mb-4">
        <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
          Guardian Name
        </label>
        <input
          type="text"
          className={inputClassName(patientData.guardianName || "")}
          value={patientData.guardianName || ""}
          onChange={(e) =>
            setPatientData({ ...patientData, guardianName: e.target.value })
          }
          placeholder="Guardian name"
        />
      </div>
    </>
  );
};

export default PatientContactDetails;
