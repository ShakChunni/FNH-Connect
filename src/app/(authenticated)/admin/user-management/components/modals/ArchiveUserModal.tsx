/**
 * Archive User Modal
 * Confirmation dialog for archiving/unarchiving users
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
import { useArchiveUserData } from "../../hooks";
import type { UserWithStaff } from "../../types";

interface ArchiveUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithStaff | null;
}

const ArchiveUserModal: React.FC<ArchiveUserModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const isArchiving = user?.isActive === true; // true = currently active, so we're archiving

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

  const { archiveUser, isLoading } = useArchiveUserData({
    onSuccess: () => onClose(),
  });

  const handleConfirm = useCallback(() => {
    if (isLoading || !user) return;
    archiveUser({ id: user.id, isActive: !user.isActive });
  }, [isLoading, user, archiveUser]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, handleClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && user && (
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
              title={isArchiving ? "Archive User" : "Unarchive User"}
              subtitle={user.staff.fullName}
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
                        ? "This user will lose access"
                        : "This user will regain access"}
                    </p>
                    <p
                      className={`text-xs ${isArchiving ? "text-red-700" : "text-green-700"}`}
                    >
                      {isArchiving
                        ? `"${user.username}" will no longer be able to log in to the system. All active sessions will be terminated.`
                        : `"${user.username}" will be able to log in again with their existing credentials.`}
                    </p>
                  </div>
                </div>
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

export default ArchiveUserModal;
