"use client";
import React from "react";
import {
  CreditCard,
  BadgePercent,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { PathologyPatientData } from "../../../../../types";
import { cn } from "@/lib/utils";

interface FinancialOverviewProps {
  patient: PathologyPatientData;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  patient,
}) => {
  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString("en-BD")}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <CreditCard className="w-3.5 h-3.5" /> Financial Overview
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-tight">
            Total Amount
          </p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(patient.testCharge)}
          </p>
        </div>

        {/* Discount */}
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
          <p className="text-[10px] text-orange-600 font-medium mb-1 flex items-center gap-1 uppercase tracking-tight">
            <BadgePercent className="w-3 h-3" /> Discount
          </p>
          <p className="text-lg font-bold text-orange-700">
            {patient.discountAmount && patient.discountAmount > 0 ? "-" : ""}
            {formatCurrency(patient.discountAmount || 0)}
          </p>
        </div>

        {/* Grand Total */}
        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
          <p className="text-[10px] text-indigo-600 font-medium mb-1 uppercase tracking-tight">
            Grand Total
          </p>
          <p className="text-lg font-bold text-indigo-700">
            {formatCurrency(patient.grandTotal)}
          </p>
        </div>
      </div>

      {/* Payment Status Bar */}
      <div className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-8 w-full sm:w-auto justify-between sm:justify-start">
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-tight">
              Paid Amount
            </p>
            <p className="text-base font-bold text-green-600">
              {formatCurrency(patient.paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5 uppercase tracking-tight">
              Due Amount
            </p>
            <p
              className={cn(
                "text-base font-bold",
                patient.dueAmount > 0 ? "text-red-500" : "text-gray-400"
              )}
            >
              {formatCurrency(patient.dueAmount)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2",
            patient.dueAmount > 0
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          )}
        >
          {patient.dueAmount > 0 ? (
            <>
              <AlertCircle className="w-4 h-4" /> Payment Pending
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" /> Fully Paid
            </>
          )}
        </div>
      </div>
    </div>
  );
};
