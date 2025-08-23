"use client";
import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import { X, Save, Loader2, Building2, User, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import { useMediaQuery } from "react-responsive";
import HospitalInformation, {
  HospitalData,
} from "./components/HospitalInformation";
import PatientInformation, {
  PatientData,
} from "./components/PatientInformation";

interface AddNewDataProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    user: { username: string; role: string } | null;
    hospital: HospitalData;
    patient: PatientData;
    medicalInfo: {
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
    };
  }) => void;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement>;
}

const AddNewDataInfertility: React.FC<AddNewDataProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onMessage,
  messagePopupRef,
}) => {
  const { user } = useAuth();

  // Main data states
  const [hospitalData, setHospitalData] = useState<HospitalData>({
    id: null,
    name: "",
    address: "",
    phoneNumber: "",
    email: "",
    website: "",
    type: "",
  });

  const [patientData, setPatientData] = useState<PatientData>({
    id: null,
    patientFirstName: "",
    patientLastName: "",
    patientFullName: "",
    patientGender: "Female",
    patientAge: null,
    patientDOB: null,
    mobileNumber: "",
    email: "",
    address: "",
    spouseName: "",
    spouseAge: null,
    spouseDOB: null,
    spouseGender: "Male",
  });

  // Medical information state
  const [medicalInfo, setMedicalInfo] = useState({
    yearsMarried: null as number | null,
    yearsTrying: null as number | null,
    infertilityType: "",
    para: "",
    gravida: "",
    weight: null as number | null,
    height: null as number | null,
    bmi: null as number | null,
    bloodPressure: "",
    bloodGroup: "",
    medicalHistory: "",
    surgicalHistory: "",
    menstrualHistory: "",
    contraceptiveHistory: "",
    referralSource: "",
    chiefComplaint: "",
    treatmentPlan: "",
    medications: "",
    nextAppointment: null as Date | null,
    status: "Active",
    notes: "",
  });

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("hospital");
  const [validationStatus, setValidationStatus] = useState({
    phone: true,
    email: true,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);

  // Responsive design
  const isMobile = useMediaQuery({ maxWidth: 639 });
  const isMd = useMediaQuery({ minWidth: 640, maxWidth: 1023 });
  const isLg = useMediaQuery({ minWidth: 1024, maxWidth: 1279 });
  const isXl = useMediaQuery({ minWidth: 1280, maxWidth: 1536 });
  const is2xl = useMediaQuery({ minWidth: 1536 });

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      hospitalData.name.trim() !== "" &&
      patientData.patientFirstName.trim() !== "" &&
      validationStatus.phone &&
      validationStatus.email
    );
  }, [hospitalData.name, patientData.patientFirstName, validationStatus]);

  // BMI calculation
  useEffect(() => {
    if (medicalInfo.weight && medicalInfo.height) {
      const heightInMeters = medicalInfo.height / 100;
      const bmi = medicalInfo.weight / (heightInMeters * heightInMeters);
      setMedicalInfo((prev) => ({
        ...prev,
        bmi: Math.round(bmi * 10) / 10,
      }));
    } else {
      setMedicalInfo((prev) => ({ ...prev, bmi: null }));
    }
  }, [medicalInfo.weight, medicalInfo.height]);

  // Close modal function
  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid) {
      onMessage("error", "Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      onSubmit({
        user,
        hospital: hospitalData,
        patient: patientData,
        medicalInfo,
      });
    } catch (error) {
      onMessage("error", "Failed to save patient data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update medical info field
  const updateMedicalInfo = (field: string, value: any) => {
    setMedicalInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleClose]);

  // Tab sections configuration
  const sections = [
    {
      id: "hospital",
      label: "Hospital Information",
      icon: Building2,
      color: "blue",
    },
    {
      id: "patient",
      label: "Patient Information",
      icon: User,
      color: "blue",
    },
    {
      id: "medical",
      label: "Medical Information",
      icon: Stethoscope,
      color: "blue",
    },
  ];

  // Tab styling functions
  const getTabColors = (color: string, isActive: boolean) => {
    const baseColors = {
      blue: {
        active: "bg-blue-600 text-white border-blue-600",
        inactive:
          "bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600",
        icon: isActive ? "text-white" : "text-gray-500",
      },
    };
    return baseColors[color as keyof typeof baseColors] || baseColors.blue;
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Input styling
  const inputClassName =
    "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm bg-gray-50 border border-gray-300";

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const infertilityTypes = ["Primary", "Secondary"];
  const statusOptions = ["Active", "Follow-up", "Completed", "Discontinued"];
  const referralSources = [
    "Self-referral",
    "Gynecologist",
    "General Practitioner",
    "Friend/Family",
    "Online",
    "Advertisement",
    "Other Hospital",
    "Other",
  ];

  if (!isOpen) return null;

  const modalVariants = {
    hidden: {
      scale: 0.95,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const, // Use string, not array
        scale: { duration: 0.3 },
        opacity: { duration: 0.3 },
      },
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const, // Use string, not array
        scale: { duration: 0.3 },
        opacity: { duration: 0.25 },
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0, transition: { duration: 0.3 } },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50"
        onClick={onClose}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.div
          ref={popupRef}
          className="bg-white rounded-3xl shadow-xl w-full max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%] h-[95%] sm:h-[90%] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-3xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Stethoscope className="w-6 h-6 text-blue-100" />
                <h2 className="font-bold text-white text-xl">
                  Add New Infertility Patient
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 hover:bg-blue-600 rounded-full transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-2">
              Complete patient and medical information for infertility
              management
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gray-50 px-6">
            <div className="flex space-x-2">
              {sections.map((section) => {
                const isActive = activeSection === section.id;
                const colors = getTabColors(section.color, isActive);
                const IconComponent = section.icon;

                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                      colors.active || colors.inactive
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${colors.icon}`} />
                    <span className="hidden sm:block">{section.label}</span>
                    <span className="sm:hidden">
                      {section.label.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* Hospital Information */}
              <div id="hospital">
                <HospitalInformation
                  onDataChange={setHospitalData}
                  onDropdownToggle={setIsDropdownOpen}
                  onMessage={onMessage}
                  isMobile={isMobile}
                  titleTooltipStyle={{}}
                />
              </div>

              {/* Patient Information */}
              <div id="patient">
                <PatientInformation
                  onDataChange={setPatientData}
                  availablePatients={[]}
                  onDropdownToggle={setIsDropdownOpen}
                  isMobile={isMobile}
                  onValidationChange={setValidationStatus}
                  hospitalName={hospitalData.name}
                />
              </div>

              {/* Medical Information */}
              <div
                id="medical"
                className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6"
              >
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Medical Information
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Fertility and medical history details
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Marriage & Fertility History */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-4">
                      Marriage & Fertility History
                    </h4>
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
                        <select
                          value={medicalInfo.infertilityType}
                          onChange={(e) =>
                            updateMedicalInfo("infertilityType", e.target.value)
                          }
                          className={inputClassName}
                        >
                          <option value="">Select type</option>
                          {infertilityTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Obstetric History */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-4">
                      Obstetric History
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Para
                        </label>
                        <input
                          type="text"
                          value={medicalInfo.para}
                          onChange={(e) =>
                            updateMedicalInfo("para", e.target.value)
                          }
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
                          onChange={(e) =>
                            updateMedicalInfo("gravida", e.target.value)
                          }
                          className={inputClassName}
                          placeholder="Enter gravida"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Physical Measurements */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-4">
                      Physical Measurements
                    </h4>
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
                        <select
                          value={medicalInfo.bloodGroup}
                          onChange={(e) =>
                            updateMedicalInfo("bloodGroup", e.target.value)
                          }
                          className={inputClassName}
                        >
                          <option value="">Select blood group</option>
                          {bloodGroups.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Blood Pressure */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      value={medicalInfo.bloodPressure}
                      onChange={(e) =>
                        updateMedicalInfo("bloodPressure", e.target.value)
                      }
                      placeholder="e.g., 120/80"
                      className={inputClassName}
                    />
                  </div>

                  {/* Medical History */}
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
                          updateMedicalInfo(
                            "contraceptiveHistory",
                            e.target.value
                          )
                        }
                        className={`${inputClassName} h-24 resize-none`}
                        placeholder="Enter contraceptive history..."
                      />
                    </div>
                  </div>

                  {/* Visit Information */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-4">
                      Current Visit
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Referral Source
                        </label>
                        <select
                          value={medicalInfo.referralSource}
                          onChange={(e) =>
                            updateMedicalInfo("referralSource", e.target.value)
                          }
                          className={inputClassName}
                        >
                          <option value="">Select referral source</option>
                          {referralSources.map((source) => (
                            <option key={source} value={source}>
                              {source}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={medicalInfo.status}
                          onChange={(e) =>
                            updateMedicalInfo("status", e.target.value)
                          }
                          className={inputClassName}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
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
                        onChange={(e) =>
                          updateMedicalInfo("medications", e.target.value)
                        }
                        className={`${inputClassName} h-24 resize-none`}
                        placeholder="Enter current medications..."
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={medicalInfo.notes}
                      onChange={(e) =>
                        updateMedicalInfo("notes", e.target.value)
                      }
                      placeholder="Any additional notes..."
                      className={`${inputClassName} h-32 resize-none`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4 rounded-b-3xl">
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !isFormValid}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Patient
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddNewDataInfertility;
