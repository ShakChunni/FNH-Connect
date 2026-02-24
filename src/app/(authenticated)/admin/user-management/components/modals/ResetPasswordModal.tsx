/**
 * Reset Password Modal
 * Modal for resetting a user's password
 */

"use client";

import React, { useCallback, useRef, useEffect, useState } from "react";
import { KeyRound, Copy, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { useNotification } from "@/hooks/useNotification";
import { useResetPasswordData } from "../../hooks";
import type { UserWithStaff } from "../../types";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithStaff | null;
}

function generatePassword(length = 12): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let pw = "";
  for (let i = 0; i < length; i++)
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  return pw;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [newPassword, setNewPassword] = useState(() => generatePassword());
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedPassword, setSavedPassword] = useState("");
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      setNewPassword(generatePassword());
      setCopied(false);
      setShowSuccess(false);
      setSavedPassword("");
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen]);

  const { resetPassword, isLoading } = useResetPasswordData({
    onSuccess: () => {
      setSavedPassword(newPassword);
      setShowSuccess(true);
    },
  });

  const handleSubmit = useCallback(() => {
    if (isLoading || !user) return;
    if (newPassword.length < 8) {
      showNotification("Password must be at least 8 characters", "error");
      return;
    }
    resetPassword({ id: user.id, newPassword });
  }, [isLoading, user, newPassword, resetPassword, showNotification]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        showSuccess ? savedPassword : newPassword,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showNotification("Failed to copy", "error");
    }
  }, [showSuccess, savedPassword, newPassword, showNotification]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, handleClose]);

  const inputCls = (v: boolean) => {
    const b =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm transition-all duration-300 text-xs sm:text-sm";
    return v
      ? `${b} bg-white border-2 border-green-600`
      : `${b} bg-white border-2 border-gray-300`;
  };

  if (showSuccess) {
    return (
      <AnimatePresence mode="wait">
        {isOpen && user && (
          <motion.div
            className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-100000"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[40%] p-6 sm:p-8"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Password Reset!
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  New password for <strong>{user.username}</strong>. Save it now
                  — it won&apos;t be shown again.
                </p>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-left mb-6">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                    New Password
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono font-bold text-amber-900 break-all">
                      {savedPassword}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

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
              icon={KeyRound}
              iconColor="red"
              title="Reset Password"
              subtitle={`For ${user.staff.fullName} (${user.username})`}
              onClose={handleClose}
              isDisabled={isLoading}
            />
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700">
                    All active sessions will be terminated. The user will need
                    to log in again with the new password.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className={`flex-1 ${inputCls(newPassword.length >= 8)}`}
                    />
                    <button
                      type="button"
                      onClick={() => setNewPassword(generatePassword())}
                      className="px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Generate"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Copy"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isLoading}
              cancelText="Cancel"
              submitText="Reset Password"
              loadingText="Resetting..."
              submitIcon={KeyRound}
              theme="red"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResetPasswordModal;
