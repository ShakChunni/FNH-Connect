"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wallet,
  AlertCircle,
  Package,
  Pill,
} from "lucide-react";
import { api } from "@/lib/axios";
import {
  useAdmissionDepartmentData,
  useAdmissionFinancialData,
  useAdmissionInfo,
  useAdmissionActions,
  useAdmissionMedicineChargeItems,
} from "../../../stores";
import { AdmissionMedicineChargeItem } from "../../../types";
import NumberInput from "@/components/form-sections/Fields/NumberInput";
import {
  AdmissionMedicineItemsTable,
  type PharmacyMedicineOption,
} from "../../AdmissionMedicineItemsTable";

interface AdmissionMedicinePackageItemResponse {
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
  unitPrice: number;
  totalAmount: number;
  matchReason: string | null;
}

interface AdmissionMedicinePackageResponse {
  code: string;
  name: string;
  operationName: string;
  items: AdmissionMedicinePackageItemResponse[];
}

interface AdmissionMedicinePackageApiResponse {
  success: boolean;
  data?: AdmissionMedicinePackageResponse;
  error?: string;
}

interface OldestPurchaseApiResponse {
  success: boolean;
  data: {
    company: {
      name: string;
    };
  } | null;
  error?: string;
}

const DEFAULT_PACKAGE_CODE = "LUCS_OT_MEDICINE";

const generateClientId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const FinancialInformation: React.FC = () => {
  const financialData = useAdmissionFinancialData();
  const admissionInfo = useAdmissionInfo();
  const departmentData = useAdmissionDepartmentData();
  const medicineChargeItems = useAdmissionMedicineChargeItems();
  const {
    setCharge,
    setDiscount,
    setPaidAmount,
    setAdmissionInfo,
    setMedicineChargeItems,
    updateMedicineChargeItem,
    removeMedicineChargeItem,
    clearMedicineChargeItems,
  } = useAdmissionActions();

  const isCanceled = admissionInfo.status === "Canceled";
  const hasItemizedMedicines = medicineChargeItems.length > 0;
  const isGynecologyDepartment = /gyn|gyne|gyna|obstet/i.test(
    departmentData.name,
  );

  const [packageData, setPackageData] =
    useState<AdmissionMedicinePackageResponse | null>(null);
  const [packageLoadError, setPackageLoadError] = useState<string | null>(
    null,
  );
  const [packagesLoaded, setPackagesLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [discountInput, setDiscountInput] = useState<number | "">(
    financialData.discountValue ?? "",
  );

  const loadPackage = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const response =
        await api.get<AdmissionMedicinePackageApiResponse>(
          `/admissions/medicine-packages?code=${DEFAULT_PACKAGE_CODE}`,
        );
      if (response.data.success && response.data.data) {
        setPackageData(response.data.data);
        setPackageLoadError(null);
      } else {
        setPackageLoadError(
          response.data.error || "Could not load medicine package.",
        );
      }
    } catch (error) {
      console.error("Failed to load medicine package:", error);
      setPackageLoadError(
        error instanceof Error
          ? error.message
          : "Could not load medicine package.",
      );
    } finally {
      setPackagesLoaded(true);
      if (showSpinner) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isGynecologyDepartment) {
      setPackageData(null);
      setPackageLoadError(null);
      setPackagesLoaded(false);
      return;
    }

    void loadPackage(false);
  }, [isGynecologyDepartment, loadPackage]);

  useEffect(() => {
    const storeVal = financialData.discountValue;
    if (storeVal === null && discountInput !== "") {
      setDiscountInput("");
    } else if (storeVal !== null && storeVal !== discountInput) {
      setDiscountInput(storeVal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialData.discountValue]);

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-green-900 focus:ring-2 focus:ring-green-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm";
    return (value: number | string | null, readonly: boolean = false) => {
      if (isCanceled || readonly) {
        return `bg-gray-100 border-2 border-gray-200 cursor-not-allowed ${baseStyle}`;
      }
      const hasValue = value !== null && value !== 0 && value !== "";
      return hasValue
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-white border-2 border-gray-300 ${baseStyle}`;
    };
  }, [isCanceled]);

  const handleNumberChange = (
    field: keyof typeof financialData,
    value: string,
  ) => {
    if (field === "medicineCharge" && hasItemizedMedicines) return;
    const numValue = value === "" ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      setCharge(field, numValue);
    }
  };

  const handleDiscountTypeChange = (type: "percentage" | "value") => {
    const currentVal = discountInput === "" ? null : discountInput;
    setDiscount(type, currentVal);
  };

  const handleDiscountInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    if (val === "") {
      setDiscountInput("");
      setDiscount(financialData.discountType || "value", null);
    } else {
      const numVal = Number(val);
      setDiscountInput(numVal);
      setDiscount(financialData.discountType || "value", numVal);
    }
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? 0 : Number(e.target.value);
    setPaidAmount(value);
  };

  const handlePackageSelect = useCallback(
    (pkg: AdmissionMedicinePackageResponse) => {
      if (isCanceled) return;

      const items: AdmissionMedicineChargeItem[] = pkg.items.map((it) => ({
        clientId: generateClientId(),
        medicineId: it.medicineId,
        packageCode: pkg.code,
        operationName: pkg.operationName,
        requestedMedicineName: it.templateName,
        medicineName: it.matched ? it.medicineName : it.templateName,
        genericName: it.genericName,
        groupName: it.groupName,
        companyName: it.companyName,
        quantity: 1,
        unitPrice: it.unitPrice,
        totalAmount: it.totalAmount,
        currentStock: it.currentStock,
        defaultSalePrice: it.defaultSalePrice,
        isMatched: it.matched,
      }));

      setMedicineChargeItems(items);
      setAdmissionInfo({ otType: pkg.operationName });
    },
    [isCanceled, setMedicineChargeItems, setAdmissionInfo],
  );

  const handleAddEmptyMedicineRow = useCallback(() => {
    if (isCanceled) return;
    const newRow: AdmissionMedicineChargeItem = {
      clientId: generateClientId(),
      medicineId: null,
      packageCode: null,
      operationName: admissionInfo.otType || "",
      requestedMedicineName: null,
      medicineName: "",
      genericName: null,
      groupName: null,
      companyName: null,
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      currentStock: 0,
      defaultSalePrice: 0,
      isMatched: false,
    };
    setMedicineChargeItems([...medicineChargeItems, newRow]);
  }, [
    isCanceled,
    admissionInfo.otType,
    medicineChargeItems,
    setMedicineChargeItems,
  ]);

  const handleSelectMedicine = useCallback(
    async (index: number, medicine: PharmacyMedicineOption) => {
      if (isCanceled) return;

      const displayName =
        (medicine.brandName ?? "").trim() || medicine.genericName;
      const defaultSalePrice = Number(medicine.defaultSalePrice);

      updateMedicineChargeItem(index, {
        medicineId: medicine.id,
        medicineName: displayName,
        genericName: medicine.genericName,
        groupName: medicine.group.name,
        companyName: null,
        unitPrice: defaultSalePrice,
        currentStock: medicine.currentStock,
        defaultSalePrice,
        isMatched: true,
      });

      try {
        const response = await api.get<OldestPurchaseApiResponse>(
          `/medicine-inventory/medicines/${medicine.id}/oldest-purchase`,
        );

        if (response.data.success && response.data.data) {
          updateMedicineChargeItem(index, {
            companyName: response.data.data.company.name,
          });
        }
      } catch (error) {
        console.error("Failed to load oldest purchase company:", error);
      }
    },
    [isCanceled, updateMedicineChargeItem],
  );

  const handleRefreshPharmacyValues = useCallback(async () => {
    if (isCanceled) return;
    setRefreshing(true);
    try {
      const refreshedRows: AdmissionMedicineChargeItem[] = await Promise.all(
        medicineChargeItems.map(async (item) => {
          if (item.medicineId === null) return item;
          try {
            const res = await api.get<{
              success: boolean;
              data: { id: number; genericName: string; brandName: string | null; defaultSalePrice: number; currentStock: number; group: { name: string } } | null;
            }>(`/medicine-inventory/medicines/${item.medicineId}`);
            const medicine = res.data.data;
            if (!medicine) return item;
            const displayName =
              (medicine.brandName ?? "").trim() || medicine.genericName;
            return {
              ...item,
              medicineName: displayName,
              genericName: medicine.genericName,
              groupName: medicine.group.name,
              currentStock: medicine.currentStock,
              unitPrice: Number(medicine.defaultSalePrice),
              totalAmount:
                item.quantity * Number(medicine.defaultSalePrice),
              defaultSalePrice: Number(medicine.defaultSalePrice),
              isMatched: true,
            };
          } catch {
            return item;
          }
        }),
      );
      setMedicineChargeItems(refreshedRows);
    } finally {
      setRefreshing(false);
    }
  }, [isCanceled, medicineChargeItems, setMedicineChargeItems]);

  const showRoomWarning =
    financialData.seatRent > 0 && !admissionInfo.seatNumber;

  type NumericChargeKey =
    | "serviceCharge"
    | "seatRent"
    | "otCharge"
    | "doctorCharge"
    | "surgeonCharge"
    | "anesthesiaFee"
    | "assistantDoctorFee"
    | "medicineCharge"
    | "otherCharges";

  const chargeFields: Array<{
    key: NumericChargeKey;
    label: string;
    showWarning?: boolean;
    forceReadonly?: boolean;
    helperText?: string;
  }> = [
    { key: "serviceCharge", label: "Service Charge" },
    { key: "seatRent", label: "Room / Seat Rent", showWarning: true },
    { key: "otCharge", label: "OT Charge" },
    { key: "doctorCharge", label: "Doctor Charge" },
    { key: "surgeonCharge", label: "Surgeon Charge" },
    { key: "anesthesiaFee", label: "Anesthesia Fee" },
    { key: "assistantDoctorFee", label: "Assistant Doctor Fee" },
    {
      key: "medicineCharge",
      label: "Medicine Charge",
      forceReadonly: hasItemizedMedicines,
      helperText: hasItemizedMedicines
        ? "Calculated from itemized medicines"
        : undefined,
    },
    { key: "otherCharges", label: "Other Charges" },
  ];

  const totalItems = packageData?.items.length ?? 0;
  const matchedCount =
    packageData?.items.filter((it) => it.matched).length ?? 0;
  const unmatchedCount = totalItems - matchedCount;

  return (
    <div id="financial" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      <div className="bg-linear-to-r from-green-50 to-emerald-100 border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md shrink-0">
            <Wallet className="text-green-600" size={28} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
              Financial Information
            </h3>
            <p className="text-green-700 text-[11px] sm:text-xs font-medium leading-tight transition-colors duration-300 mt-1">
              Charges, discounts, and payment details
            </p>
          </div>
        </div>
      </div>

      {isCanceled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 flex items-start gap-2 sm:gap-3">
          <AlertCircle className="text-red-600 w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-800 font-semibold text-xs sm:text-sm">
              Admission Canceled
            </h4>
            <p className="text-red-700 text-[11px] sm:text-xs mt-0.5">
              All charges have been set to ৳0. If any payment was made, please
              process a refund manually.
            </p>
          </div>
        </div>
      )}

      {isGynecologyDepartment && (
        <div className="mb-4 sm:mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Package className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-gray-700 text-xs sm:text-sm font-semibold">
              Gynecology Medicine Package
            </span>
          </div>

          {packageLoadError && (
            <p className="text-xs text-amber-600 mb-2">{packageLoadError}</p>
          )}

          {packagesLoaded && !packageData && !packageLoadError && (
            <p className="text-xs text-gray-500 mb-2">
              No gynecology medicine package configured.
            </p>
          )}

          {packageData && (
            <motion.button
              type="button"
              onClick={() => handlePackageSelect(packageData)}
              disabled={isCanceled}
              whileHover={isCanceled ? undefined : { scale: 1.005, y: -1 }}
              whileTap={isCanceled ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all duration-200 ${
                isCanceled
                  ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                  : "border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100 hover:shadow-sm cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-100 text-green-700">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-800">
                      Add all LUCS medicines
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {totalItems} medicine{totalItems !== 1 ? "s" : ""}{" "}
                      ·{" "}{matchedCount} matched
                      {unmatchedCount > 0
                        ? ` · ${unmatchedCount} unmatched`
                        : ""}
                    </p>
                  </div>
                </div>
                <motion.span
                  layout
                  className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Apply
                </motion.span>
              </div>
            </motion.button>
          )}
        </div>
      )}

      {/* Itemized Medicine Table */}
      <AnimatePresence initial={false}>
        {hasItemizedMedicines && (
          <motion.div
            key="medicine-table"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{
              opacity: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              scale: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
              y: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
            }}
            className="origin-top"
          >
            <AdmissionMedicineItemsTable
              items={medicineChargeItems}
              isCanceled={isCanceled}
              refreshing={refreshing}
              onUpdate={updateMedicineChargeItem}
              onSelectMedicine={handleSelectMedicine}
              onRemove={removeMedicineChargeItem}
              onAddRow={handleAddEmptyMedicineRow}
              onRefresh={handleRefreshPharmacyValues}
              onClearAll={clearMedicineChargeItems}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {!hasItemizedMedicines && !isCanceled && (
          <motion.div
            key="single-medicine-button"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
              mass: 0.8,
            }}
            className="mb-4 sm:mb-5 origin-top"
          >
            <motion.button
              type="button"
              onClick={handleAddEmptyMedicineRow}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 hover:border-emerald-500"
            >
              <Pill className="h-3.5 w-3.5" />
              Add a single pharmacy medicine
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 sm:space-y-5">
        {/* Admission Fee (Fixed) */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Admission Fee (Fixed)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
              ৳
            </span>
            <NumberInput
              className={`${inputClassName(
                financialData.admissionFee,
                true,
              )} pl-10`}
              value={financialData.admissionFee}
              readOnly
            />
          </div>
        </div>

        {/* Charges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chargeFields.map((field) => (
            <div key={field.key}>
              <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                {field.label}
                {field.showWarning && showRoomWarning && (
                  <AlertCircle className="w-4 h-4 inline ml-1 text-amber-500" />
                )}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  ৳
                </span>
                <NumberInput
                  className={`${inputClassName(
                    financialData[field.key],
                    field.forceReadonly ?? false,
                  )} pl-10`}
                  value={financialData[field.key] || ""}
                  onChange={(e) =>
                    handleNumberChange(field.key, e.target.value)
                  }
                  placeholder="0"
                  min="0"
                  readOnly={field.forceReadonly}
                />
              </div>
              {field.showWarning && showRoomWarning && (
                <p className="text-xs text-amber-600 mt-1">
                  Please fill room/seat number in Status section
                </p>
              )}
              {field.helperText && (
                <p className="text-xs text-green-600 mt-1">
                  {field.helperText}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Discount Section */}
        <div className="pt-4 border-t border-green-200">
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Discount
          </label>

          <div className="relative flex items-stretch rounded-lg border-2 border-gray-300 bg-white overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100 transition-all duration-300 h-12 md:h-14">
            <NumberInput
              className="flex-1 px-4 py-2 text-gray-700 font-normal outline-none text-xs sm:text-sm bg-transparent cursor-pointer"
              value={discountInput}
              onChange={handleDiscountInputChange}
              placeholder="Enter discount amount"
              min="0"
              max={
                financialData.discountType === "percentage"
                  ? 100
                  : financialData.totalAmount
              }
            />

            <div className="flex items-center border-l border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => handleDiscountTypeChange("percentage")}
                className={`px-3 sm:px-4 h-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  financialData.discountType === "percentage"
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => handleDiscountTypeChange("value")}
                className={`px-3 sm:px-4 h-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  financialData.discountType === "value"
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                ৳
              </button>
            </div>
          </div>

          {financialData.totalAmount > 0 && (
            <div className="mt-2 p-2.5 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Patient saves:</span>
                <span className="font-bold text-green-600">
                  ৳
                  {(financialData.discountAmount || 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )}
                  {financialData.discountType === "percentage" &&
                    discountInput !== "" &&
                    discountInput > 0 && (
                      <span className="text-gray-500 font-normal ml-1">
                        ({discountInput}%)
                      </span>
                    )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Grand Total (BDT){" "}
            <span className="text-[10px] font-normal text-gray-500">
              (After Discount)
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
              ৳
            </span>
            <NumberInput
              className={`${inputClassName(
                financialData.grandTotal,
                true,
              )} pl-10 font-bold text-green-600`}
              value={financialData.grandTotal}
              readOnly
              placeholder="0"
            />
          </div>
        </div>

        {/* Amount Paid and Due Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Amount Paid (BDT)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                ৳
              </span>
              <NumberInput
                className={`${inputClassName(
                  financialData.paidAmount,
                  false,
                )} pl-10`}
                value={financialData.paidAmount || ""}
                onChange={handlePaymentChange}
                placeholder="Enter payment amount"
                min={isCanceled ? "0" : "300"}
                max={financialData.grandTotal}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Amount collected from the patient
            </p>
          </div>

          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Due Amount (BDT){" "}
              <span className="text-[10px] font-normal text-gray-500">
                (Auto-calculated)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                ৳
              </span>
              <NumberInput
                className={`${inputClassName(
                  financialData.dueAmount,
                  true,
                )} pl-10 ${
                  financialData.dueAmount > 0
                    ? "text-orange-600 font-bold"
                    : "text-green-600 font-bold"
                }`}
                value={financialData.dueAmount}
                readOnly
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {financialData.dueAmount > 0
                ? "Remaining balance to be collected"
                : "Fully paid ✓"}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default FinancialInformation;
