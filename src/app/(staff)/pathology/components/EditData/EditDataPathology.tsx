"use client";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Save, Building2, User, Beaker } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import { useEditPathologyData } from "../../hooks/useEditPathologyData";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { getTabColors } from "../AddNewData/utils/modalUtils";
import { PathologyHospitalInformation } from "../form-section/HospitalInformation";
import PathologyPatientInformation from "../form-section/PatientInformation/PathologyPatientInformation";
import PathologyInformation from "../form-section/PathologyInformation/PathologyInformation";
import {
  usePathologyHospitalData,
  usePathologyPatientData,
  usePathologyGuardianData,
  usePathologyPathologyInfo,
  usePathologyValidationStatus,
  usePathologyActions,
} from "../../stores";
import { usePathologyScrollSpy } from "../../hooks/usePathologyScrollSpy";
import { useFetchDoctors } from "../../hooks";
import { transformPathologyDataForEdit } from "../../utils/formTransformers";
import { PathologyPatientData } from "../../types";
import { useNotification } from "@/hooks/useNotification";

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
  const { initializeFormForEdit, afterEditModalClosed } = usePathologyActions();

  // Fetch doctors list to get doctor names
  const { data: doctors = [] } = useFetchDoctors();

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && initialPatientData) {
      initializeFormForEdit(initialPatientData);
    }
  }, [isOpen, initialPatientData, initializeFormForEdit]);

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

  // Custom Hooks
  const { activeSection, scrollToSection } = usePathologyScrollSpy(
    SECTION_IDS,
    scrollContainerRef,
    isOpen
  );

  // Mutation Hook with auto-print on success
  const { editPatient, isLoading: isSubmitting } = useEditPathologyData({
    onSuccess: () => {
      // Get doctor name from the doctors list
      const selectedDoctor = doctors.find(
        (d) => d.id === pathologyInfo.orderedById
      );
      const doctorName = selectedDoctor
        ? selectedDoctor.role.toLowerCase() === "self"
          ? "Self"
          : selectedDoctor.fullName
        : "Self";

      // Auto-print receipt after successful update
      const receiptData = {
        id: initialPatientData.id,
        patientId: patientData.id,
        testNumber: initialPatientData.testNumber,
        patientFullName: `${patientData.firstName} ${
          patientData.lastName || ""
        }`.trim(),
        patientGender: patientData.gender,
        patientAge: patientData.age,
        patientDOB: patientData.dateOfBirth?.toISOString() || null,
        mobileNumber: patientData.phoneNumber,
        guardianName: guardianData.name,
        hospitalName: hospitalData.name,
        testDate: initialPatientData.testDate,
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
        orderedBy: doctorName, // Use the resolved doctor name
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

      onClose(); // closeEditModal now resets form internally
    },
  });

  // Validation
  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!hospitalData.name.trim()) {
      errors.push("Hospital name is required");
    }
    // ... [Validation logic remains same, skipping for brevity in replacement]
    // I should include validation logic or use replacement chunks to avoid overwriting huge blocks if not needed.
    // But I need to replace from imports to useEffect...
    // Let's use ReplacementChunks to update imports and useEffect separately.

    if (!patientData.firstName.trim()) {
      errors.push("Patient name is required");
    }
    if (!patientData.gender.trim()) {
      errors.push("Patient gender is required");
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
    hospitalData.name,
    patientData.firstName,
    patientData.gender,
    patientData.address,
    pathologyInfo.selectedTests,
    pathologyInfo.orderedById,
    validationStatus,
  ]);

  // Notification hook for showing validation errors
  const { showNotification } = useNotification();

  // Handlers
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose(); // closeEditModal now resets form internally
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;

    // Show validation errors if form is invalid
    if (!isFormValid) {
      const errorMessage =
        validationErrors.length === 1
          ? validationErrors[0]
          : `Please fix the following: ${validationErrors.join(", ")}`;
      showNotification(errorMessage, "error");
      return;
    }

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
    <AnimatePresence mode="wait" onExitComplete={() => afterEditModalClosed()}>
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
                  <PathologyHospitalInformation />
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
              isDisabled={false}
              cancelText="Cancel"
              submitText="Update Pathology Test"
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
