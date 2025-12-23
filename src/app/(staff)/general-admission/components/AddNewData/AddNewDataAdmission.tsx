"use client";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Save, Building2, User, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import {
  AdmissionHospitalInformation,
  AdmissionPatientInformation,
  DepartmentSelection,
} from "../form-section";
import {
  useAdmissionHospitalData,
  useAdmissionPatientData,
  useAdmissionDepartmentData,
  useAdmissionDoctorData,
  useAdmissionInfo,
  useAdmissionValidationStatus,
  useAdmissionActions,
} from "../../stores";
import { useAdmissionScrollSpy } from "../../hooks";
import { useAddAdmissionData } from "../../hooks/useAddAdmissionData";
import { useNotification } from "@/hooks/useNotification";
import { AdmissionPatientData } from "../../types";

interface AddNewDataProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: AdmissionPatientData) => void;
}

const SECTION_IDS = ["hospital", "patient", "department"];

const getTabColors = (color: string, isActive: boolean) => {
  const colors: Record<string, { active: string; inactive: string }> = {
    blue: {
      active: "bg-blue-600 text-white shadow-lg",
      inactive: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
    indigo: {
      active: "bg-indigo-600 text-white shadow-lg",
      inactive: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    },
    purple: {
      active: "bg-purple-600 text-white shadow-lg",
      inactive: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    },
  };
  return isActive ? colors[color]?.active : colors[color]?.inactive;
};

const AddNewDataAdmission: React.FC<AddNewDataProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Store access
  const hospitalData = useAdmissionHospitalData();
  const patientData = useAdmissionPatientData();
  const departmentData = useAdmissionDepartmentData();
  const doctorData = useAdmissionDoctorData();
  const validationStatus = useAdmissionValidationStatus();
  const admissionInfo = useAdmissionInfo();
  const { resetForm, afterAddModalClosed } = useAdmissionActions();

  // Custom Hooks
  const { activeSection, scrollToSection } = useAdmissionScrollSpy(
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

  // Mutation Hook
  const { addAdmission, isLoading: isSubmitting } = useAddAdmissionData({
    onSuccess: (data) => {
      onClose();
      onSuccess?.(data);
    },
  });

  // Validation
  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!hospitalData.name.trim()) {
      errors.push("Hospital name is required");
    }
    if (!patientData.firstName.trim()) {
      errors.push("Patient first name is required");
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
    if (!departmentData.id) {
      errors.push("Department is required");
    }
    if (!doctorData.id) {
      errors.push("Doctor is required");
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
    patientData.phoneNumber,
    patientData.dateOfBirth,
    departmentData.id,
    doctorData.id,
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

    addAdmission({
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
        lastName: patientData.lastName,
        fullName: patientData.fullName,
        gender: patientData.gender,
        age: patientData.age,
        dateOfBirth: patientData.dateOfBirth,
        address: patientData.address,
        phoneNumber: patientData.phoneNumber,
        email: patientData.email,
        bloodGroup: patientData.bloodGroup,
        guardianName: patientData.guardianName,
        guardianPhone: patientData.guardianPhone,
      },
      departmentId: departmentData.id!,
      doctorId: doctorData.id!,
      chiefComplaint: admissionInfo.chiefComplaint,
    });
  }, [
    isFormValid,
    isSubmitting,
    hospitalData,
    patientData,
    departmentData,
    doctorData,
    addAdmission,
    admissionInfo,
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
      id: "department",
      label: "Department & Doctor",
      icon: Stethoscope,
      color: "purple",
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
              icon={Stethoscope}
              iconColor="green"
              title="New Patient Admission"
              subtitle="Enter patient and admission details. Admission fee: ৳300"
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
                  <AdmissionHospitalInformation />
                </div>
                <div id="patient">
                  <AdmissionPatientInformation showAdmissionDetails={true} />
                </div>
                <div id="department">
                  <DepartmentSelection hideWardRoom={true} />
                </div>
              </div>
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={false}
              cancelText="Cancel"
              submitText="Admit Patient"
              loadingText="Admitting..."
              submitIcon={Save}
              theme="green"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddNewDataAdmission;
