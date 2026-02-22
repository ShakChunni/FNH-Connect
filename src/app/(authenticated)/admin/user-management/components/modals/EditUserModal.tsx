/**
 * Edit User Modal
 * Modal for editing user role and staff details
 */

"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import { Save, Edit3, ChevronDown } from "lucide-react";
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
import { useUpdateUserData } from "../../hooks";
import { SYSTEM_ROLES, STAFF_ROLES } from "../../types";
import type { UserWithStaff } from "../../types";
import { cn } from "@/lib/utils";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithStaff | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const roleBtnRef = useRef<HTMLButtonElement>(null);
  const [staffRoleOpen, setStaffRoleOpen] = useState(false);
  const staffRoleBtnRef = useRef<HTMLButtonElement>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen && user) {
      preserveLockBodyScroll();
      setRole(user.role);
      setStaffRole(user.staff.role);
      setSpecialization(user.staff.specialization || "");
      setPhoneNumber(user.staff.phoneNumber || "");
      setEmail(user.staff.email || "");
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, user]);

  const { updateUser, isLoading: isSubmitting } = useUpdateUserData({
    onSuccess: () => onClose(),
  });

  const isFormValid = useMemo(() => !!role, [role]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting || !user) return;
    if (!isFormValid) {
      showNotification("System role is required", "error");
      return;
    }
    updateUser({
      id: user.id,
      data: {
        role: role as
          | "staff"
          | "admin"
          | "system-admin"
          | "receptionist"
          | "receptionist-infertility"
          | "medicine-pharmacist",
        staffRole: staffRole || undefined,
        specialization: specialization.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
      },
    });
  }, [
    isSubmitting,
    user,
    isFormValid,
    updateUser,
    role,
    staffRole,
    specialization,
    phoneNumber,
    email,
    showNotification,
  ]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, handleClose]);

  const inputCls = (v: boolean) => {
    const b =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";
    return v
      ? `${b} bg-white border-2 border-green-600`
      : `${b} bg-white border-2 border-gray-300`;
  };

  const roleLabel = SYSTEM_ROLES.find((r) => r.value === role)?.label || role;
  if (!user) return null;

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
              icon={Edit3}
              iconColor="purple"
              title="Edit User"
              subtitle={`Editing ${user.staff.fullName}`}
              onClose={handleClose}
              isDisabled={isSubmitting}
            />
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Read-only info */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        Username (read-only)
                      </label>
                      <input
                        type="text"
                        value={user.username}
                        disabled
                        className="text-gray-500 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full bg-gray-100 border-2 border-gray-200 text-xs sm:text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        Name (read-only)
                      </label>
                      <input
                        type="text"
                        value={user.staff.fullName}
                        disabled
                        className="text-gray-500 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full bg-gray-100 border-2 border-gray-200 text-xs sm:text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
                {/* Roles */}
                <div className="bg-purple-50/50 rounded-2xl p-4 sm:p-5 border border-purple-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Edit3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-bold text-purple-900">Roles</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        System Role <span className="text-red-500">*</span>
                      </label>
                      <button
                        ref={roleBtnRef}
                        type="button"
                        onClick={() => setRoleOpen(!roleOpen)}
                        className={`${inputCls(!!role)} flex justify-between items-center`}
                      >
                        <span className="text-gray-700 font-normal text-xs sm:text-sm">
                          {roleLabel}
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-gray-400 transition-transform",
                            roleOpen && "rotate-180",
                          )}
                        />
                      </button>
                      <DropdownPortal
                        isOpen={roleOpen}
                        onClose={() => setRoleOpen(false)}
                        buttonRef={roleBtnRef}
                      >
                        <div className="overflow-y-auto p-2 max-h-64">
                          {SYSTEM_ROLES.map((r) => (
                            <div
                              key={r.value}
                              onClick={() => {
                                setRole(r.value);
                                setRoleOpen(false);
                              }}
                              className={cn(
                                "cursor-pointer px-4 py-3 rounded-md text-xs sm:text-sm transition-colors",
                                role === r.value
                                  ? "bg-blue-900 text-white"
                                  : "hover:bg-blue-900 hover:text-white",
                              )}
                            >
                              {r.label}
                            </div>
                          ))}
                        </div>
                      </DropdownPortal>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Hospital/Staff Role
                      </label>
                      <button
                        ref={staffRoleBtnRef}
                        type="button"
                        onClick={() => setStaffRoleOpen(!staffRoleOpen)}
                        className={`${inputCls(!!staffRole)} flex justify-between items-center`}
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
                  </div>
                </div>
                {/* Optional Details */}
                <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">
                    Additional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g., Cardiology"
                        className={inputCls(!!specialization)}
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
                        className={inputCls(!!phoneNumber)}
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
                        className={inputCls(!!email)}
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
              submitText="Save Changes"
              loadingText="Saving..."
              submitIcon={Save}
              theme="purple"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditUserModal;
