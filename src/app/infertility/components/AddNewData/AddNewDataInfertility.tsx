"use client";
import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import { Save, Building2, User, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import { useAddInfertilityData } from "../../hooks/useAddInfertilityData";
import {
  modalVariants,
  backdropVariants,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { getTabColors } from "./utils/modalUtils";
import HospitalInformation from "../form-sections/HospitalInformation";
import PatientInformation from "../form-sections/PatientInformation";
import MedicalInformation from "../form-sections/MedicalInformation";
import {
  useInfertilityHospitalData,
  useInfertilityPatientData,
  useInfertilitySpouseData,
  useInfertilityMedicalInfo,
  useInfertilityValidationStatus,
  useInfertilityActions,
} from "../../stores";

interface AddNewDataProps {
  isOpen: boolean;
  onClose: () => void;
  onMessage: (type: "success" | "error", content: string) => void;
  messagePopupRef: React.RefObject<HTMLDivElement | null>;
}

const AddNewDataInfertility: React.FC<AddNewDataProps> = ({
  isOpen,
  onClose,
  onMessage,
  messagePopupRef,
}) => {
  const { user } = useAuth();

  // Get form data from Zustand store
  const hospitalData = useInfertilityHospitalData();
  const patientData = useInfertilityPatientData();
  const spouseData = useInfertilitySpouseData();
  const medicalInfo = useInfertilityMedicalInfo();
  const validationStatus = useInfertilityValidationStatus();
  const {
    setHospitalData,
    setPatientData,
    setSpouseData,
    setMedicalInfo,
    updateMedicalInfo,
    resetFormState,
  } = useInfertilityActions();

  // Initialize our custom hook for adding infertility data
  const {
    addPatient,
    isLoading: isSubmitting,
    error: submitError,
    reset: resetMutation,
  } = useAddInfertilityData({
    onSuccess: (data, variables, context) => {
      if (data && data.data) {
        onMessage(
          "success",
          `Patient ${data.data.patient.fullName} has been successfully registered with ID: ${data.data.displayId}`
        );
      } else {
        onMessage("success", "Patient has been successfully registered!");
      }
      onClose();
      // Reset form data using Zustand action
      resetFormState();
    },
    onError: (error) => {
      onMessage(
        "error",
        error.message || "Failed to save patient data. Please try again."
      );
    },
  });

  // UI states
  const [activeSection, setActiveSection] = useState("hospital");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);

  // Note: Responsive design now handled via Tailwind CSS classes

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      hospitalData.name.trim() !== "" &&
      patientData.firstName.trim() !== "" &&
      validationStatus.phone &&
      validationStatus.email
    );
  }, [hospitalData.name, patientData.firstName, validationStatus]);

  // BMI calculation
  useEffect(() => {
    if (medicalInfo.weight && medicalInfo.height) {
      const heightInMeters = medicalInfo.height / 100;
      const bmi = medicalInfo.weight / (heightInMeters * heightInMeters);
      const calculatedBmi = Math.round(bmi * 10) / 10;

      // Only update if BMI has actually changed to avoid infinite loops
      if (medicalInfo.bmi !== calculatedBmi) {
        updateMedicalInfo("bmi", calculatedBmi);
      }
    } else if (medicalInfo.bmi !== null) {
      // Clear BMI if weight or height is missing
      updateMedicalInfo("bmi", null);
    }
  }, [
    medicalInfo.weight,
    medicalInfo.height,
    medicalInfo.bmi,
    updateMedicalInfo,
  ]);

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
          id: patientData.id,
          firstName: patientData.firstName,
          lastName: patientData.lastName || "",
          fullName: patientData.fullName,
          gender: patientData.gender,
          age: patientData.age,
          dateOfBirth: patientData.dateOfBirth,
          guardianName: spouseData.name, // Spouse name for infertility patients
          address: patientData.address,
          phoneNumber: patientData.phoneNumber,
          email: patientData.email,
          bloodGroup: patientData.bloodGroup,
        },
        spouseInfo: {
          name: spouseData.name,
          age: spouseData.age,
          dateOfBirth: spouseData.dateOfBirth,
          gender: spouseData.gender,
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

      await addPatient(apiData);
    } catch (error) {
      // Error is already handled by the hook's onError callback
      console.error("Submit error:", error);
    }
  }, [
    isFormValid,
    onMessage,
    hospitalData,
    patientData,
    spouseData,
    medicalInfo,
    addPatient,
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

  const handleDropdownToggle = useCallback((isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
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
            {/* Header using global ModalHeader */}
            <ModalHeader
              icon={Stethoscope}
              iconColor="blue"
              title="Add New Patient"
              subtitle="Enter all required hospital, patient, and medical details to register a new infertility case."
              onClose={handleClose}
              isDisabled={isSubmitting}
            >
              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-2 sm:gap-4">
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
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] shrink-0" />
                      <span className="hidden sm:inline whitespace-nowrap">
                        {section.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ModalHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="space-y-6 sm:space-y-8 md:space-y-10">
                {/* Hospital Information */}
                <div id="hospital">
                  <HospitalInformation
                    onDropdownToggle={handleDropdownToggle}
                    onMessage={onMessage}
                    isMobile={false}
                    titleTooltipStyle={{}}
                  />
                </div>

                {/* Patient Information */}
                <div id="patient">
                  <PatientInformation
                    availablePatients={[]}
                    onDropdownToggle={handleDropdownToggle}
                    isMobile={false}
                    hospitalName={hospitalData.name}
                  />
                </div>

                {/* Medical Information */}
                <div id="medical">
                  <MedicalInformation />
                </div>
              </div>
            </div>

            {/* Footer using global ModalFooter */}
            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={!isFormValid}
              cancelText="Cancel"
              submitText="Save Patient"
              loadingText="Saving..."
              submitIcon={Save}
              theme="blue"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddNewDataInfertility;
