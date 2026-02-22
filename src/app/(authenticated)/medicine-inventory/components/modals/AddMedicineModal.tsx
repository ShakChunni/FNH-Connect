/**
 * Add Medicine Modal
 * Full modal for adding a new medicine to the inventory
 */

"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import { Save, Pill, Layers, AlertTriangle, ChevronDown } from "lucide-react";
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
import { useAddMedicineData, useAddGroupData } from "../../hooks";
import { useUIStore } from "../../stores";
import { GroupSearch } from "../shared";
import type { MedicineGroup } from "../../types";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (medicine: { id: number; genericName: string }) => void;
}

// Dosage form options
const DOSAGE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Suspension",
  "Injection",
  "Cream",
  "Ointment",
  "Drops",
  "Inhaler",
  "Powder",
  "Gel",
  "Suppository",
];

const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Form state
  const [genericName, setGenericName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [groupId, setGroupId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState("");
  const [strength, setStrength] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [defaultSalePrice, setDefaultSalePrice] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // For dosage form dropdown
  const [isDosageOpen, setIsDosageOpen] = useState(false);
  const dosageBtnRef = useRef<HTMLButtonElement>(null);

  // For inline group creation
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // UI Store for nested modals
  const { openModal: openUIModal } = useUIStore();

  // Notification
  const { showNotification } = useNotification();

  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      // Reset form
      setGenericName("");
      setBrandName("");
      setGroupId(null);
      setGroupName("");
      setStrength("");
      setDosageForm("");
      setDefaultSalePrice(0);
      setLowStockThreshold(10);
      setIsAddingGroup(false);
      setNewGroupName("");
      setIsDosageOpen(false);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen]);

  // Mutation for adding medicine
  const { addMedicine, isLoading: isSubmitting } = useAddMedicineData({
    onSuccess: (medicine) => {
      onSuccess?.({ id: medicine.id, genericName: medicine.genericName });
      onClose();
    },
  });

  // Mutation for adding group inline
  const { addGroup, isLoading: isAddingGroupLoading } = useAddGroupData({
    onSuccess: (group) => {
      setGroupId(group.id);
      setGroupName(group.name);
      setIsAddingGroup(false);
      setNewGroupName("");
    },
    showSuccessNotification: true,
  });

  // Validation
  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!genericName.trim()) {
      errors.push("Generic name is required");
    }
    if (!groupId) {
      errors.push("Group is required");
    }
    if (defaultSalePrice < 0) {
      errors.push("Default sale price cannot be negative");
    }
    if (lowStockThreshold < 0) {
      errors.push("Low stock threshold must be positive");
    }

    return {
      isFormValid: errors.length === 0,
      validationErrors: errors,
    };
  }, [genericName, groupId, defaultSalePrice, lowStockThreshold]);

  // Handlers
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;

    if (!isFormValid) {
      const errorMessage =
        validationErrors.length === 1
          ? validationErrors[0]
          : `Please fix the following: ${validationErrors.join(", ")}`;
      showNotification(errorMessage, "error");
      return;
    }

    addMedicine({
      genericName: genericName.trim(),
      brandName: brandName.trim() || undefined,
      groupId: groupId!,
      strength: strength.trim() || undefined,
      dosageForm: dosageForm || undefined,
      defaultSalePrice,
      lowStockThreshold,
    });
  }, [
    isSubmitting,
    isFormValid,
    genericName,
    brandName,
    groupId,
    strength,
    dosageForm,
    defaultSalePrice,
    lowStockThreshold,
    addMedicine,
    validationErrors,
    showNotification,
  ]);

  // Keyboard handling
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

  // Group selection handler
  const handleGroupChange = useCallback((group: MedicineGroup | null) => {
    if (group) {
      setGroupId(group.id);
      setGroupName(group.name);
    } else {
      setGroupId(null);
      setGroupName("");
    }
  }, []);

  // Add new group inline
  const handleAddNewGroup = useCallback((name: string) => {
    setNewGroupName(name);
    setIsAddingGroup(true);
  }, []);

  const handleConfirmAddGroup = useCallback(() => {
    if (newGroupName.trim()) {
      addGroup({ name: newGroupName.trim() });
    }
  }, [newGroupName, addGroup]);

  const handleCancelAddGroup = useCallback(() => {
    setIsAddingGroup(false);
    setNewGroupName("");
  }, []);

  // Common input class
  const getInputClass = (hasValue: boolean, hasError: boolean = false) => {
    const base =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";

    if (hasError) {
      return `${base} bg-red-50 border-2 border-red-500`;
    }

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
          style={{
            isolation: "isolate",
            willChange: "opacity",
            backfaceVisibility: "hidden",
            perspective: 1000,
          }}
        >
          <motion.div
            ref={popupRef}
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[60%] lg:max-w-[50%] xl:max-w-[45%] h-auto max-h-[95%] sm:max-h-[90%] popup-content flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
            }}
          >
            <ModalHeader
              icon={Pill}
              iconColor="blue"
              title="Add Medicine"
              subtitle="Add a new medicine to the inventory"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6"
            >
              <div className="space-y-6">
                {/* Medicine Details Section */}
                <div className="bg-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Pill className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900">
                      Medicine Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Generic Name */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Generic Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genericName}
                        onChange={(e) => setGenericName(e.target.value)}
                        placeholder="e.g., Cefixime, Paracetamol"
                        className={getInputClass(!!genericName)}
                      />
                    </div>

                    {/* Brand Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Optional brand name"
                        className={getInputClass(!!brandName)}
                      />
                    </div>

                    {/* Strength */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Strength
                      </label>
                      <input
                        type="text"
                        value={strength}
                        onChange={(e) => setStrength(e.target.value)}
                        placeholder="e.g., 500mg, 10ml"
                        className={getInputClass(!!strength)}
                      />
                    </div>
                  </div>
                </div>

                {/* Group and Dosage Section */}
                <div className="bg-purple-50/50 rounded-2xl p-4 sm:p-5 border border-purple-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Layers className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-bold text-purple-900">
                      Classification
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Group Search */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Group / Category <span className="text-red-500">*</span>
                      </label>
                      {!isAddingGroup ? (
                        <GroupSearch
                          value={groupId}
                          displayValue={groupName}
                          onChange={handleGroupChange}
                          onAddNew={handleAddNewGroup}
                          placeholder="Search or add group..."
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-3 bg-purple-100 rounded-lg border-2 border-purple-300">
                            <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="text-sm font-medium text-purple-800 flex-1 truncate">
                              &quot;{newGroupName}&quot;
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleConfirmAddGroup}
                              disabled={isAddingGroupLoading}
                              className="flex-1 px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isAddingGroupLoading
                                ? "Adding..."
                                : "Create Group"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelAddGroup}
                              disabled={isAddingGroupLoading}
                              className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dosage Form */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Dosage Form
                      </label>
                      <button
                        ref={dosageBtnRef}
                        type="button"
                        onClick={() => setIsDosageOpen(!isDosageOpen)}
                        className={`${getInputClass(!!dosageForm)} flex justify-between items-center`}
                      >
                        <span
                          className={`${
                            dosageForm
                              ? "text-gray-700 font-normal"
                              : "text-gray-400 font-light"
                          } text-xs sm:text-sm`}
                        >
                          {dosageForm || "Select form..."}
                        </span>
                        <ChevronDown
                          className={`transition-transform duration-200 text-gray-400 ${
                            isDosageOpen ? "rotate-180" : ""
                          }`}
                          size={16}
                        />
                      </button>
                      <DropdownPortal
                        isOpen={isDosageOpen}
                        onClose={() => setIsDosageOpen(false)}
                        buttonRef={dosageBtnRef}
                      >
                        <div
                          className="overflow-y-auto p-2"
                          style={{
                            maxHeight:
                              typeof window !== "undefined" &&
                              window.innerWidth < 640
                                ? "220px"
                                : "280px",
                          }}
                        >
                          {DOSAGE_FORMS.map((form) => (
                            <div
                              key={form}
                              onClick={() => {
                                setDosageForm(form);
                                setIsDosageOpen(false);
                              }}
                              className={`cursor-pointer px-4 py-3 transition-colors duration-200 rounded-md mx-1 ${
                                dosageForm === form
                                  ? "bg-blue-900 text-white"
                                  : "hover:bg-blue-900 hover:text-white"
                              }`}
                            >
                              <span className="text-xs sm:text-sm">{form}</span>
                            </div>
                          ))}
                        </div>
                      </DropdownPortal>
                    </div>
                  </div>
                </div>

                {/* Stock Settings Section */}
                <div className="bg-amber-50/50 rounded-2xl p-4 sm:p-5 border border-amber-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Stock Settings
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Default Sale Price */}
                    <div className="max-w-xs">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Default Sale Price (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={defaultSalePrice || ""}
                        onChange={(e) =>
                          setDefaultSalePrice(parseFloat(e.target.value) || 0)
                        }
                        placeholder="e.g., 50"
                        className={getInputClass(defaultSalePrice > 0)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-fills sale price in Record Sale (editable there)
                      </p>
                    </div>

                    {/* Low Stock Threshold */}
                    <div className="max-w-xs">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={lowStockThreshold}
                        onChange={(e) =>
                          setLowStockThreshold(parseInt(e.target.value) || 0)
                        }
                        placeholder="Alert when stock falls below this"
                        className={getInputClass(lowStockThreshold > 0)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You&apos;ll be alerted when stock falls below this
                        number
                      </p>
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
              submitText="Add Medicine"
              loadingText="Adding..."
              submitIcon={Save}
              theme="blue"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddMedicineModal;
