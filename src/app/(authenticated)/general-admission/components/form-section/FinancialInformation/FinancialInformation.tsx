import React, { useMemo, useEffect, useState } from "react";
import { Wallet, AlertCircle } from "lucide-react";
import {
  useAdmissionFinancialData,
  useAdmissionInfo,
  useAdmissionActions,
} from "../../../stores";
import { DiscountType } from "../../../types";
import NumberInput from "@/components/form-sections/Fields/NumberInput";

const FinancialInformation: React.FC = () => {
  const financialData = useAdmissionFinancialData();
  const admissionInfo = useAdmissionInfo();
  const { setFinancialData, setCharge, setDiscount, setPaidAmount } =
    useAdmissionActions();

  // Check if admission is canceled
  const isCanceled = admissionInfo.status === "Canceled";

  // Local state for discount input to handle empty strings gracefully
  const [discountInput, setDiscountInput] = useState<number | "">(
    financialData.discountValue ?? ""
  );

  // Sync local input with store when store changes
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
    value: string
  ) => {
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

  const showRoomWarning =
    financialData.seatRent > 0 && !admissionInfo.seatNumber;

  // Numeric charge field keys only
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

  // Charge field configuration for cleaner rendering
  const chargeFields: Array<{
    key: NumericChargeKey;
    label: string;
    showWarning?: boolean;
  }> = [
    { key: "serviceCharge", label: "Service Charge" },
    { key: "seatRent", label: "Room / Seat Rent", showWarning: true },
    { key: "otCharge", label: "OT Charge" },
    { key: "doctorCharge", label: "Doctor Charge" },
    { key: "surgeonCharge", label: "Surgeon Charge" },
    { key: "anesthesiaFee", label: "Anesthesia Fee" },
    { key: "assistantDoctorFee", label: "Assistant Doctor Fee" },
    { key: "medicineCharge", label: "Medicine Charge" },
    { key: "otherCharges", label: "Other Charges" },
  ];

  return (
    <div id="financial" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      {/* Header - matching pathology section style */}
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

      {/* Canceled Warning Banner */}
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

      {/* Form Content */}
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
                    financialData[field.key]
                  )} pl-10`}
                  value={financialData[field.key] || ""}
                  onChange={(e) =>
                    handleNumberChange(field.key, e.target.value)
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
              {field.showWarning && showRoomWarning && (
                <p className="text-xs text-amber-600 mt-1">
                  Please fill room/seat number in Status section
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Discount Section - Matching Pathology Style */}
        <div className="pt-4 border-t border-green-200">
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Discount
          </label>

          {/* Input with integrated type switcher */}
          <div className="relative flex items-stretch rounded-lg border-2 border-gray-300 bg-white overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100 transition-all duration-300 h-12 md:h-14">
            {/* Discount Input */}
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

            {/* Integrated Type Switcher */}
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

          {/* Discount Summary */}
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

        {/* Amount Paid and Due Amount - Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount Paid */}
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

          {/* Due Amount */}
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
