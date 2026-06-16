/**
 * Add Purchase Modal
 * Records one supplier invoice with multiple medicine purchase lines.
 */

"use client";

import React, { useCallback, useMemo, useRef, useEffect, useState } from "react";
import {
  Save,
  TrendingUp,
  Building2,
  Pill,
  Package,
  Calendar,
  Hash,
  Plus,
  Trash2,
  ReceiptText,
} from "lucide-react";
import { format } from "date-fns";
import NumberInput from "@/components/form-sections/Fields/NumberInput";
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
  useSetPurchaseDraftItem,
  useAddPurchaseDraftItem,
  useUpdatePurchaseItem,
  useRemovePurchaseItem,
  useResetPurchaseDraftItem,
  useResetPurchaseForm,
} from "../../stores";
import { useUIStore } from "../../stores";
import { CompanySearch, MedicineSearch } from "../shared";
import type { MedicineCompany, Medicine } from "../../types";
import { getMedicineDisplayName } from "../../utils/medicineDisplay";
import CustomCalendar from "@/components/form-sections/Fields/CustomCalendar";
import { DropdownPortal } from "@/components/ui/DropdownPortal";

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(amount);
};

const parsePositiveInteger = (value: string) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePositiveNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDateInputValue = (date: Date | null) =>
  date ? format(date, "yyyy-MM-dd") : "";

const parseDateInputValue = (value: string) =>
  value ? new Date(`${value}T00:00:00`) : null;

const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const purchaseDateBtnRef = useRef<HTMLButtonElement>(null);
  const [showPurchaseCalendar, setShowPurchaseCalendar] = useState(false);

  const formData = usePurchaseFormData();
  const setFormData = useSetPurchaseFormData();
  const setDraftItem = useSetPurchaseDraftItem();
  const addDraftItem = useAddPurchaseDraftItem();
  const updateItem = useUpdatePurchaseItem();
  const removeItem = useRemovePurchaseItem();
  const resetDraftItem = useResetPurchaseDraftItem();
  const resetForm = useResetPurchaseForm();
  const { openModal: openUIModal } = useUIStore();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      resetForm();
      setShowPurchaseCalendar(false);
    } else {
      preserveUnlockBodyScroll();
    }

    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, resetForm]);

  const { addPurchase, isLoading: isSubmitting } = useAddPurchaseData({
    onSuccess: () => {
      resetForm();
      onClose();
    },
  });

  const draftItem = formData.draftItem;

  const { isDraftValid, draftErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!draftItem.medicineId) {
      errors.push("Medicine is required");
    }

    if (draftItem.quantity <= 0) {
      errors.push("Quantity must be greater than 0");
    }

    if (draftItem.unitPrice <= 0) {
      errors.push("Purchase price must be greater than 0");
    }

    if (draftItem.salePrice <= 0) {
      errors.push("Sale price must be greater than 0");
    }

    if (
      draftItem.expiryDate &&
      draftItem.expiryDate < formData.purchaseDate
    ) {
      errors.push("Expiry date cannot be earlier than purchase date");
    }

    return {
      isDraftValid: errors.length === 0,
      draftErrors: errors,
    };
  }, [draftItem, formData.purchaseDate]);

  const { isFormValid, validationErrors } = useMemo(() => {
    const errors: string[] = [];

    if (!formData.invoiceNumber.trim()) {
      errors.push("Invoice number is required");
    }

    if (!formData.companyId) {
      errors.push("Company is required");
    }

    if (formData.items.length === 0) {
      errors.push("Add at least one medicine to the invoice");
    }

    formData.items.forEach((item, index) => {
      const lineNumber = index + 1;

      if (!item.medicineId) {
        errors.push(`Line ${lineNumber}: medicine is required`);
      }

      if (item.quantity <= 0) {
        errors.push(`Line ${lineNumber}: quantity must be greater than 0`);
      }

      if (item.unitPrice <= 0) {
        errors.push(`Line ${lineNumber}: purchase price must be greater than 0`);
      }

      if (item.salePrice <= 0) {
        errors.push(`Line ${lineNumber}: sale price must be greater than 0`);
      }

      if (item.expiryDate && item.expiryDate < formData.purchaseDate) {
        errors.push(
          `Line ${lineNumber}: expiry date cannot be earlier than purchase date`,
        );
      }
    });

    return {
      isFormValid: errors.length === 0,
      validationErrors: errors,
    };
  }, [formData]);

  const totals = useMemo(() => {
    return formData.items.reduce(
      (acc, item) => ({
        quantity: acc.quantity + item.quantity,
        amount: acc.amount + item.quantity * item.unitPrice,
      }),
      { quantity: 0, amount: 0 },
    );
  }, [formData.items]);

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

    if (!formData.companyId) {
      showNotification("Company is required", "error");
      return;
    }

    const purchaseItems = formData.items.map((item) => {
      if (!item.medicineId) {
        showNotification("Medicine is required", "error");
        return null;
      }

      return {
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        salePrice: item.salePrice,
        expiryDate: item.expiryDate ? item.expiryDate.toISOString() : undefined,
        batchNumber: item.batchNumber.trim() || undefined,
      };
    });

    const validPurchaseItems = purchaseItems.filter(
      (item): item is NonNullable<(typeof purchaseItems)[number]> =>
        item !== null,
    );

    if (validPurchaseItems.length !== purchaseItems.length) {
      return;
    }

    addPurchase({
      invoiceNumber: formData.invoiceNumber.trim(),
      companyId: formData.companyId,
      purchaseDate: formData.purchaseDate.toISOString(),
      items: validPurchaseItems,
    });
  }, [
    addPurchase,
    formData,
    isFormValid,
    isSubmitting,
    showNotification,
    validationErrors,
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

  const handleCompanyChange = useCallback(
    (company: MedicineCompany | null) => {
      if (company) {
        setFormData({
          companyId: company.id,
          companyName: company.name,
        });
        return;
      }

      setFormData({
        companyId: null,
        companyName: "",
      });
    },
    [setFormData],
  );

  const handleDraftMedicineChange = useCallback(
    (medicine: Medicine | null) => {
      if (medicine) {
        setDraftItem({
          medicineId: medicine.id,
          medicineName: getMedicineDisplayName(medicine),
          medicineGroupName: medicine.group?.name || "Unknown Group",
          salePrice: Number(medicine.defaultSalePrice || 0),
        });
        return;
      }

      setDraftItem({
        medicineId: null,
        medicineName: "",
        medicineGroupName: "",
        salePrice: 0,
      });
    },
    [setDraftItem],
  );

  const handleAddNewCompany = useCallback(
    (name: string) => {
      openUIModal("addCompany", { name });
    },
    [openUIModal],
  );

  const handleAddNewMedicine = useCallback(() => {
    openUIModal("addMedicine");
  }, [openUIModal]);

  const handleAddLineItem = useCallback(() => {
    if (!isDraftValid) {
      const errorMessage =
        draftErrors.length === 1
          ? draftErrors[0]
          : `Please fix the medicine line: ${draftErrors.join(", ")}`;
      showNotification(errorMessage, "error");
      return;
    }

    const wasAdded = addDraftItem();

    if (!wasAdded) {
      showNotification("Medicine line is incomplete", "error");
    }
  }, [addDraftItem, draftErrors, isDraftValid, showNotification]);

  const getInputClass = (hasValue: boolean, hasError: boolean = false) => {
    const base =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";

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
            className="bg-white rounded-3xl shadow-lg w-full max-w-[96%] xl:max-w-6xl h-auto max-h-[95%] sm:max-h-[90%] popup-content flex flex-col"
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
              title="Add Purchase Invoice"
              subtitle="Record multiple medicines under one supplier invoice"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6"
            >
              <div className="space-y-5">
                <div className="bg-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-900">
                      Invoice Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                          placeholder="e.g., INV-98632254"
                          className={`${getInputClass(
                            !!formData.invoiceNumber,
                          )} pl-10`}
                        />
                      </div>
                    </div>

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

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Purchase Date
                      </label>
                      <button
                        ref={purchaseDateBtnRef}
                        type="button"
                        onClick={() =>
                          setShowPurchaseCalendar(!showPurchaseCalendar)
                        }
                        className={`${getInputClass(
                          !!formData.purchaseDate,
                        )} flex items-center gap-3 text-left`}
                      >
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium text-gray-700">
                          {format(formData.purchaseDate, "dd MMM yyyy")}
                        </span>
                      </button>
                      <DropdownPortal
                        isOpen={showPurchaseCalendar}
                        onClose={() => setShowPurchaseCalendar(false)}
                        buttonRef={purchaseDateBtnRef}
                        matchButtonWidth={false}
                        withContainerStyles={false}
                      >
                        <CustomCalendar
                          selectedDisplayDate={formData.purchaseDate}
                          handleDateSelect={(date) => {
                            setFormData({ purchaseDate: date });
                            setShowPurchaseCalendar(false);
                          }}
                          colorScheme="emerald"
                          maxDate={new Date()}
                        />
                      </DropdownPortal>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Pill className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-bold text-blue-900">
                        Add Medicine Line
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={resetDraftItem}
                      className="self-start sm:self-auto text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      Clear line
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-4">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Medicine Name <span className="text-red-500">*</span>
                      </label>
                      <MedicineSearch
                        value={draftItem.medicineId}
                        displayValue={draftItem.medicineName}
                        onChange={handleDraftMedicineChange}
                        onAddNew={handleAddNewMedicine}
                        placeholder="Search medicine name..."
                        showStock={true}
                      />
                      {draftItem.medicineGroupName ? (
                        <p className="mt-1.5 text-xs font-medium text-blue-700">
                          Group: {draftItem.medicineGroupName}
                        </p>
                      ) : null}
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <NumberInput
                        min="1"
                        value={draftItem.quantity || ""}
                        onChange={(e) =>
                          setDraftItem({
                            quantity: parsePositiveInteger(e.target.value),
                          })
                        }
                        placeholder="Qty"
                        className={getInputClass(draftItem.quantity > 0)}
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Purchase Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                          ৳
                        </span>
                        <NumberInput
                          min="0"
                          step="0.01"
                          value={draftItem.unitPrice || ""}
                          onChange={(e) =>
                            setDraftItem({
                              unitPrice: parsePositiveNumber(e.target.value),
                            })
                          }
                          placeholder="Buy"
                          className={`${getInputClass(
                            draftItem.unitPrice > 0,
                          )} pl-10`}
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Sale Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                          ৳
                        </span>
                        <NumberInput
                          min="0"
                          step="0.01"
                          value={
                            draftItem.salePrice === 0
                              ? ""
                              : draftItem.salePrice
                          }
                          onChange={(e) =>
                            setDraftItem({
                              salePrice: parsePositiveNumber(e.target.value),
                            })
                          }
                          placeholder="Sell"
                          className={`${getInputClass(
                            draftItem.salePrice > 0,
                          )} pl-10`}
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Line Total
                      </label>
                      <div className="h-12 md:h-14 px-3 py-2 bg-emerald-100 border-2 border-emerald-300 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-800">
                          {formatCurrency(
                            draftItem.quantity * draftItem.unitPrice,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-4">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={draftItem.batchNumber}
                        onChange={(e) =>
                          setDraftItem({ batchNumber: e.target.value })
                        }
                        placeholder="Optional batch/lot number"
                        className={getInputClass(!!draftItem.batchNumber)}
                      />
                    </div>

                    <div className="lg:col-span-4">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        min={formatDateInputValue(formData.purchaseDate)}
                        value={formatDateInputValue(draftItem.expiryDate)}
                        onChange={(e) =>
                          setDraftItem({
                            expiryDate: parseDateInputValue(e.target.value),
                          })
                        }
                        className={getInputClass(!!draftItem.expiryDate)}
                      />
                    </div>

                    <div className="lg:col-span-4 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        className="h-12 md:h-14 w-full px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Invoice
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-4 sm:px-5 py-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ReceiptText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Invoice Medicines
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formData.items.length} item
                          {formData.items.length === 1 ? "" : "s"} selected
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-blue-700">
                        <Package className="w-3.5 h-3.5" />
                        Qty {totals.quantity}
                      </span>
                      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-700">
                        Total {formatCurrency(totals.amount)}
                      </span>
                    </div>
                  </div>

                  {formData.items.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Pill className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        No medicines added yet.
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Search a medicine, enter quantity and prices, then add
                        it to this invoice.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100 bg-white">
                              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Medicine
                              </th>
                              <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Qty
                              </th>
                              <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Purchase
                              </th>
                              <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Sale
                              </th>
                              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Batch
                              </th>
                              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Expiry
                              </th>
                              <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Total
                              </th>
                              <th className="px-4 py-3" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {formData.items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {item.medicineName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.medicineGroupName || "Unknown Group"}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <NumberInput
                                    min="1"
                                    value={item.quantity || ""}
                                    onChange={(e) =>
                                      updateItem(item.id, {
                                        quantity: parsePositiveInteger(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="h-10 w-24 rounded-lg border-2 border-gray-200 px-3 text-right text-sm font-semibold outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <NumberInput
                                    min="0"
                                    step="0.01"
                                    value={item.unitPrice || ""}
                                    onChange={(e) =>
                                      updateItem(item.id, {
                                        unitPrice: parsePositiveNumber(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="h-10 w-28 rounded-lg border-2 border-gray-200 px-3 text-right text-sm font-semibold outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <NumberInput
                                    min="0"
                                    step="0.01"
                                    value={
                                      item.salePrice === 0
                                        ? ""
                                        : item.salePrice
                                    }
                                    onChange={(e) =>
                                      updateItem(item.id, {
                                        salePrice: parsePositiveNumber(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="h-10 w-28 rounded-lg border-2 border-gray-200 px-3 text-right text-sm font-semibold outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={item.batchNumber}
                                    onChange={(e) =>
                                      updateItem(item.id, {
                                        batchNumber: e.target.value,
                                      })
                                    }
                                    placeholder="Optional"
                                    className="h-10 w-32 rounded-lg border-2 border-gray-200 px-3 text-sm outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="date"
                                    min={formatDateInputValue(
                                      formData.purchaseDate,
                                    )}
                                    value={formatDateInputValue(
                                      item.expiryDate,
                                    )}
                                    onChange={(e) =>
                                      updateItem(item.id, {
                                        expiryDate: parseDateInputValue(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="h-10 w-36 rounded-lg border-2 border-gray-200 px-3 text-sm outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">
                                  {formatCurrency(
                                    item.quantity * item.unitPrice,
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    aria-label={`Remove ${item.medicineName}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="lg:hidden divide-y divide-gray-100">
                        {formData.items.map((item) => (
                          <div key={item.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-gray-900">
                                  {item.medicineName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.medicineGroupName || "Unknown Group"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                aria-label={`Remove ${item.medicineName}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                  Qty
                                </label>
                                <NumberInput
                                  min="1"
                                  value={item.quantity || ""}
                                  onChange={(e) =>
                                    updateItem(item.id, {
                                      quantity: parsePositiveInteger(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  className="h-11 w-full rounded-lg border-2 border-gray-200 px-3 text-sm font-semibold outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                  Purchase
                                </label>
                                <NumberInput
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice || ""}
                                  onChange={(e) =>
                                    updateItem(item.id, {
                                      unitPrice: parsePositiveNumber(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  className="h-11 w-full rounded-lg border-2 border-gray-200 px-3 text-sm font-semibold outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                  Sale
                                </label>
                                <NumberInput
                                  min="0"
                                  step="0.01"
                                  value={
                                    item.salePrice === 0 ? "" : item.salePrice
                                  }
                                  onChange={(e) =>
                                    updateItem(item.id, {
                                      salePrice: parsePositiveNumber(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  className="h-11 w-full rounded-lg border-2 border-gray-200 px-3 text-sm font-semibold outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                  Total
                                </label>
                                <div className="h-11 rounded-lg bg-emerald-50 px-3 flex items-center text-sm font-bold text-emerald-700">
                                  {formatCurrency(
                                    item.quantity * item.unitPrice,
                                  )}
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                  Batch
                                </label>
                                <input
                                  type="text"
                                  value={item.batchNumber}
                                  onChange={(e) =>
                                    updateItem(item.id, {
                                      batchNumber: e.target.value,
                                    })
                                  }
                                  placeholder="Optional"
                                  className="h-11 w-full rounded-lg border-2 border-gray-200 px-3 text-sm outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                  Expiry
                                </label>
                                <input
                                  type="date"
                                  min={formatDateInputValue(
                                    formData.purchaseDate,
                                  )}
                                  value={formatDateInputValue(item.expiryDate)}
                                  onChange={(e) =>
                                    updateItem(item.id, {
                                      expiryDate: parseDateInputValue(
                                        e.target.value,
                                      ),
                                    })
                                  }
                                  className="h-11 w-full rounded-lg border-2 border-gray-200 px-3 text-sm outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-950"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={false}
              cancelText="Cancel"
              submitText="Purchase Invoice"
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
