"use client";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { Save, Building2, User, Activity, Wallet } from "lucide-react";
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
  AdmissionHospitalInformation,
  AdmissionPatientInformation,
  DepartmentSelection,
  AdmissionStatusSection,
  FinancialInformation,
} from "../form-section";
import {
  useAdmissionHospitalData,
  useAdmissionPatientData,
  useAdmissionInfo,
  useAdmissionFinancialData,
  useAdmissionActions,
} from "../../stores";
import { useAdmissionScrollSpy } from "../../hooks";
import { useEditAdmissionData } from "../../hooks/useEditAdmissionData";
import { useNotification } from "@/hooks/useNotification";
import { AdmissionPatientData } from "../../types";

interface EditDataProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: AdmissionPatientData;
}

const SECTION_IDS = ["hospital", "patient", "status", "financial"];

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
    amber: {
      active: "bg-amber-600 text-white shadow-lg",
      inactive: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    },
    green: {
      active: "bg-green-600 text-white shadow-lg",
      inactive: "bg-green-100 text-green-700 hover:bg-green-200",
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

  // Store access
  const hospitalData = useAdmissionHospitalData();
  const patientData = useAdmissionPatientData();
  const admissionInfo = useAdmissionInfo();
  const financialData = useAdmissionFinancialData();
  const { initializeFormForEdit, resetForm, afterEditModalClosed } =
    useAdmissionActions();

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
    onSuccess: () => {
      // Auto-print invoice after successful update
      const invoiceData = {
        id: initialPatientData.id,
        admissionNumber: initialPatientData.admissionNumber,
        patientFullName: `${patientData.firstName} ${
          patientData.lastName || ""
        }`.trim(),
        patientGender: patientData.gender,
        patientAge: patientData.age,
        patientPhone: patientData.phoneNumber,
        patientAddress: patientData.address,
        departmentName: initialPatientData.departmentName,
        doctorName: initialPatientData.doctorName,
        hospitalName: hospitalData.name,
        seatNumber: admissionInfo.seatNumber,
        ward: admissionInfo.ward,
        status: admissionInfo.status,
        dateAdmitted: initialPatientData.dateAdmitted,
        dateDischarged: initialPatientData.dateDischarged,
        admissionFee: financialData.admissionFee,
        serviceCharge: financialData.serviceCharge,
        seatRent: financialData.seatRent,
        otCharge: financialData.otCharge,
        doctorCharge: financialData.doctorCharge || 0,
        surgeonCharge: financialData.surgeonCharge || 0,
        anesthesiaFee: financialData.anesthesiaFee || 0,
        assistantDoctorFee: financialData.assistantDoctorFee || 0,
        medicineCharge: financialData.medicineCharge,
        otherCharges: financialData.otherCharges,
        totalAmount: financialData.totalAmount,
        discountType: financialData.discountType,
        discountValue: financialData.discountValue,
        discountAmount: financialData.discountAmount,
        grandTotal: financialData.grandTotal,
        paidAmount: financialData.paidAmount,
        dueAmount: financialData.dueAmount,
        remarks: admissionInfo.remarks,
        chiefComplaint: admissionInfo.chiefComplaint,
      };

      // Dynamically import and generate invoice
      import("../../utils/generateReceipt").then(
        ({ generateAdmissionInvoice }) => {
          setTimeout(() => {
            generateAdmissionInvoice(
              invoiceData as any,
              user?.fullName || "Staff"
            );
          }, 300);
        }
      );

      onClose();
    },
  });

  // Validation
  const isFormValid = useMemo(() => {
    return (
      hospitalData.name.trim() !== "" && patientData.firstName.trim() !== ""
    );
  }, [hospitalData.name, patientData.firstName]);

  const { showNotification } = useNotification();

  // Handlers
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (!isFormValid || isSubmitting) return;

    // Check if room is required
    if (financialData.seatRent > 0 && !admissionInfo.seatNumber) {
      showNotification(
        "Please enter room/seat number when charging seat rent",
        "error"
      );
      return;
    }

    editAdmission({
      id: initialPatientData.id,
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
      medicineCharge: financialData.medicineCharge,
      otherCharges: financialData.otherCharges,
      discountType: financialData.discountType,
      discountValue: financialData.discountValue,
      discountAmount: financialData.discountAmount,
      paidAmount: financialData.paidAmount,
      chiefComplaint: admissionInfo.chiefComplaint,
      isDischarged: admissionInfo.status === "Discharged",
    });
  }, [
    isFormValid,
    isSubmitting,
    admissionInfo,
    financialData,
    editAdmission,
    initialPatientData.id,
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
      label: "Hospital",
      icon: Building2,
      color: "blue",
    },
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
                <div id="hospital">
                  <AdmissionHospitalInformation readonly />
                </div>
                <div id="patient">
                  <AdmissionPatientInformation />
                </div>
                <div id="department">
                  <DepartmentSelection readonly allowEditComplaint />
                </div>
                <div id="status">
                  <AdmissionStatusSection />
                </div>
                <div id="financial">
                  <FinancialInformation />
                </div>
              </div>
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={!isFormValid}
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
