"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import { Wallet, AlertCircle, Package, Trash2 } from "lucide-react";
import {
  useAdmissionFinancialData,
  useAdmissionInfo,
  useAdmissionActions,
  useAdmissionMedicineChargeItems,
} from "../../../stores";
import { AdmissionMedicineChargeItem } from "../../../types";
import NumberInput from "@/components/form-sections/Fields/NumberInput";

interface GynecologyMedicinePackage {
  operationName: string;
  packageCode: string | null;
  medicines: {
    medicineName: string;
    genericName: string | null;
    groupName: string | null;
    companyName: string | null;
    quantity: number;
    unitPrice: number;
  }[];
}

function parsePackageJson(data: unknown): GynecologyMedicinePackage[] {
  if (!Array.isArray(data)) return [];

  const result: GynecologyMedicinePackage[] = [];

  for (const raw of data) {
    if (typeof raw !== "object" || raw === null) continue;
    const obj = raw as Record<string, unknown>;

    const operationName =
      typeof obj["Operation Name"] === "string"
        ? obj["Operation Name"].trim()
        : "";
    if (!operationName) continue;

    const packageCode =
      typeof obj["Package Code"] === "string"
        ? obj["Package Code"].trim() || null
        : null;

    const rawMedicines = Array.isArray(obj["Medicines"])
      ? obj["Medicines"]
      : [];

    const medicines: GynecologyMedicinePackage["medicines"] = [];

    for (const rawMed of rawMedicines) {
      if (typeof rawMed !== "object" || rawMed === null) continue;
      const med = rawMed as Record<string, unknown>;

      const medicineName =
        typeof med["Medicine Name"] === "string"
          ? med["Medicine Name"].trim()
          : "";
      if (!medicineName) continue;

      const qty =
        typeof med["Qty"] === "number" && med["Qty"] > 0
          ? Math.trunc(med["Qty"])
          : 0;
      if (qty <= 0) continue;

      const price =
        typeof med["Price"] === "number" && med["Price"] >= 0
          ? med["Price"]
          : 0;

      medicines.push({
        medicineName,
        genericName:
          typeof med["Generic Name"] === "string"
            ? med["Generic Name"].trim() || null
            : null,
        groupName:
          typeof med["Group"] === "string"
            ? med["Group"].trim() || null
            : null,
        companyName:
          typeof med["Company Name"] === "string"
            ? med["Company Name"].trim() || null
            : null,
        quantity: qty,
        unitPrice: price,
      });
    }

    if (medicines.length === 0) continue;

    result.push({ operationName, packageCode, medicines });
  }

  return result;
}

const FinancialInformation: React.FC = () => {
  const financialData = useAdmissionFinancialData();
  const admissionInfo = useAdmissionInfo();
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

  const [packages, setPackages] = useState<GynecologyMedicinePackage[]>([]);
  const [packageLoadError, setPackageLoadError] = useState<string | null>(null);
  const [packagesLoaded, setPackagesLoaded] = useState(false);

  const [discountInput, setDiscountInput] = useState<number | "">(
    financialData.discountValue ?? ""
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/gynecology-medicine-packages.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        const parsed = parsePackageJson(data);
        setPackages(parsed);
        setPackagesLoaded(true);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load gynecology medicine packages:", error);
        setPackageLoadError("Could not load medicine packages.");
        setPackagesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const smallInputClassName =
    "text-gray-700 font-normal rounded-lg h-9 py-1 px-2 w-full focus:border-green-900 focus:ring-2 focus:ring-green-950 outline-none shadow-sm text-xs";

  const handleNumberChange = (
    field: keyof typeof financialData,
    value: string
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
    e: React.ChangeEvent<HTMLInputElement>
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
    (pkg: GynecologyMedicinePackage) => {
      if (isCanceled) return;

      const items: AdmissionMedicineChargeItem[] = pkg.medicines.map((med) => ({
        packageCode: pkg.packageCode,
        operationName: pkg.operationName,
        medicineName: med.medicineName,
        genericName: med.genericName,
        groupName: med.groupName,
        companyName: med.companyName,
        quantity: med.quantity,
        unitPrice: med.unitPrice,
        totalAmount: med.quantity * med.unitPrice,
      }));

      setMedicineChargeItems(items);
      setAdmissionInfo({ otType: pkg.operationName });
    },
    [isCanceled, setMedicineChargeItems, setAdmissionInfo]
  );

  const handleItemFieldChange = useCallback(
    (index: number, field: string, value: string | number) => {
      if (isCanceled) return;
      updateMedicineChargeItem(index, { [field]: value });
    },
    [isCanceled, updateMedicineChargeItem]
  );

  const handleRemoveItem = useCallback(
    (index: number) => {
      if (isCanceled) return;
      removeMedicineChargeItem(index);
    },
    [isCanceled, removeMedicineChargeItem]
  );

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

      {/* Medicine Package Selector */}
      <div className="mb-4 sm:mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-4 h-4 text-green-600" />
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
            Medicine Package
          </label>
        </div>

        {packageLoadError && (
          <p className="text-xs text-amber-600 mb-2">{packageLoadError}</p>
        )}

        {packagesLoaded && packages.length === 0 && !packageLoadError && (
          <p className="text-xs text-gray-500 mb-2">
            No operation medicine packages configured.
          </p>
        )}

        {packages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {packages.map((pkg, idx) => {
              const total = pkg.medicines.reduce(
                (sum, m) => sum + m.quantity * m.unitPrice,
                0
              );
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePackageSelect(pkg)}
                  disabled={isCanceled}
                  className={`text-left p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    isCanceled
                      ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100"
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-800">
                    {pkg.operationName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {pkg.medicines.length} medicine
                    {pkg.medicines.length !== 1 ? "s" : ""} · ৳
                    {total.toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Itemized Medicine Table */}
      {hasItemizedMedicines && (
        <div className="mb-4 sm:mb-5 overflow-x-auto">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold">
              Itemized Medicines
            </label>
            <button
              type="button"
              onClick={clearMedicineChargeItems}
              disabled={isCanceled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear package
            </button>
          </div>
          <table className="w-full min-w-[900px] text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-2 py-2 text-left font-semibold">Medicine</th>
                <th className="px-2 py-2 text-left font-semibold">Generic</th>
                <th className="px-2 py-2 text-left font-semibold">Group</th>
                <th className="px-2 py-2 text-left font-semibold">Company</th>
                <th className="px-2 py-2 text-center font-semibold w-16">
                  Qty
                </th>
                <th className="px-2 py-2 text-right font-semibold w-24">
                  Unit Price
                </th>
                <th className="px-2 py-2 text-right font-semibold w-24">
                  Total
                </th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {medicineChargeItems.map((item, index) => (
                <tr
                  key={
                    item.id
                      ? `saved-${item.id}`
                      : `${item.packageCode ?? "package"}-${
                          item.operationName
                        }-${item.medicineName}-${index}`
                  }
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={item.medicineName}
                      onChange={(e) =>
                        handleItemFieldChange(
                          index,
                          "medicineName",
                          e.target.value
                        )
                      }
                      disabled={isCanceled}
                      className={`${smallInputClassName} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={item.genericName ?? ""}
                      onChange={(e) =>
                        handleItemFieldChange(
                          index,
                          "genericName",
                          e.target.value
                        )
                      }
                      disabled={isCanceled}
                      className={`${smallInputClassName} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={item.groupName ?? ""}
                      onChange={(e) =>
                        handleItemFieldChange(
                          index,
                          "groupName",
                          e.target.value
                        )
                      }
                      disabled={isCanceled}
                      className={`${smallInputClassName} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={item.companyName ?? ""}
                      onChange={(e) =>
                        handleItemFieldChange(
                          index,
                          "companyName",
                          e.target.value
                        )
                      }
                      disabled={isCanceled}
                      className={`${smallInputClassName} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemFieldChange(
                          index,
                          "quantity",
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      disabled={isCanceled}
                      min={1}
                      className={`${smallInputClassName} text-center disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemFieldChange(
                          index,
                          "unitPrice",
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      disabled={isCanceled}
                      min={0}
                      className={`${smallInputClassName} text-right disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                  </td>
                  <td className="px-2 py-1 text-right font-semibold text-gray-700">
                    ৳{item.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isCanceled}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                true
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
                    field.forceReadonly ?? false
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
                  ৳{(financialData.discountAmount || 0).toLocaleString()}
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
                true
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
                  false
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
                  true
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
