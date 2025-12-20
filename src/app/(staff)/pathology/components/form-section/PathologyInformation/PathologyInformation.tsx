import React, { useMemo, useEffect, useState } from "react";
import { Beaker } from "lucide-react";
import {
  usePathologyPathologyInfo,
  usePathologyActions,
} from "../../../stores";
import PathologyTestsDropdown from "../../../../../../components/form-sections/Fields/PathologyTestsDropdown";
import OrderingDoctorDropdown from "./OrderingDoctorDropdown";

const PathologyInformation: React.FC = () => {
  const pathologyInfo = usePathologyPathologyInfo();
  const { setPathologyInfo } = usePathologyActions();

  // Discount type: 'percentage' or 'value'
  // Initialize from store to preserve existing values during edit
  const [discountType, setDiscountType] = useState<"percentage" | "value">(
    pathologyInfo.discountAmount ? "value" : "percentage"
  );
  const [discountInput, setDiscountInput] = useState<number | "">(
    pathologyInfo.discountAmount ?? ""
  );

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
  }, []); // Only run on mount

  // Calculate financial fields automatically
  // Using specific values to avoid stale closure issues
  const testCharge = pathologyInfo.testCharge || 0;

  useEffect(() => {
    let newDiscountAmount: number | null = null;
    let effectiveDiscount = 0;

    // Calculate discount based on type if input is present
    if (discountInput !== "") {
      if (discountType === "percentage") {
        newDiscountAmount = (testCharge * discountInput) / 100;
      } else {
        newDiscountAmount = discountInput;
      }
      effectiveDiscount = newDiscountAmount;
    }

    const grandTotal = Math.max(0, testCharge - effectiveDiscount);
    // Calculate dueAmount based on current paidAmount
    const currentPaidAmount = pathologyInfo.paidAmount || 0;
    const dueAmount = Math.max(0, grandTotal - currentPaidAmount);

    // Only update if values actually changed to avoid infinite loop
    if (
      (pathologyInfo.discountAmount ?? null) !== newDiscountAmount ||
      pathologyInfo.grandTotal !== grandTotal ||
      pathologyInfo.dueAmount !== dueAmount
    ) {
      setPathologyInfo({
        ...pathologyInfo,
        discountAmount: newDiscountAmount,
        grandTotal,
        dueAmount,
      });
    }
  }, [
    testCharge,
    discountInput,
    discountType,
    pathologyInfo,
    setPathologyInfo,
  ]);

  // Handle payment input change
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 0;
    const grandTotal = pathologyInfo.grandTotal || 0;
    // Don't allow payment exceeding grand total
    const paidAmount = Math.min(value, grandTotal);
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    setPathologyInfo({
      ...pathologyInfo,
      paidAmount,
      dueAmount,
    });
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
            <h3 className="text-md sm:text-lg md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 leading-tight">
              Pathology Test Information
            </h3>
            <p className="text-green-700 text-xs sm:text-sm font-medium leading-tight">
              Select tests and configure payment details
            </p>
          </div>
        </div>
      </div>

      {/* Ordered By Doctor - At the top */}
      <div className="mb-6">
        <h4 className="text-md font-bold text-gray-800 mb-4">
          Ordering Doctor
        </h4>
        <div>
          <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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
          onTestsChange={(tests, total) =>
            setPathologyInfo({
              ...pathologyInfo,
              selectedTests: tests,
              testCharge: total,
            })
          }
        />
      </div>

      {/* Test Date - Auto-filled, readonly */}
      <div className="mb-6 pt-6 border-t border-gray-200">
        <h4 className="text-md font-bold text-gray-800 mb-4">Test Details</h4>
        <div>
          <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
            Test Date{" "}
            <span className="text-xs font-normal text-gray-500">
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
        <h4 className="text-md font-bold text-gray-800 mb-4">
          Financial Information
        </h4>

        <div className="space-y-4">
          {/* Test Charge (Auto-calculated - Readonly) - Full Width */}
          <div>
            <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
              Test Charge (BDT){" "}
              <span className="text-xs font-normal text-gray-500">
                (Auto-calculated)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                ৳
              </span>
              <input
                type="number"
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
            <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
              Discount
            </label>

            {/* Input with integrated switcher */}
            <div className="relative flex items-stretch rounded-lg border-2 border-gray-300 bg-white overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100 transition-all duration-300 h-12 md:h-14">
              {/* Discount Input */}
              <input
                type="number"
                className="flex-1 px-4 py-2 text-gray-700 font-normal outline-none text-xs sm:text-sm bg-transparent cursor-pointer"
                value={discountInput}
                onChange={handleDiscountChange}
                placeholder="Enter discount amount"
                min="0"
                max={
                  discountType === "percentage" ? 100 : pathologyInfo.testCharge
                }
              />

              {/* Integrated Type Switcher */}
              <div className="flex items-center border-l border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setDiscountType("percentage")}
                  className={`px-3 sm:px-4 h-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    discountType === "percentage"
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("value")}
                  className={`px-3 sm:px-4 h-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    discountType === "value"
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Patient saves:</span>
                  <span className="font-bold text-green-600">
                    ৳{(pathologyInfo.discountAmount || 0).toLocaleString()}
                    {discountType === "percentage" &&
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
            <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
              Grand Total (BDT){" "}
              <span className="text-xs font-normal text-gray-500">
                (After Discount)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                ৳
              </span>
              <input
                type="number"
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
              <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
                Amount Paid (BDT)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  ৳
                </span>
                <input
                  type="number"
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
              <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
                Due Amount (BDT){" "}
                <span className="text-xs font-normal text-gray-500">
                  (Auto-calculated)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  ৳
                </span>
                <input
                  type="number"
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
        <h4 className="text-md font-bold text-gray-800 mb-4">
          Additional Information
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {/* Remarks */}
          <div>
            <label className="block text-gray-700 text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">
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
