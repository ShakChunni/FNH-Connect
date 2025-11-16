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
import { useEditInfertilityData } from "../../hooks/useEditInfertilityData";
import {
  modalVariants,
  backdropVariants,
} from "@/components/ui/modal-animations";
import { getTabColors } from "./utils/modalUtils";
import { initializeFormData } from "./utils/formInitialization";
import HospitalInformation, {
  HospitalData,
} from "./components/HospitalInformation";
import PatientInformation, {
  PatientData,
} from "./components/PatientInformation";
import MedicalInformation from "./components/MedicalInformation";
import { InfertilityPatientData } from "../../types";

interface EditDataProps {
  isOpen: boolean;
  onClose: () => void;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement | null>;
  patientData: InfertilityPatientData;
}

const EditDataInfertility: React.FC<EditDataProps> = ({
  isOpen,
  onClose,
  onMessage,
  messagePopupRef,
  patientData,
}) => {
  const { user } = useAuth();

  // Initialize our custom hook for editing infertility data
  const {
    editPatient,
    isLoading: isSubmitting,
    error: submitError,
    reset: resetMutation,
  } = useEditInfertilityData({
    onSuccess: (data) => {
      if (data && data.data) {
        onMessage(
          "success",
          `Patient ${data.data.patient.fullName} has been successfully updated with ID: ${data.data.displayId}`
        );
      } else {
        onMessage("success", "Patient has been successfully updated!");
      }
      onClose();
    },
    onError: (error) => {
      onMessage(
        "error",
        error.message || "Failed to update patient data. Please try again."
      );
    },
  });

  // Initialize form data from patientData prop
  const getInitialFormData = useCallback(() => {
    return initializeFormData(patientData);
  }, [patientData]);

  // Main data states - initialized with patient data
  const [formData, setFormData] = useState(getInitialFormData);

  // Extract individual state variables for easier access
  const [hospitalData, setHospitalData] = useState<HospitalData>(
    formData.hospitalData
  );
  const [patientDataState, setPatientDataState] = useState<PatientData>(
    formData.patientData
  );
  const [medicalInfo, setMedicalInfo] = useState(formData.medicalInfo);

  // Update form data when patientData prop changes
  useEffect(() => {
    const newFormData = getInitialFormData();
    setFormData(newFormData);
    setHospitalData(newFormData.hospitalData);
    setPatientDataState(newFormData.patientData);
    setMedicalInfo(newFormData.medicalInfo);
  }, [patientData, getInitialFormData]);

  // UI states
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
      patientDataState.patientFirstName.trim() !== "" &&
      validationStatus.phone &&
      validationStatus.email
    );
  }, [hospitalData.name, patientDataState.patientFirstName, validationStatus]);

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
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      onMessage("error", "Please fill in all required fields.");
      return;
    }

    try {
      // Transform our component data to match the API request format
      const apiData = {
        id: patientData.id, // The infertility patient record ID
        hospital: {
          id: hospitalData.id,
          name: hospitalData.name,
          address: hospitalData.address,
          phoneNumber: hospitalData.phoneNumber,
          email: hospitalData.email,
          website: hospitalData.website,
          type: hospitalData.type,
        },
        patient: {
          id: patientDataState.id,
          firstName: patientDataState.patientFirstName,
          lastName: patientDataState.patientLastName || "",
          fullName: patientDataState.patientFullName,
          gender: patientDataState.patientGender,
          age: patientDataState.patientAge,
          dateOfBirth: patientDataState.patientDOB,
          guardianName: patientDataState.spouseName, // Spouse name for infertility patients
          address: patientDataState.address,
          phoneNumber: patientDataState.mobileNumber,
          email: patientDataState.email,
          bloodGroup: medicalInfo.bloodGroup,
        },
        spouseInfo: {
          name: patientDataState.spouseName,
          age: patientDataState.spouseAge,
          dateOfBirth: patientDataState.spouseDOB,
          gender: patientDataState.spouseGender,
        },
        medicalInfo: {
          yearsMarried: medicalInfo.yearsMarried,
          yearsTrying: medicalInfo.yearsTrying,
          infertilityType: medicalInfo.infertilityType,
          para: medicalInfo.para,
          gravida: medicalInfo.gravida,
          weight: medicalInfo.weight,
          height: medicalInfo.height,
          bmi: medicalInfo.bmi,
          bloodPressure: medicalInfo.bloodPressure,
          medicalHistory: medicalInfo.medicalHistory,
          surgicalHistory: medicalInfo.surgicalHistory,
          menstrualHistory: medicalInfo.menstrualHistory,
          contraceptiveHistory: medicalInfo.contraceptiveHistory,
          referralSource: medicalInfo.referralSource,
          chiefComplaint: medicalInfo.chiefComplaint,
          treatmentPlan: medicalInfo.treatmentPlan,
          medications: medicalInfo.medications,
          nextAppointment: medicalInfo.nextAppointment,
          status: medicalInfo.status,
          notes: medicalInfo.notes,
        },
      };

      await editPatient(apiData);
    } catch (error) {
      // Error is already handled by the hook's onError callback
      console.error("Submit error:", error);
    }
  }, [
    isFormValid,
    onMessage,
    patientData.id,
    hospitalData,
    patientDataState,
    medicalInfo,
    editPatient,
  ]);

  const [userClickedSection, setUserClickedSection] = useState<string | null>(
    null
  );
  const [userClickTimeout, setUserClickTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -30% 0px",
      threshold: 0.2,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (userClickedSection) return; // Don't update if user just clicked a tab
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const handleScroll = (e: Event) => {
      if (userClickedSection) return;
      // Optionally, you can add logic here for bottom-of-scroll edge cases
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Section IDs must match your rendered sections
    const sectionIds = ["hospital", "patient", "medical"];
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    sectionElements.forEach((el) => {
      if (el) observer.observe(el);
    });

    // Attach scroll listener to the scrollable container
    const scrollContainer = document.querySelector(".overflow-y-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      sectionElements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isOpen, userClickedSection]);

  // Update scrollToSection to set userClickedSection and timeout
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setUserClickedSection(sectionId);

    if (userClickTimeout) {
      clearTimeout(userClickTimeout);
    }
    const timeout = setTimeout(() => {
      setUserClickedSection(null);
    }, 1000);
    setUserClickTimeout(timeout);

    const element = document.getElementById(sectionId);
    const scrollContainer = document.querySelector(".overflow-y-auto");

    if (element && scrollContainer) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    return () => {
      if (userClickTimeout) {
        clearTimeout(userClickTimeout);
      }
    };
  }, [userClickTimeout]);

  // Update medical info field
  const updateMedicalInfo = useCallback((field: string, value: any) => {
    setMedicalInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Memoized callback functions to prevent infinite re-renders
  const handlePatientDataChange = useCallback((data: PatientData) => {
    setPatientDataState(data);
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

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-100000"
          onClick={onClose}
          variants={backdropVariants}
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
            <div className="sticky top-0 bg-linear-to-br from-slate-50/90 via-white/85 to-slate-100/90 border-b border-gray-100 rounded-t-3xl z-10 overflow-hidden">
              <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 md:p-3 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shrink-0">
                    <Stethoscope
                      className="text-white"
                      size={isMobile ? 18 : isMd ? 24 : 32}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-900 leading-tight mb-0.5 sm:mb-1">
                      <span className="hidden sm:inline">Edit Patient</span>
                      <span className="sm:hidden">Edit Patient</span>
                    </h2>
                    <p className="text-blue-700/80 text-xs sm:text-sm font-medium leading-tight hidden lg:block">
                      Update patient information and medical details for
                      infertility case.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Close Button */}
                  <button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="bg-red-100 hover:bg-red-200 text-red-500 p-1.5 sm:p-2 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 hover:scale-110 hover:shadow-md group disabled:opacity-50"
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
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm cursor-pointer ${getTabColors(
                        section.color,
                        isActive
                      )} ${
                        isActive ? "transform scale-110" : "hover:shadow-md"
                      }`}
                    >
                      <Icon
                        size={isMobile ? 14 : isMd ? 16 : 18}
                        className="shrink-0"
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
                    initialData={formData.hospitalData}
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
                    initialData={formData.patientData}
                  />
                </div>

                {/* Medical Information */}
                <div id="medical">
                  <MedicalInformation
                    medicalInfo={medicalInfo}
                    updateMedicalInfo={updateMedicalInfo}
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
                  disabled={isSubmitting}
                  className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid}
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Patient
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

export default EditDataInfertility;
