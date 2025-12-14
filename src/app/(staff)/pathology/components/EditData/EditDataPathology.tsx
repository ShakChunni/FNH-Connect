"use client";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Save, Building2, User, Beaker } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import { useEditPathologyData } from "../../hooks/useEditPathologyData";
import {
  modalVariants,
  backdropVariants,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { getTabColors } from "../AddNewData/utils/modalUtils";
import HospitalInformation from "../../../../../components/form-sections/HospitalInformation";
import PathologyPatientInformation from "../../../../../components/form-sections/PathologyPatientInformation";
import PathologyInformation from "../../../../../components/form-sections/PathologyInformation";
import {
  usePathologyHospitalData,
  usePathologyPatientData,
  usePathologyGuardianData,
  usePathologyPathologyInfo,
  usePathologyValidationStatus,
  usePathologyActions,
} from "../../stores";
import { usePathologyScrollSpy } from "../../hooks/usePathologyScrollSpy";
import { transformPathologyDataForEdit } from "../../utils/formTransformers";
import { PathologyPatientData } from "../../types";

interface EditDataProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: PathologyPatientData;
}

const SECTION_IDS = ["hospital", "patient", "pathology"];

const EditDataPathology: React.FC<EditDataProps> = ({
  isOpen,
  onClose,
  patientData: initialPatientData,
}) => {
  const { user } = useAuth();
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Store access
  const hospitalData = usePathologyHospitalData();
  const patientData = usePathologyPatientData();
  const guardianData = usePathologyGuardianData();
  const pathologyInfo = usePathologyPathologyInfo();
  const validationStatus = usePathologyValidationStatus();
  const { resetFormState, initializeFormForEdit } = usePathologyActions();

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && initialPatientData) {
      initializeFormForEdit(initialPatientData);
    }
  }, [isOpen, initialPatientData, initializeFormForEdit]);

  // Custom Hooks
  const { activeSection, scrollToSection } = usePathologyScrollSpy(
    SECTION_IDS,
    scrollContainerRef,
    isOpen
  );

  // Mutation Hook
  const { editPatient, isLoading: isSubmitting } = useEditPathologyData({
    onSuccess: () => {
      onClose();
      resetFormState();
    },
  });

  // Validation
  const isFormValid = useMemo(() => {
    return (
      hospitalData.name.trim() !== "" &&
      patientData.firstName.trim() !== "" &&
      pathologyInfo.selectedTests.length > 0 &&
      validationStatus.phone &&
      validationStatus.email
    );
  }, [
    hospitalData.name,
    patientData.firstName,
    pathologyInfo.selectedTests,
    validationStatus,
  ]);

  // Handlers
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (!isFormValid || isSubmitting) return;

    const payload = transformPathologyDataForEdit(
      initialPatientData.id,
      hospitalData,
      patientData,
      guardianData,
      pathologyInfo
    );

    editPatient(payload);
  }, [
    isFormValid,
    isSubmitting,
    initialPatientData.id,
    hospitalData,
    patientData,
    guardianData,
    pathologyInfo,
    editPatient,
  ]);

  // Keyboard handling
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
      id: "pathology",
      label: "Pathology Tests",
      icon: Beaker,
      color: "green",
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
            <ModalHeader
              icon={Beaker}
              iconColor="green"
              title={`Edit Pathology Test - ${initialPatientData.testNumber}`}
              subtitle="Update test details and patient information."
              onClose={handleClose}
              isDisabled={isSubmitting}
            >
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

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6"
            >
              <div className="space-y-6 sm:space-y-8 md:space-y-10">
                <div id="hospital">
                  <HospitalInformation />
                </div>
                <div id="patient">
                  <PathologyPatientInformation />
                </div>
                <div id="pathology">
                  <PathologyInformation />
                </div>
              </div>
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={!isFormValid}
              cancelText="Cancel"
              submitText="Update Patient"
              loadingText="Updating..."
              submitIcon={Save}
              theme="green"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditDataPathology;
