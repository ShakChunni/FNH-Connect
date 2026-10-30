/**
 * Financial Information Section (post inventory-only change)
 *
 * Owns only the financial inputs and totals. Medicine rows are managed
 * by the `MedicineInformation` section. When `medicineBillingEnabled` is
 * false (the default for new admissions), `medicineCharge` is hidden
 * entirely because the effective billed value is always zero in that
 * mode.
 */

import React, { useMemo } from "react";
import { Wallet, AlertCircle } from "lucide-react";
import NumberInput from "@/components/form-sections/Fields/NumberInput";
import {
  useAdmissionFinancialData,
  useAdmissionInfo,
  useAdmissionActions,
  useAdmissionMedicineChargeItems,
} from "../../../stores";

interface FinancialInformationProps {
  medicineBillingEnabled: boolean;
}

const FinancialInformation: React.FC<FinancialInformationProps> = ({
  medicineBillingEnabled,
}) => {
  const financialData = useAdmissionFinancialData();
  const admissionInfo = useAdmissionInfo();
  const medicineChargeItems = useAdmissionMedicineChargeItems();
  const { setCharge, setDiscount, setPaidAmount } = useAdmissionActions();

  const isCanceled = admissionInfo.status === "Canceled";
  const hasItemizedMedicines = medicineChargeItems.length > 0;

  const [discountInput, setDiscountInput] = React.useState<number | "">(
    financialData.discountValue ?? "",
  );

  React.useEffect(() => {
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
      "text-slate-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-green-900 focus:ring-2 focus:ring-green-950 outline-none shadow-sm transition-colors tabular-nums placeholder:text-slate-400 placeholder:font-light text-xs sm:text-sm";
    return (value: number | string | null, readonly: boolean = false) => {
      if (isCanceled || readonly) {
        return `bg-slate-100 border-2 border-slate-200 cursor-not-allowed ${baseStyle}`;
      }
      const hasValue = value !== null && value !== 0 && value !== "";
      return hasValue
        ? `bg-white border-2 border-green-700 ${baseStyle}`
        : `bg-white border-2 border-slate-300 ${baseStyle}`;
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

  const showRoomWarning =
    financialData.seatRent > 0 && !admissionInfo.seatNumber;

  type ChargeKey =
    | "serviceCharge"
    | "seatRent"
    | "otCharge"
    | "doctorCharge"
    | "surgeonCharge"
    | "anesthesiaFee"
    | "assistantDoctorFee"
    | "otherCharges";

  const chargeFields: Array<{
    key: ChargeKey;
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
    { key: "otherCharges", label: "Other Charges" },
  ];

  return (
    <div id="financial" className="mt-2 sm:mt-0 mb-6 sm:mb-8 md:mb-10">
      <div className="bg-emerald-50 border-emerald-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 shadow-sm border transition-colors">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-2.5 md:p-3 bg-white rounded-lg sm:rounded-xl shadow-sm shrink-0">
            <Wallet className="text-emerald-700" size={28} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-0.5 sm:mb-1 leading-tight">
              Financial Information
            </h3>
            <p className="text-green-700 text-2xs sm:text-xs font-medium leading-tight transition-colors mt-1">
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
            <p className="text-red-700 text-2xs sm:text-xs mt-0.5">
              All charges have been set to ৳0. If any payment was made, please
              process a refund manually.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-5">
        <div>
          <label className="block text-slate-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Admission Fee (Fixed)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
              ৳
            </span>
            <NumberInput
              className={`${inputClassName(financialData.admissionFee, true)} pl-10`}
              value={financialData.admissionFee}
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chargeFields.map((field) => (
            <div key={field.key}>
              <label className="block text-slate-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                {field.label}
                {field.showWarning && showRoomWarning && (
                  <AlertCircle className="w-4 h-4 inline ml-1 text-amber-700" />
                )}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                  ৳
                </span>
                <NumberInput
                  className={`${inputClassName(financialData[field.key])} pl-10`}
                  value={financialData[field.key] || ""}
                  onChange={(e) =>
                    handleNumberChange(field.key, e.target.value)
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
              {field.showWarning && showRoomWarning && (
                <p className="text-xs text-amber-700 mt-1">
                  Please fill room/seat number in Status section
                </p>
              )}
            </div>
          ))}

          {medicineBillingEnabled && (
            <div>
              <label className="block text-slate-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                Medicine Charge
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                  ৳
                </span>
                <NumberInput
                  className={`${inputClassName(
                    financialData.medicineCharge,
                    hasItemizedMedicines,
                  )} pl-10`}
                  value={financialData.medicineCharge || ""}
                  onChange={(e) =>
                    handleNumberChange("medicineCharge", e.target.value)
                  }
                  placeholder="0"
                  min="0"
                  readOnly={hasItemizedMedicines}
                />
              </div>
              {hasItemizedMedicines && (
                <p className="text-xs text-emerald-700 mt-1">
                  Calculated from itemized medicines
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-green-200">
          <label className="block text-slate-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Discount
          </label>
          <div className="relative flex items-stretch rounded-lg border-2 border-slate-300 bg-white overflow-hidden focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100 transition-colors h-12 md:h-14">
            <NumberInput
              className="flex-1 px-4 py-2 text-slate-700 font-normal outline-none text-xs sm:text-sm bg-transparent cursor-pointer"
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
            <div className="flex items-center border-l border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => handleDiscountTypeChange("percentage")}
                className={`px-3 sm:px-4 h-full text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  financialData.discountType === "percentage"
                    ? "bg-green-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => handleDiscountTypeChange("value")}
                className={`px-3 sm:px-4 h-full text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  financialData.discountType === "value"
                    ? "bg-green-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                ৳
              </button>
            </div>
          </div>

          {financialData.totalAmount > 0 && (
            <div className="mt-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Patient saves:</span>
                <span className="font-bold tabular-nums text-emerald-700">
                  ৳
                  {(financialData.discountAmount || 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )}
                  {financialData.discountType === "percentage" &&
                    discountInput !== "" &&
                    discountInput > 0 && (
                      <span className="text-slate-500 font-normal ml-1">
                        ({discountInput}%)
                      </span>
                    )}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-slate-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
            Grand Total (BDT){" "}
            <span className="text-2xs font-normal text-slate-500">
              (After Discount)
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
              ৳
            </span>
            <NumberInput
              className={`${inputClassName(financialData.grandTotal, true)} pl-10 font-bold text-emerald-700`}
              value={financialData.grandTotal}
              readOnly
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Amount Paid (BDT)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                ৳
              </span>
              <NumberInput
                className={`${inputClassName(financialData.paidAmount)} pl-10`}
                value={financialData.paidAmount || ""}
                onChange={handlePaymentChange}
                placeholder="Enter payment amount"
                min={isCanceled ? "0" : "300"}
                max={financialData.grandTotal}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Amount collected from the patient
            </p>
          </div>

          <div>
            <label className="block text-slate-700 text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
              Due Amount (BDT){" "}
              <span className="text-2xs font-normal text-slate-500">
                (Auto-calculated)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                ৳
              </span>
              <NumberInput
                className={`${inputClassName(financialData.dueAmount, true)} pl-10 ${
                  financialData.dueAmount > 0
                    ? "text-red-600 font-bold"
                    : "text-emerald-700 font-bold"
                }`}
                value={financialData.dueAmount}
                readOnly
                placeholder="0"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
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
