"use client";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Save, User, Beaker } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import { useAddPathologyData } from "../../hooks/useAddPathologyData";

import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { getTabColors } from "./utils/modalUtils";
import PathologyPatientInformation from "../form-section/PatientInformation/PathologyPatientInformation";
import PathologyInformation from "../form-section/PathologyInformation/PathologyInformation";
import {
  usePathologyPatientData,
  usePathologyGuardianData,
  usePathologyPathologyInfo,
  usePathologyValidationStatus,
  usePathologyActions,
} from "../../stores";
import { usePathologyScrollSpy } from "../../hooks/usePathologyScrollSpy";
import { useFetchDoctors } from "../../hooks";
import { transformPathologyDataForApi } from "../../utils/formTransformers";
import { useNotification } from "@/hooks/useNotification";

interface AddNewDataProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTION_IDS = ["patient", "pathology"];

const AddNewDataPathology: React.FC<AddNewDataProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Store access (removed hospital)
  const patientData = usePathologyPatientData();
  const guardianData = usePathologyGuardianData();
  const pathologyInfo = usePathologyPathologyInfo();
  const validationStatus = usePathologyValidationStatus();
  const { afterAddModalClosed } = usePathologyActions();

  // Fetch doctors list to get doctor names
  const { data: doctors = [] } = useFetchDoctors();

  // Custom Hooks
  const { activeSection, scrollToSection } = usePathologyScrollSpy(
    SECTION_IDS,
    scrollContainerRef,
    isOpen
  );

  // Handle body scroll locking
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

  // Mutation Hook with auto-print on success
  const { addPatient, isLoading: isSubmitting } = useAddPathologyData({
    onSuccess: (response) => {
      // Auto-print receipt after successful add
      if (response.data) {
        // Get doctor name from the doctors list
        const selectedDoctor = doctors.find(
          (d) => d.id === pathologyInfo.orderedById
        );
        const doctorName = selectedDoctor
          ? selectedDoctor.role.toLowerCase() === "self"
            ? "Self"
            : selectedDoctor.fullName
          : "Self";

        // Construct PathologyPatientData from local form state + API response
        const receiptData = {
          id: response.data.pathologyTest.id,
          patientId: response.data.patient.id,
          testNumber: response.data.displayId,
          patientFullName: `${patientData.firstName} ${
            patientData.lastName || ""
          }`.trim(),
          patientGender: patientData.gender,
          patientAge: patientData.age,
          patientDOB: patientData.dateOfBirth?.toISOString() || null,
          address: patientData.address,
          mobileNumber: patientData.phoneNumber,
          guardianName: guardianData.name,
          hospitalName: "FNH Hospital", // Hardcoded - only one hospital
          testDate: new Date().toISOString(),
          testCategory: "Multiple Tests",
          testResults: { tests: pathologyInfo.selectedTests },
          remarks: pathologyInfo.remarks,
          isCompleted: pathologyInfo.isCompleted,
          testCharge: pathologyInfo.testCharge,
          discountType: pathologyInfo.discountType,
          discountValue: pathologyInfo.discountValue,
          discountAmount: pathologyInfo.discountAmount || 0,
          grandTotal: pathologyInfo.grandTotal,
          paidAmount: pathologyInfo.paidAmount,
          dueAmount: pathologyInfo.dueAmount,
          orderedBy: doctorName,
          orderedById: pathologyInfo.orderedById,
        };

        // Dynamically import and generate receipt
        import("../../utils/generateReceipt").then(
          ({ generatePathologyReceipt }) => {
            setTimeout(() => {
              generatePathologyReceipt(
                receiptData as any,
                user?.fullName || "Staff"
              );
            }, 300);
          }
        );
      }
      onClose();
    },
  });

  // Validation (removed hospital)
  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!patientData.firstName.trim()) {
      errors.push("Patient name is required");
    }
    if (!patientData.gender.trim()) {
      errors.push("Patient gender is required");
    }
    if (!patientData.phoneNumber.trim()) {
      errors.push("Patient phone number is required");
    }
    if (!patientData.dateOfBirth) {
      errors.push("Patient date of birth is required");
    }
    if (!patientData.address?.trim()) {
      errors.push("Patient address is required");
    }
    if (pathologyInfo.selectedTests.length === 0) {
      errors.push("At least one test must be selected");
    }
    if (!pathologyInfo.orderedById) {
      errors.push("Ordering doctor is required");
    }
    if (!validationStatus.phone) {
      errors.push("Invalid phone number");
    }
    if (!validationStatus.email) {
      errors.push("Invalid email address");
    }

    return {
      isFormValid: errors.length === 0,
      validationErrors: errors,
    };
  }, [
    patientData.firstName,
    patientData.gender,
    patientData.phoneNumber,
    patientData.dateOfBirth,
    patientData.address,
    pathologyInfo.selectedTests,
    pathologyInfo.orderedById,
    validationStatus,
  ]);

  const { showNotification } = useNotification();

  // Handlers
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;

    if (!isFormValid) {
      const errorMessage =
        validationErrors.length === 1
          ? validationErrors[0]
          : `Please fix the following: ${validationErrors.join(", ")}`;
      showNotification(errorMessage, "error");
      return;
    }

    const payload = transformPathologyDataForApi(
      patientData,
      guardianData,
      pathologyInfo
    );

    addPatient(payload);
  }, [
    isFormValid,
    isSubmitting,
    patientData,
    guardianData,
    pathologyInfo,
    addPatient,
    validationErrors,
    showNotification,
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
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const sections = [
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
    <AnimatePresence mode="wait" onExitComplete={() => afterAddModalClosed()}>
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
              icon={Beaker}
              iconColor="green"
              title="Add New Pathology Patient"
              subtitle="Enter all required details to register a new pathology test."
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
              isDisabled={false}
              cancelText="Cancel"
              submitText="Register Pathology Test"
              loadingText="Saving..."
              submitIcon={Save}
              theme="green"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddNewDataPathology;
