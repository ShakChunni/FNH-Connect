"use client";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Save, User, Stethoscope, Beaker } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAddInfertilityData } from "../../hooks/useAddInfertilityData";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
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
import { buildInvestigationSubjectCards } from "../../utils/investigationSubjects";

import {
  INFERTILITY_ORDERING_DOCTOR_ID,
  useInfertilityTestFormStore,
} from "../../stores/testFormStore";
import { useAddInfertilityTest } from "../../hooks/useAddInfertilityTest";
import { InvestigationInformation } from "../form-sections/InvestigationInformation";
import { useInfertilityTestInfo } from "../../stores";
import { useNotification } from "@/hooks/useNotification";
import type { AddInfertilityPatientRequest, AddInfertilityPatientResponse } from "../../types";
import { hasRequiredBangladeshDistrict } from "@/lib/bangladeshAddress";


interface AddNewDataProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hospital is auto-filled as Feroza Nursing Home, only patient and medical sections are user-editable
const SECTION_IDS = ["patient", "medical", "investigation"];

const AddNewDataInfertility: React.FC<AddNewDataProps> = ({
  isOpen,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();

  // Store access
  const hospitalData = useInfertilityHospitalData();
  const patientData = useInfertilityPatientData();
  const spouseData = useInfertilitySpouseData();
  const medicalInfo = useInfertilityMedicalInfo();
  const validationStatus = useInfertilityValidationStatus();
  const { resetFormState } = useInfertilityActions();

  const testInfo = useInfertilityTestInfo();
  const { resetForm: resetTestForm } = useInfertilityTestFormStore();
  const { addTest } = useAddInfertilityTest();
  const subjectCards = useMemo(
    () =>
      buildInvestigationSubjectCards({
        patientName: patientData.fullName || patientData.firstName,
        patientGender: patientData.gender,
        patientAge: patientData.age,
        patientDateOfBirth: patientData.dateOfBirth,
        patientPhone: patientData.phoneNumber,
        spouseName: spouseData.name,
        spouseGender: spouseData.gender,
        spouseAge: spouseData.age,
        spouseDateOfBirth: spouseData.dateOfBirth,
        spousePhone: spouseData.phoneNumber,
      }),
    [
      patientData.age,
      patientData.dateOfBirth,
      patientData.firstName,
      patientData.fullName,
      patientData.gender,
      patientData.phoneNumber,
      spouseData.age,
      spouseData.dateOfBirth,
      spouseData.gender,
      spouseData.name,
      spouseData.phoneNumber,
    ],
  );


  // Custom Hooks
  useInfertilityBMI(); // Logic encapsulated
  const { activeSection, scrollToSection } = useInfertilityScrollSpy(
    SECTION_IDS,
    isOpen
  );

  // Mutation Hook
  const { addPatient, isLoading: isSubmitting } = useAddInfertilityData({
    onSuccess: (res: AddInfertilityPatientResponse) => {
      // If tests are selected, submit them using the new patient's ID
      if (testInfo.selectedTests && testInfo.selectedTests.length > 0 && res?.data?.infertilityRecord?.id) {
        if (testInfo.subjectType === "UNKNOWN") {
          showNotification(
            "Choose Patient or Spouse before adding investigations",
            "error",
          );
          return;
        }

        addTest({
          infertilityPatientId: res.data.infertilityRecord.id,
          subjectType: testInfo.subjectType,
          subjectNameSnapshot:
            testInfo.subjectType === "SPOUSE"
              ? subjectCards.spouse.displayName
              : null,
          selectedTests: testInfo.selectedTests,
          testCharge: testInfo.testCharge,
          discountType: testInfo.discountType,
          discountValue: testInfo.discountValue,
          discountAmount: testInfo.discountAmount || 0,
          grandTotal: testInfo.grandTotal,
          paidAmount: testInfo.paidAmount,
          dueAmount: testInfo.dueAmount,
          orderedById: INFERTILITY_ORDERING_DOCTOR_ID,
          remarks: testInfo.remarks,
        });
      }
      onClose();
    },
  });

  // Validation - hospital is auto-filled, so only validate patient and medical data
  const isFormValid = useMemo(() => {
    return (
      patientData.firstName.trim() !== "" &&
      hasRequiredBangladeshDistrict(patientData.address) &&
      validationStatus.phone &&
      validationStatus.email
    );
  }, [patientData.firstName, patientData.address, validationStatus]);

  // Handlers
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;

    if (!hasRequiredBangladeshDistrict(patientData.address)) {
      showNotification("Patient district is required", "error");
      return;
    }

    if (!isFormValid) return;

    if (testInfo.selectedTests.length > 0 && testInfo.subjectType === "UNKNOWN") {
      showNotification(
        "Choose Patient or Spouse before adding investigations",
        "error",
      );
      return;
    }

    if (
      testInfo.selectedTests.length > 0 &&
      testInfo.subjectType === "SPOUSE" &&
      !subjectCards.spouse.isAvailable
    ) {
      showNotification(
        "Enter spouse details before ordering spouse investigations",
        "error",
      );
      return;
    }

    const { id, ...payloadWithoutId } = transformInfertilityDataForApi(
      hospitalData,
      patientData,
      spouseData,
      medicalInfo
    );

    addPatient(payloadWithoutId as AddInfertilityPatientRequest);
  }, [
    isFormValid,
    isSubmitting,
    hospitalData,
    patientData,
    spouseData,
    medicalInfo,
    addPatient,
    testInfo.selectedTests.length,
    testInfo.subjectType,
    subjectCards.spouse.displayName,
    subjectCards.spouse.isAvailable,
    showNotification,
  ]);

  // Body scroll lock + keyboard handling
  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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
    {
      id: "investigation",
      label: "Investigations",
      icon: Beaker,
      color: "teal",
    },
  ];

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        resetFormState();
        resetTestForm();
      }}
    >
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-100000"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
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
            exit="exit"
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
              subtitle="Enter all required details to register a new HSI Center case."
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
                <div id="investigation">
              <InvestigationInformation
                patientSubject={subjectCards.patient}
                spouseSubject={subjectCards.spouse}
              />
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
