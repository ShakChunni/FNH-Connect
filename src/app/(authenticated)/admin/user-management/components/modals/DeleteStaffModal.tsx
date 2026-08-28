/**
 * Delete Staff Modal
 * Confirmation dialog for permanently deleting standalone staff members
 */

"use client";

import React, { useCallback, useRef, useEffect } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { useDeleteStaffData } from "../../hooks";
import type { StaffRecord } from "../../types";

interface DeleteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffRecord | null;
}

const DeleteStaffModal: React.FC<DeleteStaffModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

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

  const { deleteStaff, isLoading } = useDeleteStaffData({
    onSuccess: () => onClose(),
  });

  const handleConfirm = useCallback(() => {
    if (isLoading || !staff) return;
    deleteStaff(staff.id);
  }, [isLoading, staff, deleteStaff]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && staff && (
        <motion.div
          className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-100000"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ isolation: "isolate" }}
        >
          <motion.div
            ref={popupRef}
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[40%] lg:max-w-[35%] popup-content flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ModalHeader
              icon={Trash2}
              iconColor="red"
              title="Delete Staff Member"
              subtitle={staff.fullName}
              onClose={handleClose}
              isDisabled={isLoading}
            />
            <div className="p-4 sm:p-6">
              <div className="p-4 rounded-xl border bg-red-50 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold mb-1 text-red-900">
                      Permanent Deletion
                    </p>
                    <p className="text-xs text-red-700 leading-relaxed">
                      Are you sure you want to delete{" "}
                      <span className="font-bold">&quot;{staff.fullName}&quot;</span>?
                      This action cannot be undone. Staff members associated with
                      active or historical records (e.g. admissions, tests, shifts,
                      or payments) cannot be deleted and should be deactivated instead.
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff Details Summary */}
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5 text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-500">Role:</span>
                  <span className="font-semibold text-gray-800">{staff.role}</span>
                </div>
                {staff.specialization && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Specialization:</span>
                    <span className="font-semibold text-gray-800">
                      {staff.specialization}
                    </span>
                  </div>
                )}
                {staff.phoneNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Phone:</span>
                    <span className="font-semibold text-gray-800">
                      {staff.phoneNumber}
                    </span>
                  </div>
                )}
                {staff.email && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Email:</span>
                    <span className="font-semibold text-gray-800">
                      {staff.email}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-4 md:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 text-xs sm:text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="px-4 md:px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-xs sm:text-sm font-medium cursor-pointer shadow-sm"
                >
                  {isLoading ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Staff</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteStaffModal;
