"use client";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Save, User, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAddInfertilityData } from "../../hooks/useAddInfertilityData";
import {
  modalVariants,
  backdropVariants,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { getTabColors } from "./utils/modalUtils";
import PatientInformation from "../form-sections/PatientInformation/PatientInformation";
import MedicalInformation from "../form-sections/MedicalInformation/MedicalInformation";
import {
  useInfertilityHospitalData,
  useInfertilityPatientData,
  useInfertilitySpouseData,
  useInfertilityMedicalInfo,
  useInfertilityValidationStatus,
  useInfertilityActions,
} from "../../stores";
import { useInfertilityBMI } from "../../hooks/useInfertilityBMI";
import { useInfertilityScrollSpy } from "../../hooks/useInfertilityScrollSpy";
import { transformInfertilityDataForApi } from "../../utils/formTransformers";

interface AddNewDataProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hospital is auto-filled as Feroza Nursing Home, only patient and medical sections are user-editable
const SECTION_IDS = ["patient", "medical"];

const AddNewDataInfertility: React.FC<AddNewDataProps> = ({
  isOpen,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Store access
  const hospitalData = useInfertilityHospitalData();
  const patientData = useInfertilityPatientData();
  const spouseData = useInfertilitySpouseData();
  const medicalInfo = useInfertilityMedicalInfo();
  const validationStatus = useInfertilityValidationStatus();
  const { resetFormState } = useInfertilityActions();

  // Custom Hooks
  useInfertilityBMI(); // Logic encapsulated
  const { activeSection, scrollToSection } = useInfertilityScrollSpy(
    SECTION_IDS,
    isOpen
  );

  // Mutation Hook
  const { addPatient, isLoading: isSubmitting } = useAddInfertilityData({
    onSuccess: () => {
      onClose();
      resetFormState();
    },
  });

  // Validation - hospital is auto-filled, so only validate patient and medical data
  const isFormValid = useMemo(() => {
    return (
      patientData.firstName.trim() !== "" &&
      validationStatus.phone &&
      validationStatus.email
    );
  }, [hospitalData.name, patientData.firstName, validationStatus]);

  // Handlers
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (!isFormValid || isSubmitting) return;

    const { id, ...payloadWithoutId } = transformInfertilityDataForApi(
      hospitalData,
      patientData,
      spouseData,
      medicalInfo
    );

    addPatient(payloadWithoutId as any);
  }, [
    isFormValid,
    isSubmitting,
    hospitalData,
    patientData,
    spouseData,
    medicalInfo,
    addPatient,
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

  // Hospital is auto-filled as Feroza Nursing Home, only show patient and medical tabs
  const sections = [
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
            <ModalHeader
              icon={Stethoscope}
              iconColor="blue"
              title="Add New Patient"
              subtitle="Enter all required details to register a new infertility case."
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

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="space-y-6 sm:space-y-8 md:space-y-10">
                {/* Hospital is auto-filled as Feroza Nursing Home */}
                <div id="patient">
                  <PatientInformation />
                </div>
                <div id="medical">
                  <MedicalInformation />
                </div>
              </div>
            </div>

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
