/**
 * Add Purchase Modal
 * Full modal for recording medicine purchases from suppliers
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
  TrendingUp,
  Building2,
  Pill,
  Package,
  Calendar,
  Hash,
} from "lucide-react";
import { format } from "date-fns";
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
import { useAddPurchaseData } from "../../hooks";
import {
  usePurchaseFormData,
  useSetPurchaseFormData,
  useResetPurchaseForm,
} from "../../stores";
import { useUIStore } from "../../stores";
import { CompanySearch, MedicineSearch } from "../shared";
import type { MedicineCompany, Medicine } from "../../types";
import CustomCalendar from "@/components/form-sections/Fields/CustomCalendar";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Form state from store
  const formData = usePurchaseFormData();
  const setFormData = useSetPurchaseFormData();
  const resetForm = useResetPurchaseForm();
  const { openModal: openUIModal } = useUIStore();

  // Calendar date state
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showPurchaseCalendar, setShowPurchaseCalendar] = useState(false);
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);

  // Refs for calendar trigger buttons
  const purchaseDateBtnRef = useRef<HTMLButtonElement>(null);
  const expiryDateBtnRef = useRef<HTMLButtonElement>(null);

  // Notification
  const { showNotification } = useNotification();

  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      // Reset form when opening
      resetForm();
      setPurchaseDate(new Date());
      setExpiryDate(null);
      setShowPurchaseCalendar(false);
      setShowExpiryCalendar(false);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, resetForm]);

  // Mutation
  const { addPurchase, isLoading: isSubmitting } = useAddPurchaseData({
    onSuccess: () => {
      resetForm();
      onClose();
    },
  });

  // Validation
  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!formData.invoiceNumber.trim()) {
      errors.push("Invoice number is required");
    }
    if (!formData.companyId) {
      errors.push("Company is required");
    }
    if (!formData.medicineId) {
      errors.push("Medicine is required");
    }
    if (formData.quantity <= 0) {
      errors.push("Quantity must be greater than 0");
    }
    if (formData.unitPrice <= 0) {
      errors.push("Unit price must be greater than 0");
    }

    return {
      isFormValid: errors.length === 0,
      validationErrors: errors,
    };
  }, [formData]);

  // Handlers
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }, [isSubmitting, onClose, resetForm]);

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

    // Prepare payload
    const payload = {
      invoiceNumber: formData.invoiceNumber.trim(),
      companyId: formData.companyId!,
      medicineId: formData.medicineId!,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      purchaseDate: purchaseDate.toISOString(),
      expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
      batchNumber: formData.batchNumber.trim() || undefined,
    };

    addPurchase(payload);
  }, [
    isFormValid,
    isSubmitting,
    formData,
    purchaseDate,
    expiryDate,
    addPurchase,
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

  // Company selection handler
  const handleCompanyChange = useCallback(
    (company: MedicineCompany | null) => {
      if (company) {
        setFormData({
          companyId: company.id,
          companyName: company.name,
        });
      } else {
        setFormData({
          companyId: null,
          companyName: "",
        });
      }
    },
    [setFormData],
  );

  // Medicine selection handler
  const handleMedicineChange = useCallback(
    (medicine: Medicine | null) => {
      if (medicine) {
        setFormData({
          medicineId: medicine.id,
          medicineName: medicine.genericName,
          medicineGroupName: medicine.group.name,
        });
      } else {
        setFormData({
          medicineId: null,
          medicineName: "",
          medicineGroupName: "",
        });
      }
    },
    [setFormData],
  );

  // Add new company handler
  const handleAddNewCompany = useCallback(
    (name: string) => {
      openUIModal("addCompany", { name });
    },
    [openUIModal],
  );

  // Add new medicine handler
  const handleAddNewMedicine = useCallback(() => {
    openUIModal("addMedicine");
  }, [openUIModal]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
    <AnimatePresence mode="wait" onExitComplete={() => resetForm()}>
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
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[90%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%] h-auto max-h-[95%] sm:max-h-[90%] popup-content flex flex-col"
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
              icon={TrendingUp}
              iconColor="green"
              title="Add Purchase"
              subtitle="Record a new medicine purchase from supplier"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6"
            >
              <div className="space-y-6">
                {/* Invoice and Company Section */}
                <div className="bg-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-900">
                      Purchase Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Invoice Number */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Invoice Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={formData.invoiceNumber}
                          onChange={(e) =>
                            setFormData({ invoiceNumber: e.target.value })
                          }
                          placeholder="e.g., 98632254"
                          className={`${getInputClass(
                            !!formData.invoiceNumber,
                          )} pl-10`}
                        />
                      </div>
                    </div>

                    {/* Company Search */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Company / Supplier{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <CompanySearch
                        value={formData.companyId}
                        displayValue={formData.companyName}
                        onChange={handleCompanyChange}
                        onAddNew={handleAddNewCompany}
                        placeholder="Search company..."
                      />
                    </div>
                  </div>
                </div>

                {/* Medicine Section */}
                <div className="bg-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Pill className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900">
                      Medicine Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medicine Search */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Medicine (Generic Name){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <MedicineSearch
                        value={formData.medicineId}
                        displayValue={formData.medicineName}
                        onChange={handleMedicineChange}
                        onAddNew={handleAddNewMedicine}
                        placeholder="Search medicine by name..."
                        showStock={true}
                      />
                    </div>

                    {/* Group (Auto-filled, read-only) */}
                    {formData.medicineGroupName && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Group
                        </label>
                        <div className="h-12 md:h-14 px-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {formData.medicineGroupName}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Batch Number */}
                    <div
                      className={
                        formData.medicineGroupName ? "" : "md:col-span-2"
                      }
                    >
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={formData.batchNumber}
                        onChange={(e) =>
                          setFormData({ batchNumber: e.target.value })
                        }
                        placeholder="Optional batch/lot number"
                        className={getInputClass(!!formData.batchNumber)}
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity and Price Section */}
                <div className="bg-violet-50/50 rounded-2xl p-4 sm:p-5 border border-violet-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-violet-600" />
                    </div>
                    <h3 className="text-sm font-bold text-violet-900">
                      Quantity & Pricing
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity || ""}
                        onChange={(e) =>
                          setFormData({
                            quantity: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter quantity"
                        className={getInputClass(formData.quantity > 0)}
                      />
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Unit Price (৳) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                          ৳
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.unitPrice || ""}
                          onChange={(e) =>
                            setFormData({
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Price per unit"
                          className={`${getInputClass(
                            formData.unitPrice > 0,
                          )} pl-10`}
                        />
                      </div>
                    </div>

                    {/* Total Amount (Auto-calculated) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Total Amount
                      </label>
                      <div className="h-12 md:h-14 px-4 py-2 bg-emerald-100 border-2 border-emerald-300 rounded-lg flex items-center justify-center">
                        <span className="text-base sm:text-lg font-bold text-emerald-800">
                          {formatCurrency(formData.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates Section */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Dates</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Purchase Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Purchase Date
                      </label>
                      <button
                        ref={purchaseDateBtnRef}
                        type="button"
                        onClick={() => {
                          setShowPurchaseCalendar(!showPurchaseCalendar);
                          setShowExpiryCalendar(false);
                        }}
                        className={`${getInputClass(!!purchaseDate)} flex items-center gap-3 text-left`}
                      >
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-700">
                          {format(purchaseDate, "dd MMM yyyy")}
                        </span>
                      </button>
                      <DropdownPortal
                        isOpen={showPurchaseCalendar}
                        onClose={() => setShowPurchaseCalendar(false)}
                        buttonRef={purchaseDateBtnRef}
                      >
                        <CustomCalendar
                          selectedDisplayDate={purchaseDate}
                          handleDateSelect={(date) => {
                            setPurchaseDate(date);
                            setShowPurchaseCalendar(false);
                          }}
                          colorScheme="emerald"
                        />
                      </DropdownPortal>
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Expiry Date (Optional)
                      </label>
                      <button
                        ref={expiryDateBtnRef}
                        type="button"
                        onClick={() => {
                          setShowExpiryCalendar(!showExpiryCalendar);
                          setShowPurchaseCalendar(false);
                        }}
                        className={`${getInputClass(!!expiryDate)} flex items-center gap-3 text-left`}
                      >
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span
                          className={`text-sm font-medium ${expiryDate ? "text-gray-700" : "text-gray-400"}`}
                        >
                          {expiryDate
                            ? format(expiryDate, "dd MMM yyyy")
                            : "Select expiry date..."}
                        </span>
                      </button>
                      <DropdownPortal
                        isOpen={showExpiryCalendar}
                        onClose={() => setShowExpiryCalendar(false)}
                        buttonRef={expiryDateBtnRef}
                      >
                        <CustomCalendar
                          selectedDisplayDate={expiryDate}
                          handleDateSelect={(date) => {
                            setExpiryDate(date);
                            setShowExpiryCalendar(false);
                          }}
                          colorScheme="amber"
                          minDate={purchaseDate}
                        />
                      </DropdownPortal>
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
              submitText="Record Purchase"
              loadingText="Saving..."
              submitIcon={Save}
              theme="green"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddPurchaseModal;
