/**
 * Edit Medicine Modal
 * Edit medicine details except stock quantities
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
import { useUpdateMedicineData } from "../../hooks";
import { GroupSearch } from "../shared";
import type { Medicine, MedicineGroup } from "../../types";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import NumberInput from "@/components/form-sections/Fields/NumberInput";

interface EditMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
}

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

const EditMedicineModal: React.FC<EditMedicineModalProps> = ({
  isOpen,
  onClose,
  medicine,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [genericName, setGenericName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [groupId, setGroupId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState("");
  const [strength, setStrength] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [defaultSalePrice, setDefaultSalePrice] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  const [isDosageOpen, setIsDosageOpen] = useState(false);
  const dosageBtnRef = useRef<HTMLButtonElement>(null);

  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      if (medicine) {
        setGenericName(medicine.genericName || "");
        setBrandName(medicine.brandName || "");
        setGroupId(medicine.group?.id || null);
        setGroupName(medicine.group?.name || "");
        setStrength(medicine.strength || "");
        setDosageForm(medicine.dosageForm || "");
        setDefaultSalePrice(medicine.defaultSalePrice || 0);
        setLowStockThreshold(medicine.lowStockThreshold || 10);
      }
      setIsDosageOpen(false);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, medicine]);

  const { updateMedicine, isLoading: isSubmitting } = useUpdateMedicineData({
    onSuccess: () => {
      onClose();
    },
  });

  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!medicine?.id) {
      errors.push("Invalid medicine selected");
    }
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
  }, [medicine?.id, genericName, groupId, defaultSalePrice, lowStockThreshold]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting || !medicine?.id) return;

    if (!isFormValid) {
      const errorMessage =
        validationErrors.length === 1
          ? validationErrors[0]
          : `Please fix the following: ${validationErrors.join(", ")}`;
      showNotification(errorMessage, "error");
      return;
    }

    updateMedicine({
      id: medicine.id,
      data: {
        genericName: genericName.trim(),
        brandName: brandName.trim() || undefined,
        groupId: groupId!,
        strength: strength.trim() || undefined,
        dosageForm: dosageForm || undefined,
        defaultSalePrice,
        lowStockThreshold,
      },
    });
  }, [
    isSubmitting,
    medicine?.id,
    isFormValid,
    validationErrors,
    showNotification,
    updateMedicine,
    genericName,
    brandName,
    groupId,
    strength,
    dosageForm,
    defaultSalePrice,
    lowStockThreshold,
  ]);

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

  const handleGroupChange = useCallback((group: MedicineGroup | null) => {
    if (group) {
      setGroupId(group.id);
      setGroupName(group.name);
    } else {
      setGroupId(null);
      setGroupName("");
    }
  }, []);

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
      {isOpen && medicine && (
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
              title="Edit Medicine"
              subtitle="Update medicine details (stock is managed via purchases/sales)"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6"
            >
              <div className="space-y-6">
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
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Group / Category <span className="text-red-500">*</span>
                      </label>
                      <GroupSearch
                        value={groupId}
                        displayValue={groupName}
                        onChange={handleGroupChange}
                        placeholder="Search group..."
                      />
                    </div>

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

                <div className="bg-amber-50/50 rounded-2xl p-4 sm:p-5 border border-amber-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Pricing & Alerts
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="max-w-xs">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Default Sale Price (৳)
                      </label>
                      <NumberInput
                        min="0"
                        step="0.01"
                        value={defaultSalePrice || ""}
                        onChange={(e) =>
                          setDefaultSalePrice(parseFloat(e.target.value) || 0)
                        }
                        placeholder="e.g., 50"
                        className={getInputClass(defaultSalePrice > 0)}
                      />
                    </div>

                    <div className="max-w-xs">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Low Stock Alert Threshold
                      </label>
                      <NumberInput
                        min="0"
                        value={lowStockThreshold}
                        onChange={(e) =>
                          setLowStockThreshold(parseInt(e.target.value) || 0)
                        }
                        placeholder="Alert when stock falls below this"
                        className={getInputClass(lowStockThreshold > 0)}
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
              theme="blue"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditMedicineModal;
