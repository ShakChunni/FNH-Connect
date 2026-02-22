/**
 * Add Staff Modal
 * Modal for creating standalone staff records (no login account)
 */

"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import { Save, Users, ChevronDown } from "lucide-react";
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
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { useAddStaffData } from "../../hooks";
import { STAFF_ROLES } from "../../types";
import { cn } from "@/lib/utils";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddStaffModal: React.FC<AddStaffModalProps> = ({ isOpen, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const [staffRoleOpen, setStaffRoleOpen] = useState(false);
  const staffRoleBtnRef = useRef<HTMLButtonElement>(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      setFirstName("");
      setLastName("");
      setStaffRole("");
      setSpecialization("");
      setPhoneNumber("");
      setEmail("");
      setStaffRoleOpen(false);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen]);

  const { addStaff, isLoading: isSubmitting } = useAddStaffData({
    onSuccess: () => {
      onClose();
    },
  });

  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];
    if (!firstName.trim()) errors.push("First name is required");
    if (!staffRole) errors.push("Role is required");
    return { isFormValid: errors.length === 0, validationErrors: errors };
  }, [firstName, staffRole]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;

    if (!isFormValid) {
      showNotification(
        validationErrors.length === 1
          ? validationErrors[0]
          : `Please fix: ${validationErrors.join(", ")}`,
        "error",
      );
      return;
    }

    addStaff({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      role: staffRole,
      specialization: specialization.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      email: email.trim() || undefined,
    });
  }, [
    isSubmitting,
    isFormValid,
    validationErrors,
    addStaff,
    firstName,
    lastName,
    staffRole,
    specialization,
    phoneNumber,
    email,
    showNotification,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  const getInputClass = (hasValue: boolean) => {
    const base =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";
    return hasValue
      ? `${base} bg-white border-2 border-green-600`
      : `${base} bg-white border-2 border-gray-300`;
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
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
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[50%] lg:max-w-[40%] h-auto max-h-[95%] sm:max-h-[90%] popup-content flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ModalHeader
              icon={Users}
              iconColor="indigo"
              title="Add Staff Member"
              subtitle="Create a staff record without login credentials"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                <div className="bg-indigo-50/50 rounded-2xl p-4 sm:p-5 border border-indigo-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g., John"
                        className={getInputClass(!!firstName)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g., Doe"
                        className={getInputClass(!!lastName)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <button
                        ref={staffRoleBtnRef}
                        type="button"
                        onClick={() => setStaffRoleOpen(!staffRoleOpen)}
                        className={`${getInputClass(!!staffRole)} flex justify-between items-center`}
                      >
                        <span
                          className={
                            staffRole
                              ? "text-gray-700 font-normal text-xs sm:text-sm"
                              : "text-gray-400 font-light text-xs sm:text-sm"
                          }
                        >
                          {staffRole || "Select role..."}
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-gray-400 transition-transform",
                            staffRoleOpen && "rotate-180",
                          )}
                        />
                      </button>
                      <DropdownPortal
                        isOpen={staffRoleOpen}
                        onClose={() => setStaffRoleOpen(false)}
                        buttonRef={staffRoleBtnRef}
                      >
                        <div className="overflow-y-auto p-2 max-h-64">
                          {STAFF_ROLES.map((sr) => (
                            <div
                              key={sr}
                              onClick={() => {
                                setStaffRole(sr);
                                setStaffRoleOpen(false);
                              }}
                              className={cn(
                                "cursor-pointer px-4 py-3 rounded-md text-xs sm:text-sm transition-colors",
                                staffRole === sr
                                  ? "bg-blue-900 text-white"
                                  : "hover:bg-blue-900 hover:text-white",
                              )}
                            >
                              {sr}
                            </div>
                          ))}
                        </div>
                      </DropdownPortal>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g., Cardiology"
                        className={getInputClass(!!specialization)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g., +880..."
                        className={getInputClass(!!phoneNumber)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., john@example.com"
                        className={getInputClass(!!email)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={false}
              cancelText="Cancel"
              submitText="Add Staff"
              loadingText="Adding..."
              submitIcon={Save}
              theme="indigo"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddStaffModal;
