"use client";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Save, User, Activity, Wallet, Pill } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import {
  AdmissionPatientInformation,
  DepartmentSelection,
  AdmissionStatusSection,
  MedicineInformation,
  FinancialInformation,
} from "../form-section";
import {
  useAdmissionPatientData,
  useAdmissionDoctorData,
  useAdmissionInfo,
  useAdmissionFinancialData,
  useAdmissionMedicineChargeItems,
  useAdmissionActions,
} from "../../stores";
import { useAdmissionScrollSpy } from "../../hooks";
import { useEditAdmissionData } from "../../hooks/useEditAdmissionData";
import { useNotification } from "@/hooks/useNotification";
import { isAdminRole, isReceptionistRole } from "@/lib/roles";
import { AdmissionPatientData } from "../../types";

interface EditDataProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: AdmissionPatientData;
}

const SECTION_IDS = ["patient", "status", "medicines", "financial"];

const getTabColors = (color: string, isActive: boolean) => {
  const colors: Record<string, { active: string; inactive: string }> = {
    indigo: {
      active: "bg-indigo-600 text-white shadow-lg",
      inactive: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    },
    amber: {
      active: "bg-amber-600 text-white shadow-lg",
      inactive: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    },
    green: {
      active: "bg-green-600 text-white shadow-lg",
      inactive: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    emerald: {
      active: "bg-emerald-600 text-white shadow-lg",
      inactive: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    },
  };
  return isActive ? colors[color]?.active : colors[color]?.inactive;
};

const EditDataAdmission: React.FC<EditDataProps> = ({
  isOpen,
  onClose,
  patientData: initialPatientData,
}) => {
  const { user } = useAuth();
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Store access (removed hospital)
  const patientData = useAdmissionPatientData();
  const doctorData = useAdmissionDoctorData();
  const admissionInfo = useAdmissionInfo();
  const financialData = useAdmissionFinancialData();
  const medicineChargeItems = useAdmissionMedicineChargeItems();
  const { initializeFormForEdit, resetForm, afterEditModalClosed } =
    useAdmissionActions();
  const canEditDoctorReassignment = Boolean(
    user?.role && (isAdminRole(user.role) || isReceptionistRole(user.role))
  );

  // Initialize form
  useEffect(() => {
    if (isOpen && initialPatientData) {
      initializeFormForEdit(initialPatientData);
    }
  }, [isOpen, initialPatientData, initializeFormForEdit]);

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

  // Mutation with auto-print on success
  const { editAdmission, isLoading: isSubmitting } = useEditAdmissionData({
    onSuccess: (savedAdmission) => {
      // Auto-print invoice after successful update
      const staffName = user?.fullName || "Staff";

      const invoiceData: AdmissionPatientData = {
        ...savedAdmission,
        createdByName:
          savedAdmission.createdByName || initialPatientData.createdByName,
        lastModifiedByName: staffName,
      };

      // Dynamically import and generate invoice
      import("../../utils/generateReceipt").then(
        ({ generateAdmissionInvoice }) => {
          setTimeout(() => {
            generateAdmissionInvoice(invoiceData, staffName);
          }, 300);
        }
      );

      onClose();
    },
  });

  // Validation (removed hospital)
  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!patientData.firstName.trim()) {
      errors.push("Patient name is required");
    }
    if (!patientData.address.trim()) {
      errors.push("Patient address is required");
    }

    medicineChargeItems.forEach((item, index) => {
      if (item.medicineId === null) {
        errors.push(
          `Medicine row ${index + 1}: select a pharmacy medicine or remove the row`,
        );
      }
      if (
        initialPatientData.medicineBillingEnabled &&
        item.unitPrice <= 0
      ) {
        errors.push(
          `Medicine row ${index + 1}: sale price must be greater than 0`,
        );
      }
      if (
        item.currentStock !== undefined &&
        item.quantity > item.currentStock
      ) {
        errors.push(
          `Medicine row ${index + 1}: quantity exceeds available stock`,
        );
      }
    });

    return {
      isFormValid: errors.length === 0,
      validationErrors: errors,
    };
  }, [
    patientData.firstName,
    patientData.address,
    medicineChargeItems,
    initialPatientData.medicineBillingEnabled,
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

    // Check if room is required
    if (financialData.seatRent > 0 && !admissionInfo.seatNumber) {
      showNotification(
        "Please enter room/seat number when charging seat rent",
        "error"
      );
      return;
    }

    if (canEditDoctorReassignment && !doctorData.id) {
      showNotification("Please select a doctor", "error");
      return;
    }

    editAdmission({
      id: initialPatientData.id,
      patient: {
        id: initialPatientData.patientId,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        fullName: `${patientData.firstName} ${
          patientData.lastName || ""
        }`.trim(),
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
      status: admissionInfo.status,
      seatNumber: admissionInfo.seatNumber,
      ward: admissionInfo.ward,
      diagnosis: admissionInfo.diagnosis,
      treatment: admissionInfo.treatment,
      otType: admissionInfo.otType,
      remarks: admissionInfo.remarks,
      serviceCharge: financialData.serviceCharge,
      seatRent: financialData.seatRent,
      otCharge: financialData.otCharge,
      doctorCharge: financialData.doctorCharge,
      surgeonCharge: financialData.surgeonCharge,
      anesthesiaFee: financialData.anesthesiaFee,
      assistantDoctorFee: financialData.assistantDoctorFee,
      ...(initialPatientData.medicineBillingEnabled
        ? { medicineCharge: financialData.medicineCharge }
        : {}),
      otherCharges: financialData.otherCharges,
      discountType: financialData.discountType,
      discountValue: financialData.discountValue,
      discountAmount: financialData.discountAmount,
      paidAmount: financialData.paidAmount,
      chiefComplaint: admissionInfo.chiefComplaint,
      isDischarged: admissionInfo.status === "Discharged",
      medicineChargeItems:
        medicineChargeItems.length > 0 ? medicineChargeItems : [],
      ...(canEditDoctorReassignment && doctorData.id
        ? { doctorId: doctorData.id }
        : {}),
    });
  }, [
    isFormValid,
    isSubmitting,
    admissionInfo,
    financialData,
    medicineChargeItems,
    editAdmission,
    initialPatientData.id,
    initialPatientData.patientId,
    initialPatientData.medicineBillingEnabled,
    patientData,
    canEditDoctorReassignment,
    doctorData.id,
    doctorData.fullName,
    showNotification,
    validationErrors,
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
      label: "Patient",
      icon: User,
      color: "indigo",
    },
    {
      id: "status",
      label: "Status & Room",
      icon: Activity,
      color: "amber",
    },
    {
      id: "medicines",
      label: "Medicines",
      icon: Pill,
      color: "emerald",
    },
    {
      id: "financial",
      label: "Financial",
      icon: Wallet,
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
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-[80%] h-[95%] sm:h-[90%] popup-content flex flex-col"
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
              icon={Activity}
              iconColor="blue"
              title={`Edit Admission: ${initialPatientData.admissionNumber}`}
              subtitle={`Patient: ${initialPatientData.patientFullName} | Department: ${initialPatientData.departmentName}`}
              onClose={handleClose}
              isDisabled={isSubmitting}
            >
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm cursor-pointer ${getTabColors(
                        section.color,
                        isActive
                      )} ${
                        isActive ? "transform scale-105" : "hover:shadow-md"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
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
                  <AdmissionPatientInformation />
                </div>
                <div id="department">
                  <DepartmentSelection
                    readonly
                    allowEditComplaint
                    allowDoctorEdit={canEditDoctorReassignment}
                  />
                </div>
                <div id="status">
                  <AdmissionStatusSection />
                </div>
                <div id="medicines">
                  <MedicineInformation
                    medicineBillingEnabled={
                      initialPatientData.medicineBillingEnabled
                    }
                  />
                </div>
                <div id="financial">
                  <FinancialInformation
                    medicineBillingEnabled={
                      initialPatientData.medicineBillingEnabled
                    }
                  />
                </div>
              </div>
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={false}
              cancelText="Cancel"
              submitText="Update Admission"
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

export default EditDataAdmission;
