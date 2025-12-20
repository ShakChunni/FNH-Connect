import React, { useMemo, useEffect } from "react";
import { Wallet, Percent, DollarSign, AlertCircle } from "lucide-react";
import {
  useAdmissionFinancialData,
  useAdmissionInfo,
  useAdmissionActions,
} from "../../../stores";
import { DiscountType } from "../../../types";

const FinancialInformation: React.FC = () => {
  const financialData = useAdmissionFinancialData();
  const admissionInfo = useAdmissionInfo();
  const { updateFinancialData, setFinancialData, calculateTotals } =
    useAdmissionActions();

  // Recalculate totals when financial data changes
  useEffect(() => {
    calculateTotals();
  }, [
    financialData.serviceCharge,
    financialData.seatRent,
    financialData.otCharge,
    financialData.medicineCharge,
    financialData.otherCharges,
    financialData.discountType,
    financialData.discountValue,
    financialData.paidAmount,
    calculateTotals,
  ]);

  const inputClassName = useMemo(() => {
    const baseStyle =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-green-900 focus:ring-2 focus:ring-green-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";
    return (value: number | null, disabled: boolean = false) => {
      if (disabled) {
        return `bg-gray-200 border-2 border-gray-300 cursor-not-allowed ${baseStyle}`;
      }
      const hasValue = value !== null && value !== 0;
      return hasValue
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-gray-50 border-2 border-gray-300 ${baseStyle}`;
    };
  }, []);

  const handleNumberChange = (
    field: keyof typeof financialData,
    value: string
  ) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    if (!isNaN(numValue)) {
      setFinancialData({ [field]: numValue });
    }
  };

  const handleDiscountTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value as DiscountType;
    setFinancialData({
      discountType: value || null,
      discountValue: value ? financialData.discountValue : null,
      discountAmount: 0,
    });
  };

  const showRoomWarning =
    financialData.seatRent > 0 && !admissionInfo.seatNumber;

  return (
    <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-6 md:p-8 border border-green-100 shadow-sm">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center">
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
            Financial Information
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Charges, discounts, and payment details
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Admission Fee (Fixed) */}
        <div>
          <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Admission Fee (Fixed)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
              ৳
            </span>
            <input
              type="number"
              className={`${inputClassName(
                financialData.admissionFee,
                true
              )} pl-8`}
              value={financialData.admissionFee}
              readOnly
            />
          </div>
        </div>

        {/* Charges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Service Charge
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ৳
              </span>
              <input
                type="number"
                className={`${inputClassName(
                  financialData.serviceCharge
                )} pl-8`}
                value={financialData.serviceCharge || ""}
                onChange={(e) =>
                  handleNumberChange("serviceCharge", e.target.value)
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Room / Seat Rent
              {showRoomWarning && (
                <AlertCircle className="w-4 h-4 inline ml-1 text-amber-500" />
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ৳
              </span>
              <input
                type="number"
                className={`${inputClassName(financialData.seatRent)} pl-8`}
                value={financialData.seatRent || ""}
                onChange={(e) => handleNumberChange("seatRent", e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            {showRoomWarning && (
              <p className="text-xs text-amber-600 mt-1">
                Please fill room/seat number in Status section
              </p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              OT Charge
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ৳
              </span>
              <input
                type="number"
                className={`${inputClassName(financialData.otCharge)} pl-8`}
                value={financialData.otCharge || ""}
                onChange={(e) => handleNumberChange("otCharge", e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Medicine Charge
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ৳
              </span>
              <input
                type="number"
                className={`${inputClassName(
                  financialData.medicineCharge
                )} pl-8`}
                value={financialData.medicineCharge || ""}
                onChange={(e) =>
                  handleNumberChange("medicineCharge", e.target.value)
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Other Charges
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ৳
              </span>
              <input
                type="number"
                className={`${inputClassName(financialData.otherCharges)} pl-8`}
                value={financialData.otherCharges || ""}
                onChange={(e) =>
                  handleNumberChange("otherCharges", e.target.value)
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Discount Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-green-200">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Discount Type
            </label>
            <select
              className={inputClassName(financialData.discountType ? 1 : 0)}
              value={financialData.discountType || ""}
              onChange={handleDiscountTypeChange}
            >
              <option value="">No Discount</option>
              <option value="percentage">Percentage (%)</option>
              <option value="value">Fixed Amount (৳)</option>
            </select>
          </div>
          {financialData.discountType && (
            <div>
              <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                Discount Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {financialData.discountType === "percentage" ? (
                    <Percent className="w-4 h-4" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                </span>
                <input
                  type="number"
                  className={`${inputClassName(
                    financialData.discountValue
                  )} pl-10`}
                  value={financialData.discountValue ?? ""}
                  onChange={(e) =>
                    handleNumberChange("discountValue", e.target.value)
                  }
                  placeholder="0"
                  min="0"
                  max={
                    financialData.discountType === "percentage"
                      ? 100
                      : undefined
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-green-200 bg-green-100/50 rounded-xl p-4">
          <div>
            <label className="block text-gray-600 text-xs font-medium mb-1">
              Total Amount
            </label>
            <p className="text-lg font-bold text-gray-800">
              ৳ {financialData.totalAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <label className="block text-gray-600 text-xs font-medium mb-1">
              Discount
            </label>
            <p className="text-lg font-bold text-red-600">
              - ৳ {financialData.discountAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <label className="block text-gray-600 text-xs font-medium mb-1">
              Grand Total
            </label>
            <p className="text-xl font-bold text-green-700">
              ৳ {financialData.grandTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Paid Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ৳
              </span>
              <input
                type="number"
                className={`${inputClassName(financialData.paidAmount)} pl-8`}
                value={financialData.paidAmount || ""}
                onChange={(e) =>
                  handleNumberChange("paidAmount", e.target.value)
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Due Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ৳
              </span>
              <input
                type="number"
                className={`${inputClassName(
                  financialData.dueAmount,
                  true
                )} pl-8 ${
                  financialData.dueAmount > 0
                    ? "border-red-500! bg-red-50!"
                    : ""
                }`}
                value={financialData.dueAmount}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialInformation;
