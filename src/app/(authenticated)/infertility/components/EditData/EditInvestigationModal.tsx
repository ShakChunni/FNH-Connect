"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Save, Stethoscope, Beaker, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modalVariants, backdropVariants } from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { InvestigationInformation } from "../form-sections/InvestigationInformation";
import { useInfertilityTestFormStore } from "../../stores/testFormStore";
import { useEditInfertilityTest } from "../../hooks/useEditInfertilityTest";
import { InfertilityTestData } from "../../types";

interface EditInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigationData: InfertilityTestData;
}

export const EditInvestigationModal: React.FC<EditInvestigationModalProps> = ({
  isOpen,
  onClose,
  investigationData,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { initializeFormForEdit, resetForm, testInfo } = useInfertilityTestFormStore();
  const { editPatient: updateInvestigation, isPending: isSubmitting } = useEditInfertilityTest();

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && investigationData) {
      initializeFormForEdit(investigationData);
    }
  }, [isOpen, investigationData, initializeFormForEdit]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }, [isSubmitting, onClose, resetForm]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;

    updateInvestigation(
      {
        ...investigationData,
        testResults: { tests: testInfo.selectedTests },
        testCharge: testInfo.testCharge,
        discountType: testInfo.discountType,
        discountValue: testInfo.discountValue,
        discountAmount: testInfo.discountAmount || 0,
        grandTotal: testInfo.grandTotal,
        paidAmount: testInfo.paidAmount,
        dueAmount: testInfo.dueAmount,
        orderedById: testInfo.orderedById || 0,
        remarks: testInfo.remarks,
        isCompleted: testInfo.isCompleted,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  }, [isSubmitting, investigationData, testInfo, updateInvestigation, handleClose]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
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

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-100000"
          onClick={handleClose}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            ref={popupRef}
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] h-[90%] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <ModalHeader
              icon={Beaker}
              iconColor="green"
              title="Edit Investigation"
              subtitle={`Update details for investigation #${investigationData.testNumber}`}
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</p>
                    <p className="text-sm font-semibold text-slate-700">{investigationData.patientFullName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Case Number</p>
                    <p className="text-sm font-semibold text-slate-700">{investigationData.caseNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test Date</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {new Date(investigationData.testDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <InvestigationInformation />
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitText="Update Investigation"
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
