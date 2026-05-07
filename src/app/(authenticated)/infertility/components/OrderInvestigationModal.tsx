"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Beaker, Save } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { useNotification } from "@/hooks/useNotification";
import { InvestigationInformation } from "./form-sections/InvestigationInformation";
import { InfertilityPatientData } from "../types";
import { useInfertilityTestFormStore } from "../stores/testFormStore";
import { useAddInfertilityTest } from "../hooks/useAddInfertilityTest";
import { useUpdateInfertilityPatientStatus } from "../hooks/useUpdateInfertilityPatientStatus";

interface OrderInvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: InfertilityPatientData | null;
}

export const OrderInvestigationModal: React.FC<OrderInvestigationModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();

  const testInfo = useInfertilityTestFormStore((state) => state.testInfo);
  const resetTestForm = useInfertilityTestFormStore((state) => state.resetForm);

  const { addTestAsync, isLoading: isSubmitting } = useAddInfertilityTest();
  const { updateStatusAsync } = useUpdateInfertilityPatientStatus();

  const isFormValid = useMemo(
    () =>
      testInfo.selectedTests.length > 0 &&
      !!testInfo.orderedById &&
      testInfo.subjectType !== "UNKNOWN",
    [testInfo.selectedTests.length, testInfo.orderedById, testInfo.subjectType]
  );

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    resetTestForm();
    onClose();
  }, [isSubmitting, onClose, resetTestForm]);

  const handleSubmit = useCallback(async () => {
    if (!patient) {
      showNotification("No patient selected for investigation", "error");
      return;
    }

    if (!isFormValid) {
      showNotification(
        "Please select at least one investigation, an ordering doctor, and a valid investigation subject",
        "error"
      );
      return;
    }

    if (testInfo.subjectType === "UNKNOWN") {
      showNotification(
        "Choose Patient or Spouse before saving this investigation",
        "error",
      );
      return;
    }

    try {
      await addTestAsync({
        infertilityPatientId: patient.id,
        subjectType: testInfo.subjectType,
        subjectNameSnapshot: testInfo.subjectNameSnapshot || null,
        selectedTests: testInfo.selectedTests,
        testCharge: testInfo.testCharge,
        discountType: testInfo.discountType,
        discountValue: testInfo.discountValue,
        discountAmount: testInfo.discountAmount || 0,
        grandTotal: testInfo.grandTotal,
        paidAmount: testInfo.paidAmount,
        dueAmount: testInfo.dueAmount,
        orderedById: testInfo.orderedById || 0,
        doneById: testInfo.doneById || null,
        remarks: testInfo.remarks || "",
        testDate: testInfo.testDate || undefined,
        isCompleted: testInfo.isCompleted,
      });

      try {
        await updateStatusAsync({
          id: patient.id,
          status: "Investigation Ordered",
        });
      } catch {
        // Status update failure is already surfaced by the hook notification.
      }

      handleClose();
    } catch {
      // Errors are surfaced by mutation hooks.
    }
  }, [
    patient,
    isFormValid,
    addTestAsync,
    testInfo,
    updateStatusAsync,
    handleClose,
    showNotification,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    resetTestForm();
  }, [isOpen, resetTestForm]);

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

  if (!patient) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-[95%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] h-[90%] rounded-3xl overflow-hidden flex flex-col"
    >
      <div ref={popupRef} className="flex h-full flex-col">
        <ModalHeader
          icon={Beaker}
          iconColor="green"
          title="Order Investigation"
          subtitle={`Create investigation order for ${patient.patientFullName}`}
          onClose={handleClose}
          isDisabled={isSubmitting}
        />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Patient Name
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {patient.patientFullName}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Case Number
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {patient.caseNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Status
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {patient.status || "Active"}
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
          isDisabled={!isFormValid}
          cancelText="Cancel"
          submitText="Order Investigation"
          loadingText="Ordering..."
          submitIcon={Save}
          theme="green"
        />
      </div>
    </ModalShell>
  );
};

export default OrderInvestigationModal;
