/**
 * Archive Staff Modal
 * Confirmation dialog for archiving/unarchiving standalone staff members
 */

"use client";

import React, { useCallback, useRef, useEffect } from "react";
import { Archive, ArchiveRestore, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { useArchiveStaffData } from "../../hooks";
import type { StaffRecord } from "../../types";

interface ArchiveStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffRecord | null;
}

const ArchiveStaffModal: React.FC<ArchiveStaffModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const isArchiving = staff?.isActive === true; // true = currently active, so we're archiving

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

  const { archiveStaff, isLoading } = useArchiveStaffData({
    onSuccess: () => onClose(),
  });

  const handleConfirm = useCallback(() => {
    if (isLoading || !staff) return;
    archiveStaff({ id: staff.id, isActive: !staff.isActive });
  }, [isLoading, staff, archiveStaff]);

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
              icon={isArchiving ? Archive : ArchiveRestore}
              iconColor={isArchiving ? "red" : "green"}
              title={isArchiving ? "Archive Staff Member" : "Unarchive Staff Member"}
              subtitle={staff.fullName}
              onClose={handleClose}
              isDisabled={isLoading}
            />
            <div className="p-4 sm:p-6">
              <div
                className={`p-4 rounded-xl border ${isArchiving ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${isArchiving ? "text-red-500" : "text-green-500"}`}
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold mb-1 ${isArchiving ? "text-red-900" : "text-green-900"}`}
                    >
                      {isArchiving
                        ? "This staff member will be deactivated"
                        : "This staff member will be reactivated"}
                    </p>
                    <p
                      className={`text-xs ${isArchiving ? "text-red-700" : "text-green-700"} leading-relaxed`}
                    >
                      {isArchiving
                        ? `"${staff.fullName}" will no longer appear in selection dropdowns for new admissions, tests, or chamber appointments. All historical records will remain safe and intact.`
                        : `"${staff.fullName}" will be restored to active status and will appear again in selection dropdowns across the system.`}
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
                  className={`px-4 md:px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-xs sm:text-sm font-medium cursor-pointer ${isArchiving ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                >
                  {isLoading ? (
                    <span>
                      {isArchiving ? "Archiving..." : "Unarchiving..."}
                    </span>
                  ) : (
                    <>
                      {isArchiving ? (
                        <Archive className="w-4 h-4" />
                      ) : (
                        <ArchiveRestore className="w-4 h-4" />
                      )}
                      <span>{isArchiving ? "Archive" : "Unarchive"}</span>
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

export default ArchiveStaffModal;
