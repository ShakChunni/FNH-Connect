"use client";

/**
 * Medicine Information Section
 *
 * Owns the General Admission medicine workflow: LUCS package apply,
 * manual row add/select, row edit/remove, stock refresh, and unmatched
 * resolution. The actual row rendering still lives in
 * `AdmissionMedicineItemsTable` so legacy admissions continue to render
 * the same data shape; this section is responsible for
 * loading/manipulating the cart and surfacing a compact summary card.
 *
 * In inventory-only mode (`medicineBillingEnabled === false`), this
 * component also produces a quantity-only preview used by the printable
 * receipt. In legacy billable mode, the original price/total display
 * remains intact.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Package, Pill } from "lucide-react";
import { api } from "@/lib/axios";
import {
  useAdmissionDepartmentData,
  useAdmissionInfo,
  useAdmissionActions,
  useAdmissionMedicineChargeItems,
} from "../../../stores";
import { AdmissionMedicineChargeItem } from "../../../types";
import { isGynecologyDepartment } from "@/lib/departmentRecognition";
import {
  AdmissionMedicineItemsTable,
  type PharmacyMedicineOption,
} from "../../AdmissionMedicineItemsTable";

const DEFAULT_PACKAGE_CODE = "LUCS_OT_MEDICINE";

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
    company: { name: string };
  } | null;
  error?: string;
}

const generateClientId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

interface MedicineInformationProps {
  medicineBillingEnabled: boolean;
}

const MedicineInformation: React.FC<MedicineInformationProps> = ({
  medicineBillingEnabled,
}) => {
  const admissionInfo = useAdmissionInfo();
  const departmentData = useAdmissionDepartmentData();
  const medicineChargeItems = useAdmissionMedicineChargeItems();
  const {
    setAdmissionInfo,
    setMedicineChargeItems,
    updateMedicineChargeItem,
    removeMedicineChargeItem,
    clearMedicineChargeItems,
  } = useAdmissionActions();

  const isCanceled = admissionInfo.status === "Canceled";
  const hasItemizedMedicines = medicineChargeItems.length > 0;
  const isGynecology = isGynecologyDepartment(departmentData.name);

  const [packageData, setPackageData] =
    useState<AdmissionMedicinePackageResponse | null>(null);
  const [packageLoadError, setPackageLoadError] = useState<string | null>(
    null,
  );
  const [packagesLoaded, setPackagesLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    if (!isGynecology) {
      setPackageData(null);
      setPackageLoadError(null);
      setPackagesLoaded(false);
      return;
    }
    void loadPackage(false);
  }, [isGynecology, loadPackage]);

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
    [isCanceled, setAdmissionInfo, setMedicineChargeItems],
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
              data: {
                id: number;
                genericName: string;
                brandName: string | null;
                defaultSalePrice: number;
                currentStock: number;
                group: { name: string };
              } | null;
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

  const totalItems = packageData?.items.length ?? 0;
  const matchedCount = packageData?.items.filter((it) => it.matched).length ?? 0;
  const unmatchedCount = totalItems - matchedCount;

  const totalQuantity = useMemo(
    () => medicineChargeItems.reduce((sum, i) => sum + i.quantity, 0),
    [medicineChargeItems],
  );

  return (
    <div id="medicines" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      <div className="bg-linear-to-r from-emerald-50 to-teal-100 border-emerald-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md shrink-0">
            <Pill className="text-emerald-600" size={28} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
              Medicines
            </h3>
            <p className="text-emerald-700 text-[11px] sm:text-xs font-medium leading-tight transition-colors duration-300 mt-1">
              {medicineBillingEnabled
                ? "Legacy billable medicines — these rows affect the admission invoice."
                : "Inventory-only — stock is deducted but no charge is added to admission billing."}
            </p>
          </div>
        </div>
      </div>

      {medicineBillingEnabled && (
        <div className="mb-4 sm:mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            <strong>Legacy admission:</strong> medicine billing is preserved
            for this record. Prices and totals behave as they did before the
            inventory-only change.
          </p>
        </div>
      )}

      {isCanceled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 flex items-start gap-2 sm:gap-3">
          <AlertCircle className="text-red-600 w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-800 font-semibold text-xs sm:text-sm">
              Admission Canceled
            </h4>
            <p className="text-red-700 text-[11px] sm:text-xs mt-0.5">
              All medicines have been cleared. Stock was already restored
              when the admission was canceled.
            </p>
          </div>
        </div>
      )}

      {isGynecology && (
        <div className="mb-4 sm:mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <Package className="w-4 h-4 text-emerald-600 shrink-0" />
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
                  : "border-emerald-300 bg-emerald-50 hover:border-emerald-500 hover:bg-emerald-100 hover:shadow-sm cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-800">
                      Add all LUCS medicines
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {totalItems} medicine{totalItems !== 1 ? "s" : ""} ·{" "}
                      {matchedCount} matched
                      {unmatchedCount > 0
                        ? ` · ${unmatchedCount} unmatched`
                        : ""}
                    </p>
                  </div>
                </div>
                <motion.span
                  layout
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Apply
                </motion.span>
              </div>
            </motion.button>
          )}
        </div>
      )}

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
              inventoryOnly={!medicineBillingEnabled}
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

      {hasItemizedMedicines && !medicineBillingEnabled && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 sm:p-4 text-xs text-emerald-900">
          <p className="font-semibold">
            {medicineChargeItems.length} medicine
            {medicineChargeItems.length !== 1 ? "s" : ""} · {totalQuantity}{" "}
            unit{totalQuantity !== 1 ? "s" : ""} (inventory only)
          </p>
          <p className="text-emerald-800/80 mt-1">
            These medicines will be deducted from pharmacy stock and printed
            as a quantity-only section on the receipt. They are not included
            in admission billing.
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicineInformation;
