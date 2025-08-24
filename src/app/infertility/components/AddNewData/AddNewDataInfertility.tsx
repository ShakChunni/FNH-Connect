"use client";
import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  X,
  Save,
  Loader2,
  Building2,
  User,
  Stethoscope,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import { useMediaQuery } from "react-responsive";
import HospitalInformation, {
  HospitalData,
} from "./components/HospitalInformation";
import PatientInformation, {
  PatientData,
} from "./components/PatientInformation";
import MedicalInformation from "./components/MedicalInformation";

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
  messagePopupRef: React.RefObject<HTMLDivElement | null>;
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
      const calculatedBmi = Math.round(bmi * 10) / 10;

      // Only update if BMI has actually changed to avoid infinite loops
      if (medicalInfo.bmi !== calculatedBmi) {
        setMedicalInfo((prev) => ({
          ...prev,
          bmi: calculatedBmi,
        }));
      }
    } else if (medicalInfo.bmi !== null) {
      // Clear BMI if weight or height is missing
      setMedicalInfo((prev) => ({ ...prev, bmi: null }));
    }
  }, [medicalInfo.weight, medicalInfo.height, medicalInfo.bmi]);

  // Close modal function
  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
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
  }, [
    isFormValid,
    onMessage,
    onSubmit,
    user,
    hospitalData,
    patientData,
    medicalInfo,
  ]);

  // Update medical info field
  const updateMedicalInfo = useCallback((field: string, value: any) => {
    setMedicalInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Memoized callback functions to prevent infinite re-renders
  const handlePatientDataChange = useCallback((data: PatientData) => {
    setPatientData(data);
  }, []);

  const handleValidationChange = useCallback(
    (validation: { phone: boolean; email: boolean }) => {
      setValidationStatus(validation);
    },
    []
  );

  const handleDropdownToggle = useCallback((isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
  }, []);

  const handleHospitalDataChange = useCallback((data: HospitalData) => {
    setHospitalData(data);
  }, []);

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
      color: "indigo",
    },
    {
      id: "medical",
      label: "Medical Information",
      icon: Stethoscope,
      color: "purple",
    },
  ];

  // Tab styling functions
  const getTabColors = (color: string, isActive: boolean) => {
    const colorMap = {
      blue: isActive
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
        : "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
      indigo: isActive
        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg"
        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800",
      purple: isActive
        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
        : "bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800",
      pink: isActive
        ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg"
        : "bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800",
      emerald: isActive
        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
      amber: isActive
        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg"
        : "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
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
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50"
          onClick={onClose}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          style={{
            isolation: "isolate",
            willChange: "opacity",
            backfaceVisibility: "hidden",
            perspective: 1000,
          }}
        >
          <motion.div
            ref={popupRef}
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[75%] h-[95%] sm:h-[90%] popup-content flex flex-col"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-slate-50/90 via-white/85 to-slate-100/90 border-b border-gray-100 rounded-t-3xl z-10 overflow-hidden">
              <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex-shrink-0">
                    <Stethoscope
                      className="text-white"
                      size={isMobile ? 18 : isMd ? 24 : 32}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-900 leading-tight mb-0.5 sm:mb-1">
                      <span className="hidden sm:inline">Add New Patient</span>
                      <span className="sm:hidden">New Patient</span>
                    </h2>
                    <p className="text-blue-700/80 text-xs sm:text-sm font-medium leading-tight hidden lg:block">
                      Complete patient and medical information for infertility
                      management
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="bg-red-100 hover:bg-red-200 text-red-500 p-1.5 sm:p-2 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 hover:scale-110 hover:shadow-md group disabled:opacity-50"
                    aria-label="Close"
                  >
                    <motion.div
                      transition={{ duration: 0.2 }}
                      whileHover={{
                        rotate: 90,
                        scale: 1.1,
                      }}
                      whileTap={{
                        scale: 0.5,
                      }}
                    >
                      <X className="text-base sm:text-lg group-hover:text-red-600 transition-colors duration-200" />
                    </motion.div>
                  </button>
                </div>
              </div>

              {/* Sticky Navigation Tabs */}
              <div className="flex flex-wrap gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 pb-2 sm:pb-3 md:pb-4">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm ${getTabColors(
                        section.color,
                        isActive
                      )} ${
                        isActive ? "transform scale-110" : "hover:shadow-md"
                      }`}
                    >
                      <Icon
                        size={isMobile ? 14 : isMd ? 16 : 18}
                        className="flex-shrink-0"
                      />
                      <span className="hidden xs:inline sm:inline whitespace-nowrap">
                        {isMobile ? section.label.split(" ")[0] : section.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="space-y-6 sm:space-y-8 md:space-y-10">
                {/* Hospital Information */}
                <div id="hospital">
                  <HospitalInformation
                    onDataChange={handleHospitalDataChange}
                    onDropdownToggle={handleDropdownToggle}
                    onMessage={onMessage}
                    isMobile={isMobile}
                    titleTooltipStyle={{}}
                  />
                </div>

                {/* Patient Information */}
                <div id="patient">
                  <PatientInformation
                    onDataChange={handlePatientDataChange}
                    availablePatients={[]}
                    onDropdownToggle={handleDropdownToggle}
                    isMobile={isMobile}
                    onValidationChange={handleValidationChange}
                    hospitalName={hospitalData.name}
                  />
                </div>

                {/* Medical Information */}
                <div id="medicalInformation">
                  <MedicalInformation
                    medicalInfo={medicalInfo}
                    updateMedicalInfo={updateMedicalInfo}
                    inputClassName={inputClassName}
                    isMobile={isMobile}
                    isMd={isMd}
                    bloodGroups={bloodGroups}
                    infertilityTypes={infertilityTypes}
                    statusOptions={statusOptions}
                    referralSources={referralSources}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-3xl">
              <div className="flex justify-end gap-2 sm:gap-3">
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !isFormValid}
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
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
      )}
    </AnimatePresence>
  );
};

export default AddNewDataInfertility;
