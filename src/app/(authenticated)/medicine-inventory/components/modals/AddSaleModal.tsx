/**
 * Add Sale Modal — Multi-Item Cart
 *
 * Replaces the legacy single-medicine form. The pharmacist selects a
 * central patient, optionally applies a department medicine package when
 * the patient has an eligible admission, adds / merges / edits
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
  Building2,
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
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PatientSearch } from "../shared/PatientSearch";
import { SaleItemsTable } from "../sales/SaleItemsTable";
import { fetchOldestPurchase } from "../../utils/fetchOldestPurchase";
import { useAddBatchSaleData } from "../../hooks/useAddBatchSaleData";
import { useFetchPatientPackageContext } from "../../hooks/useFetchPatientPackageContext";
import {
  useFetchSalePackageSummaries,
  type SalePackageSummary,
} from "../../hooks/useFetchSalePackageSummaries";
import { isMedicinePackageForDepartment } from "@/lib/medicinePackageDepartments";
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
  useSetPackageContext,
  useResetSaleForm,
} from "../../stores";
import type { Medicine } from "../../types";
import type {
  MedicineSaleDraftItem,
  SalePatientSelection,
} from "../../stores/saleFormStore";
import type { PatientPackageAdmissionContext } from "../../hooks/useFetchPatientPackageContext";

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PackageOption = {
  pkg: SalePackageSummary;
  admission: PatientPackageAdmissionContext;
};

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
  const setPackageContext = useSetPackageContext();
  const resetForm = useResetSaleForm();

  const [showSaleCalendar, setShowSaleCalendar] = useState(false);
  const saleDateBtnRef = useRef<HTMLButtonElement>(null);

  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const {
    data: packageContextData,
    isLoading: isLoadingPackageContext,
    isError: isPackageContextError,
    error: packageContextError,
    refetch: refetchPackageContext,
  } = useFetchPatientPackageContext(
    formData.patient?.id ?? null,
    isOpen && Boolean(formData.patient?.id),
  );

  const {
    data: packageSummaries = [],
    isLoading: isLoadingPackageSummaries,
    isError: isPackageSummariesError,
    error: packageSummariesError,
    refetch: refetchPackageSummaries,
  } = useFetchSalePackageSummaries(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const currentId = formData.patient?.id ?? null;

    if (currentId === null) {
      setPackageContext([]);
      return;
    }
    setPackageContext(
      (packageContextData?.admissions ?? []).map((admission) => ({
        admissionId: admission.admissionId,
        admissionNumber: admission.admissionNumber,
        status: admission.status,
        departmentName: admission.departmentName,
        attachedPackageCodes: admission.attachedPackageCodes,
      })),
    );
  }, [formData.patient?.id, isOpen, packageContextData, setPackageContext]);

  const packageOptions = useMemo(
    () =>
      packageSummaries.flatMap((pkg) =>
        (packageContextData?.admissions ?? [])
          .filter((admission) =>
            isMedicinePackageForDepartment(
              pkg.departmentName,
              admission.departmentName,
              pkg.departmentId,
              admission.departmentId,
            ),
          )
          .map((admission) => ({ pkg, admission })),
      ),
    [packageContextData?.admissions, packageSummaries],
  );
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
    setSubmitConfirmOpen(false);
    onClose();
  }, [onClose]);

  const { addBatchSale, isLoading: isSubmitting } = useAddBatchSaleData({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicine-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["patients", "search"] });
      closeAfterSuccess();
    },
  });

  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [isApplyingPackage, setIsApplyingPackage] = useState(false);
  const [pendingPackageOption, setPendingPackageOption] =
    useState<PackageOption | null>(null);
  const [clearRowsConfirmOpen, setClearRowsConfirmOpen] = useState(false);
  const [patientChangeConfirmOpen, setPatientChangeConfirmOpen] =
    useState(false);
  const [closeWithItemsConfirmOpen, setCloseWithItemsConfirmOpen] =
    useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [pendingPatientSelection, setPendingPatientSelection] =
    useState<SalePatientSelection | null>(null);

  const applyPackageOption = useCallback(
    async (option: PackageOption) => {
      setIsApplyingPackage(true);
      try {
        const response = await api.get<{
          success: boolean;
          data: {
            code: string;
            operationName: string;
            items: Array<{
              templateName: string;
              matched: boolean;
              medicineId: number | null;
              medicineName: string;
              genericName: string | null;
              groupName: string | null;
              companyName: string | null;
              defaultSalePrice: number;
              currentStock: number;
              lowStockThreshold: number;
              quantity: number;
              matchReason: string | null;
            }>;
          } | null;
          error?: string;
        }>(
          `/medicine-inventory/sale-packages?code=${encodeURIComponent(option.pkg.code)}`,
          { timeout: 8000 },
        );
        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.error || "Could not load medicine package");
        }
        if (response.data.data.items.length === 0) {
          throw new Error(`${option.pkg.operationName} package has no items to apply.`);
        }

        const resolvedPackage = response.data.data;
        const rows: Omit<MedicineSaleDraftItem, "clientId">[] =
          resolvedPackage.items.map((item) => ({
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
            admissionId: option.admission.admissionId,
            operationName: resolvedPackage.operationName,
            packageCode: resolvedPackage.code,
            packageItemName: item.templateName,
            matchReason: item.matchReason,
          }));
        applyPackage(rows);
        showNotification(
          `${resolvedPackage.operationName} package added for ${option.admission.admissionNumber}.`,
          "success",
        );
        setApplyConfirmOpen(false);
        setPendingPackageOption(null);
      } catch (error) {
        showNotification(
          error instanceof Error ? error.message : "Could not apply medicine package.",
          "error",
        );
      } finally {
        setIsApplyingPackage(false);
      }
    },
    [applyPackage, showNotification],
  );

  const requestApplyPackage = useCallback(
    (option: PackageOption) => {
      const alreadyAttached = option.admission.attachedPackageCodes.some(
        (code) => code.toUpperCase() === option.pkg.code.toUpperCase(),
      );
      if (alreadyAttached) {
        setPendingPackageOption(option);
        setApplyConfirmOpen(true);
        return;
      }
      void applyPackageOption(option);
    },
    [applyPackageOption],
  );

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
    setClearRowsConfirmOpen(true);
  }, [formData.items.length]);

  const confirmClearRows = useCallback(() => {
    clearRows();
    setClearRowsConfirmOpen(false);
  }, [clearRows]);

  const handlePatientChange = useCallback(
    (patient: SalePatientSelection | null) => {
      if (formData.items.length > 0) {
        setPendingPatientSelection(patient);
        setPatientChangeConfirmOpen(true);
        return;
      }
      setPatient(patient);
    },
    [formData.items.length, setPatient],
  );

  const confirmPatientChange = useCallback(() => {
    clearRows();
    setPatient(pendingPatientSelection);
    setPendingPatientSelection(null);
    setPatientChangeConfirmOpen(false);
  }, [clearRows, pendingPatientSelection, setPatient]);

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
      setCloseWithItemsConfirmOpen(true);
      return;
    }
    onClose();
  }, [isSubmitting, formData.items.length, onClose]);

  const confirmCloseWithItems = useCallback(() => {
    setCloseWithItemsConfirmOpen(false);
    onClose();
  }, [onClose]);

  const requestSubmit = useCallback(() => {
    if (isSubmitting) return;
    if (!isFormValid) {
      showNotification(
        validationError || "Please complete the cart before submitting.",
        "error",
      );
      return;
    }

    setSubmitConfirmOpen(true);
  }, [
    isFormValid,
    isSubmitting,
    showNotification,
    validationError,
  ]);

  const confirmSubmit = useCallback(() => {
    if (isSubmitting || !isFormValid || !formData.patient) return;

    const items = formData.items.flatMap((item) =>
      item.medicineId === null
        ? []
        : [
            {
              medicineId: item.medicineId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              admissionId: item.admissionId,
              packageCode: item.packageCode,
              operationName: item.operationName,
              packageItemName: item.packageItemName,
            },
          ],
    );

    if (items.length !== formData.items.length) {
      setSubmitConfirmOpen(false);
      showNotification(
        "Resolve or remove every unmatched medicine row before submitting.",
        "error",
      );
      return;
    }

    addBatchSale({
      patientId: formData.patient.id,
      saleDate: formData.saleDate.toISOString(),
      items,
    });
  }, [
    addBatchSale,
    formData.items,
    formData.patient,
    formData.saleDate,
    isFormValid,
    isSubmitting,
    showNotification,
  ]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSubmitting) return;
        if (submitConfirmOpen) {
          setSubmitConfirmOpen(false);
          return;
        }
        if (applyConfirmOpen) {
          setApplyConfirmOpen(false);
          return;
        }
        if (clearRowsConfirmOpen) {
          setClearRowsConfirmOpen(false);
          return;
        }
        if (patientChangeConfirmOpen) {
          setPatientChangeConfirmOpen(false);
          setPendingPatientSelection(null);
          return;
        }
        if (closeWithItemsConfirmOpen) {
          setCloseWithItemsConfirmOpen(false);
          return;
        }
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    applyConfirmOpen,
    clearRowsConfirmOpen,
    closeWithItemsConfirmOpen,
    handleClose,
    isOpen,
    isSubmitting,
    patientChangeConfirmOpen,
    submitConfirmOpen,
  ]);

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
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        resetForm();
        setApplyConfirmOpen(false);
        setClearRowsConfirmOpen(false);
        setPatientChangeConfirmOpen(false);
        setCloseWithItemsConfirmOpen(false);
        setSubmitConfirmOpen(false);
        setPendingPatientSelection(null);
      }}
    >
      {isOpen && (
        <motion.div
          key="sale-modal"
          className="fixed inset-0 z-100000 flex items-center justify-center bg-slate-900/70 sm:p-4"
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
          onClick={handleClose}
        >
          <motion.div
            ref={popupRef}
            className="popup-content flex h-[100dvh] max-h-none w-full max-w-full flex-col bg-white shadow-lg sm:h-auto sm:max-h-[94vh] sm:max-w-[95%] sm:rounded-3xl md:max-w-[90%] lg:max-w-[85%] xl:max-w-[78%]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
            }}
            onClick={(event) => event.stopPropagation()}
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
              className="flex-1 overflow-y-auto p-3 sm:p-6"
            >
              <div className="space-y-4 sm:space-y-5">
                {/* Patient + department admission context */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 sm:p-5">
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
                    {formData.patient && isLoadingPackageContext && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 flex items-center gap-2 text-xs text-gray-500"
                      >
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        Checking admission and package context…
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {formData.packageContext.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 flex flex-wrap items-center gap-2"
                      >
                        {formData.packageContext.slice(0, 4).map((admission) => (
                            <span
                              key={admission.admissionId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              {admission.departmentName} · {admission.admissionNumber}
                              <span className="text-indigo-500 font-normal">
                                ({admission.status})
                              </span>
                            </span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {formData.patient && isPackageContextError && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {packageContextError instanceof Error
                          ? packageContextError.message
                          : "Could not check patient admission context."}
                      </span>
                      <button
                        type="button"
                        onClick={() => void refetchPackageContext()}
                        className="font-bold underline underline-offset-2"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Sale actions</p>
                      <p className="text-[11px] text-slate-500">Add manually or apply a department preset.</p>
                    </div>
                    <Package className="h-4 w-4 text-slate-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <motion.button
                      type="button"
                      onClick={appendBlankRow}
                      disabled={isSubmitting}
                      whileTap={isSubmitting ? undefined : { scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add medicine
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => {
                        queryClient.invalidateQueries({
                          queryKey: ["medicine-inventory", "patient-package-context"],
                        });
                        queryClient.invalidateQueries({
                          queryKey: ["medicine-inventory", "sale-package-summaries"],
                        });
                      }}
                      disabled={isSubmitting}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      Refresh
                    </button>

                    {hasRows && (
                    <motion.button
                      type="button"
                      onClick={handleClearAllRows}
                      disabled={isSubmitting}
                      whileTap={isSubmitting ? undefined : { scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="col-span-2 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 sm:col-span-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                    </motion.button>
                    )}
                  </div>

                  {packageOptions.length > 0 && (
                    <div className="space-y-2 border-t border-slate-200 pt-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Available presets
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {packageOptions.map(({ pkg, admission }) => (
                          <motion.button
                            key={`${pkg.code}-${admission.admissionId}`}
                            type="button"
                            onClick={() => requestApplyPackage({ pkg, admission })}
                            disabled={
                              isSubmitting ||
                              isApplyingPackage ||
                              isLoadingPackageSummaries
                            }
                            whileTap={
                              isSubmitting || isApplyingPackage
                                ? undefined
                                : { scale: 0.97 }
                            }
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-pink-200 bg-white px-3 py-2.5 text-left text-pink-700 transition hover:border-pink-400 hover:bg-pink-50 disabled:opacity-50"
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pink-50">
                              {isApplyingPackage ? (
                                <Activity className="h-4 w-4 animate-pulse" />
                              ) : (
                                <Package className="h-4 w-4" />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold">
                                {pkg.operationName}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-medium text-pink-500">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {pkg.departmentName} · {admission.admissionNumber}
                              </span>
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {formData.patient && isPackageSummariesError && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {packageSummariesError instanceof Error
                        ? packageSummariesError.message
                        : "Could not load medicine packages."}
                    </span>
                    <button
                      type="button"
                      onClick={() => void refetchPackageSummaries()}
                      className="font-bold underline underline-offset-2"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {formData.patient &&
                  !isLoadingPackageContext &&
                  !isLoadingPackageSummaries &&
                  !isPackageContextError &&
                  !isPackageSummariesError &&
                  packageOptions.length === 0 && (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      No medicine package is configured for this patient’s department.
                    </p>
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
                      cart, or select a patient admission and use a department
                      package for the full template.
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
              onSubmit={requestSubmit}
              isSubmitting={isSubmitting}
              isDisabled={!isFormValid}
              cancelText="Cancel"
              submitText="Record Sale"
              loadingText="Saving..."
              submitIcon={Save}
              theme="indigo"
            />

          </motion.div>
        </motion.div>
      )}

      <ConfirmModal
        key="apply-package-confirmation"
        isOpen={applyConfirmOpen}
        title={`${pendingPackageOption?.pkg.operationName ?? "Medicine"} package already attached`}
        confirmLabel="Add anyway"
        cancelLabel="Cancel"
        variant="warning"
        onClose={() => {
          setApplyConfirmOpen(false);
          setPendingPackageOption(null);
        }}
        onConfirm={() => {
          if (pendingPackageOption) {
            void applyPackageOption(pendingPackageOption);
          }
        }}
        isLoading={isApplyingPackage}
        zIndex={100100}
        manageBodyScroll={false}
      >
        This admission already has this package attached. Applying it again
        adds fresh medicine rows to the current cart; it does not edit the
        existing admission rows.
      </ConfirmModal>

      <ConfirmModal
        key="clear-sale-items-confirmation"
        isOpen={clearRowsConfirmOpen}
        title="Clear all medicines?"
        confirmLabel="Clear"
        cancelLabel="Cancel"
        variant="destructive"
        onClose={() => setClearRowsConfirmOpen(false)}
        onConfirm={confirmClearRows}
        zIndex={100100}
        manageBodyScroll={false}
      >
        This will remove all {formData.items.length} medicine
        {formData.items.length !== 1 ? "s" : ""} from the cart. The action
        cannot be undone.
      </ConfirmModal>

      <ConfirmModal
        key="change-sale-patient-confirmation"
        isOpen={patientChangeConfirmOpen}
        title="Change patient?"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        variant="warning"
        onClose={() => {
          setPatientChangeConfirmOpen(false);
          setPendingPatientSelection(null);
        }}
        onConfirm={confirmPatientChange}
        zIndex={100100}
        manageBodyScroll={false}
      >
        {pendingPatientSelection
          ? "Changing the patient will clear the current cart. Added medicines will be lost."
          : "Clearing the patient will clear the current cart. Added medicines will be lost."}
      </ConfirmModal>

      <ConfirmModal
        key="discard-sale-cart-confirmation"
        isOpen={closeWithItemsConfirmOpen}
        title="Discard cart?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onClose={() => setCloseWithItemsConfirmOpen(false)}
        onConfirm={confirmCloseWithItems}
        zIndex={100100}
        manageBodyScroll={false}
      >
        Closing will discard the {formData.items.length} medicine
        {formData.items.length !== 1 ? "s" : ""} currently in the cart.
      </ConfirmModal>

      <ConfirmModal
        key="submit-sale-confirmation"
        isOpen={submitConfirmOpen}
        title="Confirm medicine sale"
        confirmLabel="Record Sale"
        cancelLabel="Review cart"
        variant="info"
        onClose={() => setSubmitConfirmOpen(false)}
        onConfirm={confirmSubmit}
        isLoading={isSubmitting}
        zIndex={100100}
        manageBodyScroll={false}
      >
        Record {formData.items.length} medicine
        {formData.items.length !== 1 ? "s" : ""} ({totalUnits} unit
        {totalUnits !== 1 ? "s" : ""}) for{" "}
        {formData.patient?.fullName ?? "the selected patient"} at{" "}
        {formatCurrency(totalAmount)}?
      </ConfirmModal>
    </AnimatePresence>
  );
};

export default AddSaleModal;
