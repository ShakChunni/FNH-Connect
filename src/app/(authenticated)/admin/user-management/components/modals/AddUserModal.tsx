/**
 * Add User Modal
 * Modal for creating a new user — link existing staff or create new staff + user
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
  UserPlus,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
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
import { useAddUserData, useFetchAvailableStaff } from "../../hooks";
import { SYSTEM_ROLES, STAFF_ROLES } from "../../types";
import type { StaffRecord } from "../../types";
import { cn } from "@/lib/utils";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function generatePassword(length = 12): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Form state
  const [linkExisting, setLinkExisting] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffRecord | null>(null);
  const [staffSearchOpen, setStaffSearchOpen] = useState(false);
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const staffBtnRef = useRef<HTMLButtonElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(() => generatePassword());
  const [role, setRole] = useState("staff");
  const [staffRole, setStaffRole] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  // Dropdowns
  const [roleOpen, setRoleOpen] = useState(false);
  const roleBtnRef = useRef<HTMLButtonElement>(null);
  const [staffRoleOpen, setStaffRoleOpen] = useState(false);
  const staffRoleBtnRef = useRef<HTMLButtonElement>(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Success state to show generated password
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const { showNotification } = useNotification();

  // Fetch available staff
  const { data: availableStaff = [] } = useFetchAvailableStaff(
    staffSearchTerm || undefined,
  );

  // Body scroll
  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      // Reset form
      setLinkExisting(false);
      setSelectedStaff(null);
      setStaffSearchTerm("");
      setFirstName("");
      setLastName("");
      setUsername("");
      setPassword(generatePassword());
      setRole("staff");
      setStaffRole("");
      setSpecialization("");
      setPhoneNumber("");
      setEmail("");
      setCopied(false);
      setCreatedPassword(null);
      setRoleOpen(false);
      setStaffRoleOpen(false);
      setStaffSearchOpen(false);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen]);

  const { addUser, isLoading: isSubmitting } = useAddUserData({
    onSuccess: () => {
      setCreatedPassword(password);
    },
  });

  // Validation
  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (linkExisting) {
      if (!selectedStaff) errors.push("Please select a staff member");
    } else {
      if (!firstName.trim()) errors.push("First name is required");
    }

    if (!username.trim() || username.length < 3)
      errors.push("Username must be at least 3 characters");
    if (!/^[a-zA-Z0-9_-]+$/.test(username))
      errors.push(
        "Username can only contain letters, numbers, hyphens and underscores",
      );
    if (!password || password.length < 8)
      errors.push("Password must be at least 8 characters");

    return { isFormValid: errors.length === 0, validationErrors: errors };
  }, [linkExisting, selectedStaff, firstName, username, password]);

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

    addUser({
      ...(linkExisting && selectedStaff ? { staffId: selectedStaff.id } : {}),
      ...(!linkExisting
        ? { firstName: firstName.trim(), lastName: lastName.trim() }
        : {}),
      username: username.trim(),
      password,
      role: role as
        | "staff"
        | "admin"
        | "system-admin"
        | "receptionist"
        | "receptionist-infertility"
        | "medicine-pharmacist",
      ...(staffRole ? { staffRole } : {}),
      ...(specialization ? { specialization } : {}),
      ...(phoneNumber ? { phoneNumber } : {}),
      ...(email ? { email } : {}),
    });
  }, [
    isSubmitting,
    isFormValid,
    validationErrors,
    addUser,
    linkExisting,
    selectedStaff,
    firstName,
    lastName,
    username,
    password,
    role,
    staffRole,
    specialization,
    phoneNumber,
    email,
    showNotification,
  ]);

  const handleCopyPassword = useCallback(async () => {
    const pw = createdPassword || password;
    try {
      await navigator.clipboard.writeText(pw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showNotification("Failed to copy password", "error");
    }
  }, [createdPassword, password, showNotification]);

  // Keyboard
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

  const roleLabel = SYSTEM_ROLES.find((r) => r.value === role)?.label || role;

  // If creation was successful, show password copy screen
  if (createdPassword) {
    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-100000"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[45%] lg:max-w-[40%] p-6 sm:p-8"
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
                  User Created Successfully!
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Save these credentials — the password will not be shown again.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-left">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Username
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {username}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-left">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                      Password
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono font-bold text-amber-900 break-all">
                        {createdPassword}
                      </code>
                      <button
                        onClick={handleCopyPassword}
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
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[60%] lg:max-w-[50%] xl:max-w-[45%] h-auto max-h-[95%] sm:max-h-[90%] popup-content flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ModalHeader
              icon={UserPlus}
              iconColor="blue"
              title="Add User"
              subtitle="Create a new user account"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkExisting(false);
                      setSelectedStaff(null);
                    }}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                      !linkExisting
                        ? "bg-white text-blue-700 shadow-sm border border-blue-200"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    Create New Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkExisting(true)}
                    className={cn(
                      "flex-1 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                      linkExisting
                        ? "bg-white text-blue-700 shadow-sm border border-blue-200"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    Link Existing Staff
                  </button>
                </div>

                {/* Staff Selection / Creation */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 sm:p-5 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold text-indigo-900">
                      {linkExisting ? "Select Staff Member" : "Staff Details"}
                    </h3>
                  </div>

                  {linkExisting ? (
                    // Staff Dropdown
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Staff Member <span className="text-red-500">*</span>
                      </label>
                      <button
                        ref={staffBtnRef}
                        type="button"
                        onClick={() => setStaffSearchOpen(!staffSearchOpen)}
                        className={`${getInputClass(!!selectedStaff)} flex justify-between items-center`}
                      >
                        <span
                          className={
                            selectedStaff
                              ? "text-gray-700 font-normal text-xs sm:text-sm"
                              : "text-gray-400 font-light text-xs sm:text-sm"
                          }
                        >
                          {selectedStaff
                            ? `${selectedStaff.fullName} (${selectedStaff.role})`
                            : "Search staff members..."}
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-gray-400 transition-transform",
                            staffSearchOpen && "rotate-180",
                          )}
                        />
                      </button>
                      <DropdownPortal
                        isOpen={staffSearchOpen}
                        onClose={() => setStaffSearchOpen(false)}
                        buttonRef={staffBtnRef}
                      >
                        <div className="p-2">
                          <input
                            type="text"
                            value={staffSearchTerm}
                            onChange={(e) => setStaffSearchTerm(e.target.value)}
                            placeholder="Search by name..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            autoFocus
                          />
                          <div className="max-h-48 overflow-y-auto">
                            {availableStaff.length === 0 ? (
                              <p className="text-xs text-gray-500 px-3 py-2">
                                No available staff found
                              </p>
                            ) : (
                              availableStaff.map((staff) => (
                                <button
                                  key={staff.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedStaff(staff);
                                    setStaffSearchOpen(false);
                                    setStaffSearchTerm("");
                                    setStaffRole(staff.role);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-md text-xs sm:text-sm hover:bg-blue-50 transition-colors cursor-pointer",
                                    selectedStaff?.id === staff.id &&
                                      "bg-blue-900 text-white hover:bg-blue-900",
                                  )}
                                >
                                  <span className="font-medium">
                                    {staff.fullName}
                                  </span>
                                  <span className="text-gray-400 ml-1">
                                    ({staff.role})
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </DropdownPortal>
                    </div>
                  ) : (
                    // New Staff Fields
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
                    </div>
                  )}
                </div>

                {/* Credentials Section */}
                <div className="bg-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900">
                      Login Credentials
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g., john.doe"
                        className={getInputClass(
                          !!username && username.length >= 3,
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className={`flex-1 ${getInputClass(password.length >= 8)}`}
                        />
                        <button
                          type="button"
                          onClick={() => setPassword(generatePassword())}
                          className="px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Generate password"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Copy password"
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

                {/* Roles Section */}
                <div className="bg-purple-50/50 rounded-2xl p-4 sm:p-5 border border-purple-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-bold text-purple-900">Roles</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* System Role */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        System Role <span className="text-red-500">*</span>
                      </label>
                      <button
                        ref={roleBtnRef}
                        type="button"
                        onClick={() => setRoleOpen(!roleOpen)}
                        className={`${getInputClass(!!role)} flex justify-between items-center`}
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

                    {/* Staff Role */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Hospital/Staff Role
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
                  </div>
                </div>

                {/* Optional Details */}
                {!linkExisting && (
                  <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-sm font-bold text-gray-700">
                        Additional Details (Optional)
                      </h3>
                    </div>
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
                )}
              </div>
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={false}
              cancelText="Cancel"
              submitText="Create User"
              loadingText="Creating..."
              submitIcon={Save}
              theme="blue"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddUserModal;
