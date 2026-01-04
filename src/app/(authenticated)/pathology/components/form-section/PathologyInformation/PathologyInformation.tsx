import React, { useMemo, useEffect, useState } from "react";
import { Beaker } from "lucide-react";
import {
  usePathologyPathologyInfo,
  usePathologyActions,
} from "../../../stores";
import PathologyTestsDropdown from "../../../../../../components/form-sections/Fields/PathologyTestsDropdown";
import OrderingDoctorDropdown from "./OrderingDoctorDropdown";

import NumberInput from "@/components/form-sections/Fields/NumberInput";

const PathologyInformation: React.FC = () => {
  const pathologyInfo = usePathologyPathologyInfo();
  // Destructure smart actions
  const { setPathologyInfo, setTestCharge, setDiscount, setPaidAmount } =
    usePathologyActions();

  // Destructure needed fields to avoid full object dependency
  const {
    testCharge,
    // paidAmount, // Not used directly in rendering input value (we use pathologyInfo.paidAmount) to avoid stale closure if we destructured
    // discountType, // We rely on store value
    // discountValue, // We rely on store value
    discountAmount,
    grandTotal,
    dueAmount,
  } = pathologyInfo;

  // Local state for discount input to handle empty strings gracefully while user types
  const [discountInput, setDiscountInput] = useState<number | "">("");

  // Sync local input with store ONLY when store changes (e.g. initial load or reset)
  // We use a ref to track if the change came from a local user event to avoid cursor jumps or fighting
  useEffect(() => {
    // Only check if it's strictly different null/undefined logic
    const storeVal = pathologyInfo.discountValue;
    if (storeVal === null && discountInput !== "") {
      setDiscountInput("");
    } else if (storeVal !== null && storeVal !== discountInput) {
      setDiscountInput(storeVal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathologyInfo.discountValue]);

  // Auto-fill test date with current BDT time on component mount
  useEffect(() => {
    if (!pathologyInfo.testDate) {
      // Get current time in BDT (UTC+6)
      const now = new Date();
      const bdtOffset = 6 * 60; // BDT is UTC+6
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const bdtTime = new Date(utcTime + bdtOffset * 60000);

      // Format as ISO string for date input (YYYY-MM-DD)
      const dateString = bdtTime.toISOString().split("T")[0];

      setPathologyInfo({
        ...pathologyInfo,
        testDate: dateString,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleTestsChange = (tests: string[], total: number) => {
    // This helper both updates specific fields via setPathologyInfo AND sets the charge for recalc
    setPathologyInfo({
      ...pathologyInfo,
      selectedTests: tests,
      testCharge: total, // Still update this just in case
    });
    // Trigger calculation using smart action
    setTestCharge(total);
  };

  const handleDiscountTypeChange = (type: "percentage" | "value") => {
    // Use smart action
    const currentVal = discountInput === "" ? null : discountInput;
    setDiscount(type, currentVal);
  };

  const handleDiscountInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value;
    if (val === "") {
      setDiscountInput("");
      setDiscount(pathologyInfo.discountType as "percentage" | "value", null);
    } else {
      const numVal = Number(val);
      setDiscountInput(numVal);
      setDiscount(pathologyInfo.discountType as "percentage" | "value", numVal);
    }
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? 0 : Number(e.target.value);
    setPaidAmount(value);
  };

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";
    return (value: string | number, readonly: boolean = false) => {
      if (readonly) {
        return `bg-gray-100 border-2 border-gray-200 cursor-not-allowed ${baseStyle}`;
      }
      return value
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-white border-2 border-gray-300 ${baseStyle}`;
    };
  }, []);

  // Handle discount input change - allow empty string for better UX
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setDiscountInput("");
    } else {
      setDiscountInput(Number(val));
    }
  };

  return (
    <div id="pathology" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      {/* Header */}
      <div className="bg-linear-to-r from-green-50 to-green-100 border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors duration-300">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-md shrink-0">
            <Beaker className="text-green-600" size={28} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
              Pathology Test Information
            </h3>
            <p className="text-green-700 text-[11px] sm:text-xs font-medium leading-tight">
              Select tests and configure payment details
            </p>
          </div>
        </div>
      </div>

      {/* Ordered By Doctor - At the top */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-800 mb-4">
          Ordering Doctor
        </h4>
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Ordered By<span className="text-red-500">*</span>
          </label>
          <OrderingDoctorDropdown
            value={pathologyInfo.orderedById}
            onSelect={(doctorId) =>
              setPathologyInfo({
                ...pathologyInfo,
                orderedById: doctorId,
              })
            }
            inputClassName={inputClassName(
              pathologyInfo.orderedById?.toString() || "",
              false
            )}
          />
          <p className="text-xs text-gray-500 mt-1">
            Select a doctor or &ldquo;Self&rdquo; if patient is self-referred
          </p>
        </div>
      </div>

      {/* Test Selection with New Dropdown Component */}
      <div className="mb-6">
        <PathologyTestsDropdown
          selectedTests={pathologyInfo.selectedTests}
          onTestsChange={handleTestsChange}
        />
      </div>

      {/* Test Date - Auto-filled, readonly */}
      <div className="mb-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-bold text-gray-800 mb-4">Test Details</h4>
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Test Date{" "}
            <span className="text-[10px] font-normal text-gray-500">
              (Auto-filled)
            </span>
          </label>
          <input
            type="text"
            className={inputClassName(pathologyInfo.testDate || "", true)}
            value={
              pathologyInfo.testDate
                ? (() => {
                    const d = new Date(pathologyInfo.testDate);
                    const day = String(d.getDate()).padStart(2, "0");
                    const month = String(d.getMonth() + 1).padStart(2, "0");
                    const year = d.getFullYear();
                    return `${day}/${month}/${year}`;
                  })()
                : ""
            }
            readOnly
            placeholder="Auto-filled with current date"
          />
          <p className="text-xs text-gray-500 mt-1">
            Test date is automatically set to today&apos;s date (Bangladesh
            Time)
          </p>
        </div>
      </div>

      {/* Financial Information - Simplified Layout */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-bold text-gray-800 mb-4">
          Financial Information
        </h4>

        <div className="space-y-4">
          {/* Test Charge (Auto-calculated - Readonly) - Full Width */}
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Test Charge (BDT){" "}
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
                  pathologyInfo.testCharge,
                  true
                )} pl-10 font-semibold`}
                value={pathologyInfo.testCharge}
                readOnly
                placeholder="Auto-calculated from selected tests"
              />
            </div>
          </div>

          {/* Discount with Integrated Type Switcher - Full Width */}
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Discount
            </label>

            {/* Input with integrated switcher */}
            <div className="relative flex items-stretch rounded-lg border-2 border-gray-300 bg-white overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100 transition-all duration-300 h-12 md:h-14">
              {/* Discount Input */}
              <NumberInput
                className="flex-1 px-4 py-2 text-gray-700 font-normal outline-none text-xs sm:text-sm bg-transparent cursor-pointer"
                value={discountInput}
                onChange={handleDiscountInputChange}
                placeholder="Enter discount amount"
                min="0"
                max={
                  pathologyInfo.discountType === "percentage"
                    ? 100
                    : pathologyInfo.testCharge
                }
              />

              {/* Integrated Type Switcher */}
              <div className="flex items-center border-l border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => handleDiscountTypeChange("percentage")}
                  className={`px-3 sm:px-4 h-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    pathologyInfo.discountType === "percentage"
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
                    pathologyInfo.discountType === "value"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  ৳
                </button>
              </div>
            </div>

            {/* Discount Summary - Always visible when there's a test charge */}
            {pathologyInfo.testCharge > 0 && (
              <div className="mt-2 p-2.5 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Patient saves:</span>
                  <span className="font-bold text-green-600">
                    ৳{(pathologyInfo.discountAmount || 0).toLocaleString()}
                    {pathologyInfo.discountType === "percentage" &&
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

          {/* Grand Total (Auto-calculated - Readonly) - Full Width */}
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
                  pathologyInfo.grandTotal,
                  true
                )} pl-10 font-bold text-green-600`}
                value={pathologyInfo.grandTotal}
                readOnly
                placeholder="0"
              />
            </div>
          </div>

          {/* Amount Paid and Due Amount - Side by side on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount Paid (Editable) */}
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
                    pathologyInfo.paidAmount,
                    false
                  )} pl-10`}
                  value={pathologyInfo.paidAmount || ""}
                  onChange={handlePaymentChange}
                  placeholder="Enter payment amount"
                  min="0"
                  max={pathologyInfo.grandTotal}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Amount collected from the patient
              </p>
            </div>

            {/* Due Amount (Auto-calculated - Readonly) */}
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
                    pathologyInfo.dueAmount,
                    true
                  )} pl-10 ${
                    pathologyInfo.dueAmount > 0
                      ? "text-orange-600 font-bold"
                      : "text-green-600 font-bold"
                  }`}
                  value={pathologyInfo.dueAmount}
                  readOnly
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {pathologyInfo.dueAmount > 0
                  ? "Remaining balance to be collected"
                  : "Fully paid ✓"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-bold text-gray-800 mb-4">
          Additional Information
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {/* Remarks */}
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Remarks / Notes
            </label>
            <textarea
              className={`${inputClassName(
                pathologyInfo.remarks,
                false
              )} resize-none`}
              value={pathologyInfo.remarks}
              onChange={(e) =>
                setPathologyInfo({
                  ...pathologyInfo,
                  remarks: e.target.value,
                })
              }
              placeholder="Additional notes or remarks"
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PathologyInformation);
