/**
 * Edit Staff Modal
 * Modal for editing standalone staff records (no login account)
 */

"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import {
  Save,
  Edit3,
  ChevronDown,
  User,
  Briefcase,
  Mail,
  Phone,
  Stethoscope,
} from "lucide-react";
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
import { useUpdateStaffData } from "../../hooks";
import { STAFF_ROLES } from "../../types";
import type { StaffRecord } from "../../types";
import { cn } from "@/lib/utils";

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffRecord | null;
}

interface FormErrors {
  firstName?: string;
  email?: string;
  general?: string;
}

const isValidEmail = (value: string) => {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const EditStaffModal: React.FC<EditStaffModalProps> = ({
  isOpen,
  onClose,
  staff,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  const [staffRoleOpen, setStaffRoleOpen] = useState(false);
  const staffRoleBtnRef = useRef<HTMLButtonElement>(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen && staff) {
      preserveLockBodyScroll();
      setFirstName(staff.firstName);
      setLastName(staff.lastName || "");
      setStaffRole(staff.role);
      setSpecialization(staff.specialization || "");
      setPhoneNumber(staff.phoneNumber || "");
      setEmail(staff.email || "");
      setIsActive(staff.isActive);
      setErrors({});
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, staff]);

  const { updateStaff, isLoading: isSubmitting } = useUpdateStaffData({
    onSuccess: () => onClose(),
  });

  const fullName = useMemo(() => {
    const f = firstName.trim();
    const l = lastName.trim();
    return l ? `${f} ${l}` : f;
  }, [firstName, lastName]);

  const validateForm = useCallback((): boolean => {
    const nextErrors: FormErrors = {};
    const trimmedFirstName = firstName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirstName) {
      nextErrors.firstName = "First name is required";
    } else if (trimmedFirstName.length > 100) {
      nextErrors.firstName = "First name must be 100 characters or less";
    }

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address";
    } else if (trimmedEmail.length > 200) {
      nextErrors.email = "Email must be 200 characters or less";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [firstName, email]);

  const hasChanges = useMemo(() => {
    if (!staff) return false;
    return (
      firstName.trim() !== staff.firstName ||
      lastName.trim() !== (staff.lastName || "") ||
      staffRole !== staff.role ||
      specialization.trim() !== (staff.specialization || "") ||
      phoneNumber.trim() !== (staff.phoneNumber || "") ||
      email.trim() !== (staff.email || "") ||
      isActive !== staff.isActive
    );
  }, [
    staff,
    firstName,
    lastName,
    staffRole,
    specialization,
    phoneNumber,
    email,
    isActive,
  ]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting || !staff) return;

    if (!validateForm()) {
      showNotification("Please fix the form errors", "error");
      return;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    const payload: {
      firstName?: string;
      lastName?: string;
      role?: string;
      specialization?: string;
      phoneNumber?: string;
      email?: string;
      isActive?: boolean;
    } = {};

    if (firstName.trim() !== staff.firstName)
      payload.firstName = firstName.trim();
    if (lastName.trim() !== (staff.lastName || ""))
      payload.lastName = lastName.trim();
    if (staffRole !== staff.role) payload.role = staffRole;
    if (specialization.trim() !== (staff.specialization || ""))
      payload.specialization = specialization.trim();
    if (phoneNumber.trim() !== (staff.phoneNumber || ""))
      payload.phoneNumber = phoneNumber.trim();
    if (email.trim() !== (staff.email || "")) payload.email = email.trim();
    if (isActive !== staff.isActive) payload.isActive = isActive;

    updateStaff({
      id: staff.id,
      data: payload,
    });
  }, [
    isSubmitting,
    staff,
    validateForm,
    hasChanges,
    updateStaff,
    firstName,
    lastName,
    staffRole,
    specialization,
    phoneNumber,
    email,
    isActive,
    showNotification,
    onClose,
  ]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, handleClose]);

  const inputCls = (hasValue: boolean, hasError?: boolean) => {
    const base =
      "text-gray-700 font-normal rounded-xl h-12 md:h-14 py-2 px-4 w-full focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    if (hasError) return `${base} bg-white border-2 border-rose-500`;
    return hasValue
      ? `${base} bg-white border-2 border-gray-300 focus:border-blue-900`
      : `${base} bg-white border-2 border-gray-300`;
  };

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
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[50%] lg:max-w-[40%] h-auto max-h-[95%] sm:max-h-[90%] popup-content flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ModalHeader
              icon={Edit3}
              iconColor="indigo"
              title="Edit Staff Member"
              subtitle={`Editing ${staff.fullName}`}
              onClose={handleClose}
              isDisabled={isSubmitting}
            />
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {errors.general && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 sm:text-sm">
                    {errors.general}
                  </div>
                )}

                {/* Identity Section */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 sm:p-5 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold text-indigo-900">
                      Identity
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        className={inputCls(!!firstName, !!errors.firstName)}
                      />
                      {errors.firstName && (
                        <p className="mt-1.5 text-xs font-semibold text-rose-600">
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        className={inputCls(!!lastName)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-2">
                        Full Name (auto-generated)
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        disabled
                        className="text-gray-500 font-normal rounded-xl h-12 md:h-14 py-2 px-4 w-full bg-gray-100 border-2 border-gray-200 text-xs sm:text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="bg-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900">Role</h3>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Hospital/Staff Role{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      ref={staffRoleBtnRef}
                      type="button"
                      onClick={() => setStaffRoleOpen(!staffRoleOpen)}
                      className={cn(
                        inputCls(!!staffRole),
                        "flex justify-between items-center",
                      )}
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
                                ? "bg-fnh-navy text-white"
                                : "hover:bg-fnh-navy hover:text-white",
                            )}
                          >
                            {sr}
                          </div>
                        ))}
                      </div>
                    </DropdownPortal>
                  </div>
                </div>

                {/* Contact & Professional Details */}
                <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-gray-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-700">
                      Contact & Professional Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Specialization
                      </label>
                      <div className="relative">
                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          placeholder="e.g., Cardiology"
                          className={cn(inputCls(!!specialization), "pl-10")}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g., +880..."
                          className={cn(inputCls(!!phoneNumber), "pl-10")}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g., john@example.com"
                          className={cn(
                            inputCls(!!email, !!errors.email),
                            "pl-10",
                          )}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1.5 text-xs font-semibold text-rose-600">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-700">
                        Active Status
                      </h3>
                      <p className="text-xs text-gray-500">
                        Inactive staff are hidden from daily operations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                        isActive ? "bg-green-500" : "bg-gray-300",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          isActive ? "translate-x-6" : "translate-x-1",
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={!hasChanges}
              cancelText="Cancel"
              submitText="Save Changes"
              loadingText="Saving..."
              submitIcon={Save}
              theme="indigo"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditStaffModal;
