"use client";

import React, { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useUpdatePathologyStatus } from "../../hooks";
import { generatePathologyReceipt } from "../../utils/generateReceipt";
import { useAuth } from "@/app/AuthContext";
import { useNotification } from "@/hooks/useNotification";
import { PathologyPatientData } from "../../types";

/**
 * Row actions shared by the desktop table row and the mobile patient card,
 * so both views use the same status toggle and receipt handlers.
 */
export function usePatientRowActions(row: PathologyPatientData) {
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  const { updateStatus, isUpdating } = useUpdatePathologyStatus();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const handleStatusToggle = () => {
    updateStatus(
      { id: row.id, isCompleted: !row.isCompleted },
      {
        onSuccess: () => {
          setShowStatusConfirm(false);
        },
      },
    );
  };

  const handleReceipt = () => {
    generatePathologyReceipt(row, user?.fullName || "Staff");
    showNotification("Generating receipt document...", "success");
  };

  return {
    showStatusConfirm,
    openStatusConfirm: () => setShowStatusConfirm(true),
    closeStatusConfirm: () => setShowStatusConfirm(false),
    isUpdating,
    handleStatusToggle,
    handleReceipt,
  };
}

interface PatientStatusConfirmProps {
  row: PathologyPatientData;
  isOpen: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const PatientStatusConfirm: React.FC<PatientStatusConfirmProps> = ({
  row,
  isOpen,
  isUpdating,
  onClose,
  onConfirm,
}) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    isLoading={isUpdating}
    title={row.isCompleted ? "Mark as Pending?" : "Mark as Completed?"}
    variant={row.isCompleted ? "warning" : "success"}
    confirmLabel={row.isCompleted ? "Mark Pending" : "Mark Completed"}
    cancelLabel="Cancel"
  >
    <p>
      Are you sure you want to change the status of test{" "}
      <strong>{row.testNumber}</strong> for patient{" "}
      <strong>{row.patientFullName}</strong> to{" "}
      <strong>{row.isCompleted ? "Pending" : "Completed"}</strong>?
    </p>
  </ConfirmModal>
);
