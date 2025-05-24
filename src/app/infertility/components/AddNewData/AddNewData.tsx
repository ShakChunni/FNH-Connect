"use client";
import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  FaTimes,
  FaUser,
  FaUserFriends,
  FaStethoscope,
  FaRegStickyNote,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import DateOfBirthDropdown from "./Dropdowns/DateOfBirthDropdown";
import { useAuth } from "@/app/AuthContext";

interface InfertilityPatientData {
  hospitalName: string;
  patientFirstName: string;
  patientLastName: string;
  patientAge: number | null;
  patientDOB: Date | null;
  husbandName: string;
  husbandAge: number | null;
  husbandDOB: Date | null;
  mobileNumber: string;
  address: string;
  yearsMarried: number | null;
  yearsTrying: number | null;
  para: string;
  alc: string;
  weight: number | null;
  bp: string;
  infertilityType: string;
  notes: string;
}

interface AddNewDataProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InfertilityPatientData) => void;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
  customOptions?: {
    infertilityTypes: string[];
    hospitals: string[];
    totalCount: number;
  };
}

const AddNewData = React.memo<AddNewDataProps>(
  ({
    isOpen,
    onClose,
    onSubmit,
    onMessage,
    messagePopupRef,
    customOptions,
  }) => {
    const { user } = useAuth();

    const [hospitalName, setHospitalName] = useState("");
    const [patientFirstName, setPatientFirstName] = useState("");
    const [patientLastName, setPatientLastName] = useState("");
    const [patientAge, setPatientAge] = useState<number | null>(null);
    const [patientDOB, setPatientDOB] = useState<Date | null>(null);
    const [husbandName, setHusbandName] = useState("");
    const [husbandAge, setHusbandAge] = useState<number | null>(null);
    const [husbandDOB, setHusbandDOB] = useState<Date | null>(null);
    const [mobileNumber, setMobileNumber] = useState("");
    const [address, setAddress] = useState("");
    const [yearsMarried, setYearsMarried] = useState<number | null>(null);
    const [yearsTrying, setYearsTrying] = useState<number | null>(null);
    const [para, setPara] = useState("");
    const [alc, setAlc] = useState("");
    const [weight, setWeight] = useState<number | null>(null);
    const [bp, setBp] = useState("");
    const [infertilityType, setInfertilityType] = useState("");
    const [notes, setNotes] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [lastClickTimestamp, setLastClickTimestamp] = useState(0);
    const popupRef = useRef<HTMLDivElement>(null);

    const inputClassName = useMemo(() => {
      const baseStyle =
        "text-[#2A3136] font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-shadow duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm";

      return (value: string | number | null) => {
        if (value !== null && value !== undefined && value !== "") {
          return `bg-white border-2 border-green-600 ${baseStyle}`;
        }
        return `bg-gray-50 border border-gray-300 ${baseStyle}`;
      };
    }, []);

    const calculateAge = useCallback((dob: Date): number => {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    }, []);

    const handlePatientDOBChange = useCallback(
      (date: Date | null) => {
        setPatientDOB(date);
        if (date) {
          const calculatedAge = calculateAge(date);
          setPatientAge(calculatedAge);
        } else {
          setPatientAge(null);
        }
      },
      [calculateAge]
    );

    const handleHusbandDOBChange = useCallback(
      (date: Date | null) => {
        setHusbandDOB(date);
        if (date) {
          const calculatedAge = calculateAge(date);
          setHusbandAge(calculatedAge);
        } else {
          setHusbandAge(null);
        }
      },
      [calculateAge]
    );

    const handlePatientAgeChange = useCallback((value: string) => {
      const age = value ? parseInt(value, 10) : null;
      setPatientAge(age);
      if (age && age > 0) {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - age;
        const estimatedDOB = new Date(birthYear, 0, 1);
        setPatientDOB(estimatedDOB);
      }
    }, []);

    const handleHusbandAgeChange = useCallback((value: string) => {
      const age = value ? parseInt(value, 10) : null;
      setHusbandAge(age);
      if (age && age > 0) {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - age;
        const estimatedDOB = new Date(birthYear, 0, 1);
        setHusbandDOB(estimatedDOB);
      }
    }, []);

    const validateForm = useCallback((): boolean => {
      const requiredFields = [
        { value: patientFirstName.trim(), name: "Patient First Name" },
        { value: mobileNumber.trim(), name: "Mobile Number" },
      ];

      const missingFields = requiredFields
        .filter((field) => !field.value)
        .map((field) => field.name);

      if (missingFields.length > 0) {
        onMessage(
          "error",
          `Please fill in required fields: ${missingFields.join(", ")}`
        );
        return false;
      }

      if (patientDOB && patientDOB > new Date()) {
        onMessage("error", "Patient date of birth cannot be in the future");
        return false;
      }

      if (husbandDOB && husbandDOB > new Date()) {
        onMessage("error", "Husband date of birth cannot be in the future");
        return false;
      }

      if (weight && weight <= 0) {
        onMessage("error", "Weight must be a positive number");
        return false;
      }

      if (yearsMarried && yearsMarried < 0) {
        onMessage("error", "Years married cannot be negative");
        return false;
      }

      if (yearsTrying && yearsTrying < 0) {
        onMessage("error", "Years trying cannot be negative");
        return false;
      }

      if (yearsMarried && yearsTrying && yearsTrying > yearsMarried) {
        onMessage("error", "Years trying cannot be more than years married");
        return false;
      }

      const mobileRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (mobileNumber && !mobileRegex.test(mobileNumber)) {
        onMessage("error", "Please enter a valid mobile number");
        return false;
      }

      return true;
    }, [
      patientFirstName,
      mobileNumber,
      patientDOB,
      husbandDOB,
      weight,
      yearsMarried,
      yearsTrying,
      onMessage,
    ]);

    const handleSubmit = useCallback(async () => {
      if (!validateForm()) return;

      setIsLoading(true);
      try {
        const formData: InfertilityPatientData = {
          hospitalName: hospitalName.trim(),
          patientFirstName: patientFirstName.trim(),
          patientLastName: patientLastName.trim(),
          patientAge,
          patientDOB,
          husbandName: husbandName.trim(),
          husbandAge,
          husbandDOB,
          mobileNumber: mobileNumber.trim(),
          address: address.trim(),
          yearsMarried,
          yearsTrying,
          para: para.trim(),
          alc: alc.trim(),
          weight,
          bp: bp.trim(),
          infertilityType: infertilityType.trim(),
          notes: notes.trim(),
        };

        const response = await fetch("/api/infertility/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to add patient data");
        }

        onSubmit(formData);
        onMessage("success", "Patient data added successfully!");

        // Reset form
        setHospitalName("");
        setPatientFirstName("");
        setPatientLastName("");
        setPatientAge(null);
        setPatientDOB(null);
        setHusbandName("");
        setHusbandAge(null);
        setHusbandDOB(null);
        setMobileNumber("");
        setAddress("");
        setYearsMarried(null);
        setYearsTrying(null);
        setPara("");
        setAlc("");
        setWeight(null);
        setBp("");
        setInfertilityType("");
        setNotes("");

        onClose();
      } catch (error) {
        console.error("Error submitting data:", error);
        onMessage("error", "Error submitting data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, [
      validateForm,
      hospitalName,
      patientFirstName,
      patientLastName,
      patientAge,
      patientDOB,
      husbandName,
      husbandAge,
      husbandDOB,
      mobileNumber,
      address,
      yearsMarried,
      yearsTrying,
      para,
      alc,
      weight,
      bp,
      infertilityType,
      notes,
      onSubmit,
      onMessage,
      onClose,
    ]);

    const handleClickOutside = useCallback(
      (event: MouseEvent) => {
        const currentTimestamp = Date.now();
        if (currentTimestamp - lastClickTimestamp < 50) return;

        if (
          popupRef.current &&
          !popupRef.current.contains(event.target as Node) &&
          !isDropdownOpen &&
          !(
            messagePopupRef.current &&
            messagePopupRef.current.contains(event.target as Node)
          )
        ) {
          onClose();
        }
      },
      [isDropdownOpen, lastClickTimestamp, onClose, messagePopupRef]
    );

    const handleDropdownToggle = useCallback((isOpen: boolean) => {
      setIsDropdownOpen(isOpen);
      setLastClickTimestamp(Date.now());
    }, []);

    useEffect(() => {
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen, handleClickOutside]);

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.3, ease: "easeInOut" },
            }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              ref={popupRef}
              className="bg-white rounded-lg shadow-lg p-6 w-[90%] md:w-[70%] lg:w-[50%] h-[90%] popup-content overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{
                scale: 0.8,
                opacity: 0,
                transition: { duration: 0.3, ease: "easeInOut" },
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold">
                  Add New Patient
                </h2>
                <button
                  onClick={onClose}
                  className="bg-white text-red-500 font-bold py-1 px-2 rounded-lg flex items-center justify-center transition duration-300 ease-in-out hover:cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, color: "#b91c1c" }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaTimes className="text-xl md:text-2xl" />
                  </motion.div>
                </button>
              </div>

              {/* Hospital Information Section */}
              <div className="mb-8">
                <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                  <span>Hospital Information</span>
                  <FaStethoscope className="text-blue-800" />
                </h3>

                <div className="mb-4">
                  <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    className={inputClassName(hospitalName)}
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="Enter referring hospital name (if applicable)"
                  />
                </div>
              </div>

              {/* Patient Information Section */}
              <div className="mb-8">
                <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                  <span>Patient Information</span>
                  <FaUser className="text-green-800" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      First Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputClassName(patientFirstName)}
                      value={patientFirstName}
                      onChange={(e) => setPatientFirstName(e.target.value)}
                      placeholder="Enter patient's first name"
                    />
                  </div>
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className={inputClassName(patientLastName)}
                      value={patientLastName}
                      onChange={(e) => setPatientLastName(e.target.value)}
                      placeholder="Enter patient's last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      className={inputClassName(patientAge)}
                      value={patientAge || ""}
                      onChange={(e) => handlePatientAgeChange(e.target.value)}
                      placeholder="Enter age"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Date of Birth
                    </label>
                    <DateOfBirthDropdown
                      onSelect={handlePatientDOBChange}
                      defaultValue={patientDOB}
                      onDropdownToggle={handleDropdownToggle}
                      placeholder="Select patient's date of birth"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                    Mobile Number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={inputClassName(mobileNumber)}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                    Address
                  </label>
                  <textarea
                    className={inputClassName(address)}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
              </div>

              {/* Husband Information Section */}
              <div className="mb-8">
                <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                  <span>Husband Information</span>
                  <FaUserFriends className="text-purple-800" />
                </h3>

                <div className="mb-4">
                  <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                    Husband's Name
                  </label>
                  <input
                    type="text"
                    className={inputClassName(husbandName)}
                    value={husbandName}
                    onChange={(e) => setHusbandName(e.target.value)}
                    placeholder="Enter husband's full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      className={inputClassName(husbandAge)}
                      value={husbandAge || ""}
                      onChange={(e) => handleHusbandAgeChange(e.target.value)}
                      placeholder="Enter age"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Date of Birth
                    </label>
                    <DateOfBirthDropdown
                      onSelect={handleHusbandDOBChange}
                      defaultValue={husbandDOB}
                      onDropdownToggle={handleDropdownToggle}
                      placeholder="Select husband's date of birth"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Years Married
                    </label>
                    <input
                      type="number"
                      className={inputClassName(yearsMarried)}
                      value={yearsMarried || ""}
                      onChange={(e) =>
                        setYearsMarried(
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                      placeholder="Years married"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Years Trying to Conceive
                    </label>
                    <input
                      type="number"
                      className={inputClassName(yearsTrying)}
                      value={yearsTrying || ""}
                      onChange={(e) =>
                        setYearsTrying(
                          e.target.value ? parseInt(e.target.value, 10) : null
                        )
                      }
                      placeholder="Years trying"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="mb-8">
                <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                  <span>Medical Information</span>
                  <FaStethoscope className="text-amber-700" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Para{" "}
                      <span className="text-xs text-gray-500">
                        (e.g., 0+1ab, 2c/s)
                      </span>
                    </label>
                    <input
                      type="text"
                      className={inputClassName(para)}
                      value={para}
                      onChange={(e) => setPara(e.target.value)}
                      placeholder="Enter obstetric history"
                    />
                  </div>
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      ALC
                    </label>
                    <input
                      type="text"
                      className={inputClassName(alc)}
                      value={alc}
                      onChange={(e) => setAlc(e.target.value)}
                      placeholder="Enter ALC value"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      className={inputClassName(weight)}
                      value={weight || ""}
                      onChange={(e) =>
                        setWeight(
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="Enter weight in kg"
                      min="1"
                      max="300"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      className={inputClassName(bp)}
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      placeholder="e.g., 120/80"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                    Infertility Type
                  </label>
                  <select
                    className={inputClassName(infertilityType)}
                    value={infertilityType}
                    onChange={(e) => setInfertilityType(e.target.value)}
                  >
                    <option value="">Select infertility type</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                  </select>
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className="mb-8">
                <h3 className="text-blue-900 font-bold text-xl mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                  <span>Additional Notes</span>
                  <FaRegStickyNote className="text-yellow-600" />
                </h3>

                <div className="mb-4">
                  <label className="block text-[#001F3F] text-sm md:text-base font-bold mb-2">
                    Notes
                  </label>
                  <textarea
                    className={inputClassName(notes)}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional notes or observations"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className={`bg-blue-950 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="animate-pulse">Adding...</span>
                    </span>
                  ) : (
                    "Add Patient"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

AddNewData.displayName = "AddNewData";

export default AddNewData;
