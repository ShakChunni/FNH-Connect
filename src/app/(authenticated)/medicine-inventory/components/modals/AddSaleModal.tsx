/**
 * Add Sale Modal
 * Full modal for recording medicine sales to patients
 * Implements FIFO (First In, First Out) for stock management
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
  ShoppingCart,
  User,
  Pill,
  Package,
  Calendar,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import CustomCalendar from "@/components/form-sections/Fields/CustomCalendar";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
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
import { useAddSaleData } from "../../hooks";
import {
  useSaleFormData,
  useSetSaleFormData,
  useSetSaleFormDataWithFIFO,
  useResetSaleForm,
} from "../../stores";
import { PatientSearch, MedicineSearch } from "../shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Medicine } from "../../types";

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Interface for FIFO data from oldest purchase
interface FIFOData {
  purchaseId: number;
  companyName: string;
  unitPrice: number;
  availableQty: number;
  batchNumber?: string;
}

// Fetch FIFO data for a medicine
function useFetchMedicineFIFO(medicineId: number | null) {
  return useQuery({
    queryKey: ["medicine-inventory", "fifo", medicineId],
    queryFn: async (): Promise<FIFOData | null> => {
      if (!medicineId) return null;

      const response = await api.get<{
        success: boolean;
        data: {
          id: number;
          remainingQty: number;
          unitPrice: number;
          batchNumber?: string;
          company: {
            id: number;
            name: string;
          };
        } | null;
        error?: string;
      }>(`/medicine-inventory/medicines/${medicineId}/oldest-purchase`);

      if (!response.data.success || !response.data.data) {
        return null;
      }

      const purchase = response.data.data;
      return {
        purchaseId: purchase.id,
        companyName: purchase.company.name,
        unitPrice: purchase.unitPrice,
        availableQty: purchase.remainingQty,
        batchNumber: purchase.batchNumber,
      };
    },
    enabled: !!medicineId,
    staleTime: 30000,
  });
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Form state from store
  const formData = useSaleFormData();
  const setFormData = useSetSaleFormData();
  const setMedicineWithFIFO = useSetSaleFormDataWithFIFO();
  const resetForm = useResetSaleForm();

  // Calendar state
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [showSaleCalendar, setShowSaleCalendar] = useState(false);
  const saleDateBtnRef = useRef<HTMLButtonElement>(null);

  // Notification
  const { showNotification } = useNotification();

  // Fetch FIFO data when medicine is selected
  const { data: fifoData, isLoading: isLoadingFIFO } = useFetchMedicineFIFO(
    formData.medicineId,
  );

  // Update form when FIFO data is loaded
  useEffect(() => {
    if (fifoData && formData.medicineId) {
      setFormData({
        companyName: fifoData.companyName,
        unitPrice: fifoData.unitPrice,
        availableStock: fifoData.availableQty,
      });
    }
  }, [fifoData, formData.medicineId, setFormData]);

  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      // Reset form when opening
      resetForm();
      setSaleDate(new Date());
      setShowSaleCalendar(false);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, resetForm]);

  // Mutation
  const { addSale, isLoading: isSubmitting } = useAddSaleData({
    onSuccess: () => {
      resetForm();
      onClose();
    },
  });

  // Validation
  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!formData.patientId) {
      errors.push("Patient is required");
    }
    if (!formData.medicineId) {
      errors.push("Medicine is required");
    }
    if (formData.quantity <= 0) {
      errors.push("Quantity must be greater than 0");
    }
    if (formData.quantity > formData.availableStock) {
      errors.push(
        `Quantity exceeds available stock (${formData.availableStock})`,
      );
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
      patientId: formData.patientId!,
      medicineId: formData.medicineId!,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice > 0 ? formData.unitPrice : undefined,
      saleDate: saleDate.toISOString(),
    };

    addSale(payload);
  }, [
    isFormValid,
    isSubmitting,
    formData,
    saleDate,
    addSale,
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

  // Patient selection handler
  const handlePatientChange = useCallback(
    (
      patient: {
        id: number;
        fullName: string;
        phoneNumber: string | null;
      } | null,
    ) => {
      if (patient) {
        setFormData({
          patientId: patient.id,
          patientName: patient.fullName,
          patientPhone: patient.phoneNumber || "",
        });
      } else {
        setFormData({
          patientId: null,
          patientName: "",
          patientPhone: "",
        });
      }
    },
    [setFormData],
  );

  // Medicine selection handler
  const handleMedicineChange = useCallback(
    (medicine: Medicine | null) => {
      if (medicine) {
        setMedicineWithFIFO({
          medicineId: medicine.id,
          medicineName: medicine.genericName,
          medicineGroupName: medicine.group.name,
          availableStock: medicine.currentStock,
          companyName: "", // Will be populated by FIFO query
          unitPrice: 0, // Will be populated by FIFO query
        });
      } else {
        setFormData({
          medicineId: null,
          medicineName: "",
          medicineGroupName: "",
          availableStock: 0,
          companyName: "",
          unitPrice: 0,
          quantity: 0,
          totalAmount: 0,
        });
      }
    },
    [setFormData, setMedicineWithFIFO],
  );

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

  const isQuantityError = formData.quantity > formData.availableStock;

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
              icon={ShoppingCart}
              iconColor="indigo"
              title="Record Sale"
              subtitle="Record a medicine sale to a patient"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6"
            >
              <div className="space-y-6">
                {/* Patient Section */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 sm:p-5 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold text-indigo-900">
                      Patient Information
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Patient <span className="text-red-500">*</span>
                    </label>
                    <PatientSearch
                      value={formData.patientId}
                      displayValue={formData.patientName}
                      displayPhone={formData.patientPhone}
                      onChange={handlePatientChange}
                      placeholder="Search patient by name or phone..."
                    />
                  </div>
                </div>

                {/* Medicine Section */}
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
                        placeholder="Search medicine (only in-stock items)..."
                        showStock={true}
                        stockFilter="inStock"
                      />
                    </div>

                    {/* Auto-filled fields when medicine is selected */}
                    {formData.medicineId && (
                      <>
                        {/* Group (Auto-filled) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Group
                          </label>
                          <div className="h-12 md:h-14 px-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center">
                            <span className="text-sm font-medium text-gray-700">
                              {formData.medicineGroupName || "—"}
                            </span>
                          </div>
                        </div>

                        {/* Company (Auto-filled from FIFO) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Company (from oldest stock)
                          </label>
                          <div className="h-12 md:h-14 px-4 py-2 bg-emerald-50 border-2 border-emerald-200 rounded-lg flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-800">
                              {isLoadingFIFO
                                ? "Loading..."
                                : formData.companyName || "—"}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Quantity and Pricing Section */}
                {formData.medicineId && (
                  <div className="bg-violet-50/50 rounded-2xl p-4 sm:p-5 border border-violet-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-violet-600" />
                      </div>
                      <h3 className="text-sm font-bold text-violet-900">
                        Quantity & Pricing
                      </h3>
                    </div>

                    {/* Stock Warning */}
                    {formData.availableStock > 0 &&
                      formData.availableStock <= 10 && (
                        <div className="mb-4 p-3 bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-xs text-amber-800 font-medium">
                            Low stock alert: Only {formData.availableStock}{" "}
                            units remaining
                          </span>
                        </div>
                      )}

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* Available Stock (Read-only) */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Available Stock
                        </label>
                        <div className="h-12 md:h-14 px-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                          <span
                            className={`text-base font-bold ${
                              formData.availableStock === 0
                                ? "text-red-600"
                                : formData.availableStock <= 10
                                  ? "text-amber-600"
                                  : "text-gray-700"
                            }`}
                          >
                            {formData.availableStock}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={formData.availableStock}
                          value={formData.quantity || ""}
                          onChange={(e) =>
                            setFormData({
                              quantity: parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder="Enter qty"
                          className={getInputClass(
                            formData.quantity > 0,
                            isQuantityError,
                          )}
                        />
                        {isQuantityError && (
                          <p className="text-xs text-red-600 mt-1">
                            Exceeds stock
                          </p>
                        )}
                      </div>

                      {/* Unit Price (Editable — defaults to FIFO price) */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Price (৳) <span className="text-red-500">*</span>
                        </label>
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
                          placeholder="Enter price"
                          className={getInputClass(formData.unitPrice > 0)}
                        />
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
                )}

                {/* Date Section */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Sale Date
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <button
                      ref={saleDateBtnRef}
                      type="button"
                      onClick={() => setShowSaleCalendar(!showSaleCalendar)}
                      className={`${getInputClass(!!saleDate)} flex items-center gap-3 text-left`}
                    >
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-700">
                        {format(saleDate, "dd MMM yyyy")}
                      </span>
                    </button>
                    <DropdownPortal
                      isOpen={showSaleCalendar}
                      onClose={() => setShowSaleCalendar(false)}
                      buttonRef={saleDateBtnRef}
                    >
                      <CustomCalendar
                        selectedDisplayDate={saleDate}
                        handleDateSelect={(date) => {
                          setSaleDate(date);
                          setShowSaleCalendar(false);
                        }}
                        colorScheme="indigo"
                      />
                    </DropdownPortal>
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
              submitText="Record Sale"
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

export default AddSaleModal;
