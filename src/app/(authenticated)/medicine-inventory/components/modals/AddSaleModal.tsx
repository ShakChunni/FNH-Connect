/**
 * Add Sale Modal — Multi-Item Cart
 *
 * Replaces the legacy single-medicine form. The pharmacist selects a
 * central patient, optionally applies the LUCS medicine package when
 * the patient has an active Gynecology admission, adds / merges / edits
 * cart rows, and submits the entire cart to the batch endpoint.
 */

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Save,
  ShoppingCart,
  User,
  Pill,
  Calendar,
  AlertTriangle,
  Plus,
  Package,
  Trash2,
  RefreshCcw,
  CheckCircle2,
  Activity,
  Stethoscope,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useNotification } from "@/hooks/useNotification";
import CustomCalendar from "@/components/form-sections/Fields/CustomCalendar";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { DropdownPortal } from "@/components/ui/DropdownPortal";
import { PatientSearch } from "../shared/PatientSearch";
import {
  SaleItemsTable,
  fetchOldestPurchase,
} from "../sales/SaleItemsTable";
import { useAddBatchSaleData } from "../../hooks/useAddBatchSaleData";
import { useFetchPatientGyneContext } from "../../hooks/useFetchPatientGyneContext";
import { useFetchSalePackage } from "../../hooks/useFetchSalePackage";
import {
  useSaleFormData,
  useSetPatient,
  useSetSaleDate,
  useAppendBlankRow,
  useRemoveRow,
  useClearRows,
  useUpdateRow,
  useSetMedicineForRow,
  useApplyPackage,
  useSetGyneContext,
  useResetSaleForm,
} from "../../stores";
import type { Medicine, SalePatientOption } from "../../types";
import type {
  MedicineSaleDraftItem,
  SalePatientSelection,
} from "../../stores/saleFormStore";

const LUCS_PACKAGE_CODE = "LUCS_OT_MEDICINE";

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formData = useSaleFormData();
  const setPatient = useSetPatient();
  const setSaleDate = useSetSaleDate();
  const appendBlankRow = useAppendBlankRow();
  const removeRow = useRemoveRow();
  const clearRows = useClearRows();
  const updateRow = useUpdateRow();
  const setMedicineForRow = useSetMedicineForRow();
  const applyPackage = useApplyPackage();
  const setGyneContext = useSetGyneContext();
  const resetForm = useResetSaleForm();

  const [showSaleCalendar, setShowSaleCalendar] = useState(false);
  const saleDateBtnRef = useRef<HTMLButtonElement>(null);

  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const {
    data: gyneContext,
    isLoading: isLoadingGyneContext,
    isError: isGyneContextError,
    error: gyneContextError,
    refetch: refetchGyneContext,
  } = useFetchPatientGyneContext(
    formData.patient?.id ?? null,
    isOpen && Boolean(formData.patient?.id),
  );

  useEffect(() => {
    if (!isOpen) return;
    const currentId = formData.patient?.id ?? null;

    if (currentId === null) {
      setGyneContext(null);
      return;
    }
    setGyneContext(
      gyneContext
        ? {
            admissionId: gyneContext.admissionId,
            admissionNumber: gyneContext.admissionNumber,
            status: gyneContext.status,
            departmentName: gyneContext.departmentName,
            hasLucsPackage: gyneContext.hasLucsPackage,
          }
        : null,
    );
  }, [formData.patient?.id, gyneContext, isOpen, setGyneContext]);

  const eligibleForLucs = Boolean(formData.gyneContext);
  const hasRows = formData.items.length > 0;
  const hasUnmatched = formData.items.some(
    (item) => item.medicineId === null,
  );
  const hasInvalidPrice = formData.items.some(
    (item) => !Number.isFinite(item.unitPrice) || item.unitPrice <= 0,
  );
  const hasInvalidStock = formData.items.some(
    (item) =>
      item.medicineId === null ||
      item.currentStock === 0 ||
      item.quantity > item.currentStock,
  );

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);

  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      resetForm();
      setShowSaleCalendar(false);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, resetForm]);

  const closeAfterSuccess = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const { addBatchSale, isLoading: isSubmitting } = useAddBatchSaleData({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicine-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["patients", "search"] });
      closeAfterSuccess();
    },
  });

  const {
    data: lucsPackage,
    isLoading: isLoadingLucs,
    isError: isLucsError,
    error: lucsError,
    refetch: refetchLucsPackage,
  } = useFetchSalePackage(LUCS_PACKAGE_CODE, eligibleForLucs);

  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);

  const requestApplyLucsPackage = useCallback(() => {
    if (!lucsPackage) return;
    if (lucsPackage.items.length === 0) {
      showNotification("LUCS package has no items to apply.", "error");
      return;
    }
    if (formData.gyneContext?.hasLucsPackage) {
      setApplyConfirmOpen(true);
      return;
    }
    doApplyLucsPackage();
  }, [lucsPackage, formData.gyneContext?.hasLucsPackage, showNotification]);

  const doApplyLucsPackage = useCallback(() => {
    if (!lucsPackage) return;
    const rows: Omit<MedicineSaleDraftItem, "clientId">[] =
      lucsPackage.items.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.matched ? item.medicineName : item.templateName,
        genericName: item.genericName,
        groupName: item.groupName,
        companyName: item.companyName,
        currentStock: item.currentStock,
        lowStockThreshold: item.lowStockThreshold,
        quantity: item.quantity || 1,
        unitPrice: item.defaultSalePrice,
        requestedMedicineName: item.matched ? null : item.templateName,
        operationName: lucsPackage.operationName,
        packageCode: lucsPackage.code,
        matchReason: item.matchReason,
      }));
    applyPackage(rows);
    setApplyConfirmOpen(false);
  }, [lucsPackage, applyPackage]);

  const handleSelectMedicine = useCallback(
    (clientId: string, medicine: Medicine) => {
      setMedicineForRow(clientId, {
        id: medicine.id,
        genericName: medicine.genericName,
        brandName: medicine.brandName,
        currentStock: medicine.currentStock,
        lowStockThreshold: medicine.lowStockThreshold,
        defaultSalePrice: medicine.defaultSalePrice,
        group: { id: medicine.group.id, name: medicine.group.name },
      });

      void (async () => {
        const company = await fetchOldestPurchase(medicine.id);
        if (company) {
          updateRow(clientId, { companyName: company });
        }
      })();
    },
    [setMedicineForRow, updateRow],
  );

  const handleClearAllRows = useCallback(() => {
    if (formData.items.length === 0) return;
    if (
      window.confirm(
        "Clear all medicines from this cart? This cannot be undone.",
      )
    ) {
      clearRows();
    }
  }, [clearRows, formData.items.length]);

  const handlePatientChange = useCallback(
    (patient: SalePatientSelection | null) => {
      if (patient) {
        if (formData.items.length > 0) {
          const ok = window.confirm(
            "Changing the patient will clear the current cart. Continue?",
          );
          if (!ok) return;
          clearRows();
        }
        setPatient(patient);
      } else {
        if (formData.items.length > 0) {
          const ok = window.confirm(
            "Clearing the patient will clear the current cart. Continue?",
          );
          if (!ok) return;
          clearRows();
        }
        setPatient(null);
      }
    },
    [clearRows, formData.items.length, setPatient],
  );

  const isFormValid = useMemo(() => {
    if (!formData.patient) return false;
    if (formData.items.length === 0) return false;
    if (hasUnmatched) return false;
    if (hasInvalidPrice) return false;
    if (hasInvalidStock) return false;
    if (formData.saleDate > today) return false;
    return true;
  }, [
    formData.patient,
    formData.items.length,
    hasUnmatched,
    hasInvalidPrice,
    hasInvalidStock,
    formData.saleDate,
    today,
  ]);

  const validationError = useMemo(() => {
    if (!formData.patient) return "Select a patient to continue.";
    if (formData.items.length === 0)
      return "Add at least one medicine to the cart.";
    if (hasUnmatched)
      return "Resolve or remove every unmatched medicine row before submitting.";
    if (hasInvalidStock)
      return "One or more rows have a quantity that exceeds current stock.";
    if (hasInvalidPrice)
      return "Direct sale price is required and must be greater than zero for every row.";
    if (formData.saleDate > today) return "Sale date cannot be in the future.";
    return null;
  }, [
    formData.patient,
    formData.items.length,
    hasUnmatched,
    hasInvalidPrice,
    hasInvalidStock,
    formData.saleDate,
    today,
  ]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    if (formData.items.length > 0) {
      const ok = window.confirm(
        "Discard the current cart? Added medicines will be lost.",
      );
      if (!ok) return;
    }
    resetForm();
    onClose();
  }, [isSubmitting, formData.items.length, onClose, resetForm]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;
    if (!isFormValid) {
      showNotification(
        validationError || "Please complete the cart before submitting.",
        "error",
      );
      return;
    }

    addBatchSale({
      patientId: formData.patient!.id,
      saleDate: formData.saleDate.toISOString(),
      items: formData.items.map((item) => ({
        medicineId: item.medicineId!,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  }, [
    addBatchSale,
    formData.items,
    formData.patient,
    formData.saleDate,
    isFormValid,
    isSubmitting,
    showNotification,
    validationError,
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);

  const matchedCount = formData.items.filter(
    (i) => i.medicineId !== null,
  ).length;
  const totalUnits = formData.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount =
    Math.round(
      formData.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) *
        100,
    ) / 100;

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
            className="bg-white rounded-3xl shadow-lg w-full max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] xl:max-w-[78%] h-auto max-h-[96%] sm:max-h-[94%] popup-content flex flex-col"
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
              iconColor="blue"
              title="Record Sale"
              subtitle="Dispense one or more medicines to a patient"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6"
            >
              <div className="space-y-5">
                {/* Patient + Gynecology context */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 sm:p-5 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold text-indigo-900">
                      Patient
                    </h3>
                  </div>

                  <PatientSearch
                    value={formData.patient?.id ?? null}
                    displayValue={formData.patient?.fullName ?? ""}
                    displayPhone={formData.patient?.phoneNumber ?? undefined}
                    onChange={handlePatientChange}
                  />

                  <AnimatePresence>
                    {formData.patient && isLoadingGyneContext && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 flex items-center gap-2 text-xs text-gray-500"
                      >
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        Checking active admissions…
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {formData.gyneContext && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 flex flex-wrap items-center gap-2"
                      >
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-lg text-xs font-semibold">
                          <Stethoscope className="w-3.5 h-3.5" />
                          {formData.gyneContext.departmentName} ·{" "}
                          {formData.gyneContext.admissionNumber}
                          <span className="text-pink-500 font-normal">
                            ({formData.gyneContext.status})
                          </span>
                        </span>
                        {formData.gyneContext.hasLucsPackage && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold">
                            <Package className="w-3.5 h-3.5" />
                            LUCS already attached — applying again will add a
                            fresh cart row, not edit the existing one.
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {formData.patient && isGyneContextError && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {gyneContextError instanceof Error
                          ? gyneContextError.message
                          : "Could not check Gynecology admission context."}
                      </span>
                      <button
                        type="button"
                        onClick={() => void refetchGyneContext()}
                        className="font-bold underline underline-offset-2"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={appendBlankRow}
                    disabled={isSubmitting}
                    whileTap={isSubmitting ? undefined : { scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add medicine
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={requestApplyLucsPackage}
                    disabled={
                      isSubmitting || !eligibleForLucs || isLoadingLucs
                    }
                    whileTap={
                      isSubmitting || !eligibleForLucs || isLoadingLucs
                        ? undefined
                        : { scale: 0.96 }
                    }
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-pink-300 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold transition disabled:opacity-50"
                  >
                    {isLoadingLucs ? (
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                    ) : (
                      <Pill className="w-3.5 h-3.5" />
                    )}
                    Add LUCS package
                    {!eligibleForLucs && !isLoadingLucs && (
                      <span className="text-[10px] text-pink-500 font-medium ml-1">
                        (needs Gynecology admission)
                      </span>
                    )}
                  </motion.button>

                  {hasRows && (
                    <motion.button
                      type="button"
                      onClick={handleClearAllRows}
                      disabled={isSubmitting}
                      whileTap={isSubmitting ? undefined : { scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                    </motion.button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      queryClient.invalidateQueries({
                        queryKey: ["medicine-inventory", "patient-gyne-context"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["medicine-inventory", "sale-package"],
                      });
                    }}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Refresh context
                  </button>
                </div>

                {eligibleForLucs && isLucsError && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {lucsError instanceof Error
                        ? lucsError.message
                        : "Could not load the LUCS medicine package."}
                    </span>
                    <button
                      type="button"
                      onClick={() => void refetchLucsPackage()}
                      className="font-bold underline underline-offset-2"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Empty state vs cart */}
                {!hasRows ? (
                  <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 text-center bg-blue-50/30">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center mb-3">
                      <Pill className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 mb-1">
                      Cart is empty
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Use <strong>Add medicine</strong> to start a manual
                      cart, or pick an active Gynecology patient and use{" "}
                      <strong>Add LUCS package</strong> for the full template.
                    </p>
                  </div>
                ) : (
                  <SaleItemsTable
                    items={formData.items}
                    isSubmitting={isSubmitting}
                    onUpdateRow={updateRow}
                    onSelectMedicine={handleSelectMedicine}
                    onRemove={removeRow}
                  />
                )}

                {/* Sale date */}
                <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Sale Date
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      ref={saleDateBtnRef}
                      type="button"
                      onClick={() => setShowSaleCalendar(!showSaleCalendar)}
                      className="h-12 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg flex items-center gap-3 text-left text-sm font-medium text-gray-700 hover:border-blue-500 hover:shadow-sm transition min-w-[200px]"
                    >
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      {format(formData.saleDate, "dd MMM yyyy")}
                    </button>
                    <DropdownPortal
                      isOpen={showSaleCalendar}
                      onClose={() => setShowSaleCalendar(false)}
                      buttonRef={saleDateBtnRef}
                      matchButtonWidth={false}
                      withContainerStyles={false}
                    >
                      <CustomCalendar
                        selectedDisplayDate={formData.saleDate}
                        handleDateSelect={(date) => {
                          setSaleDate(date);
                          setShowSaleCalendar(false);
                        }}
                        colorScheme="indigo"
                        maxDate={today}
                      />
                    </DropdownPortal>
                  </div>
                </div>

                {/* Cart summary */}
                {hasRows && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {matchedCount} matched
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-blue-600" />
                        {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
                      </span>
                      {hasUnmatched && (
                        <span className="inline-flex items-center gap-1.5 text-amber-700">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {formData.items.length - matchedCount} need
                          selection
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">
                        Direct sale total
                      </p>
                      <p className="text-lg font-black text-blue-700">
                        {formatCurrency(totalAmount)}
                      </p>
                    </div>
                  </div>
                )}

                {validationError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    {validationError}
                  </div>
                )}
              </div>
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={!isFormValid}
              cancelText="Cancel"
              submitText="Record Sale"
              loadingText="Saving..."
              submitIcon={Save}
              theme="indigo"
            />

            <AnimatePresence>
              {applyConfirmOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5"
                  >
                    <h4 className="text-sm font-bold text-gray-900 mb-2">
                      LUCS package already attached
                    </h4>
                    <p className="text-xs text-gray-600 mb-4">
                      The selected Gynecology admission already has a LUCS
                      package applied. Applying the package again will add
                      fresh medicine rows to this cart; the admission rows
                      will not be changed.
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setApplyConfirmOpen(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={doApplyLucsPackage}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg"
                      >
                        Add anyway
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddSaleModal;
