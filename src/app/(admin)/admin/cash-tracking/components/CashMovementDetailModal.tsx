"use client";

import React, { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { CashMovementDetail } from "../types";
import {
  TrendingUp,
  TrendingDown,
  User,
  Receipt,
  Clock,
  Phone,
  FileText,
  CreditCard,
  Hash,
  Wallet,
  Building2,
  Stethoscope,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ModalBackdrop,
  ModalContent,
  modalVariants,
  backdropVariants,
  lockBodyScroll,
  unlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";

interface CashMovementDetailModalProps {
  movement: CashMovementDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const CashMovementDetailModal: React.FC<CashMovementDetailModalProps> = ({
  movement,
  isOpen,
  onClose,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }
    return () => unlockBodyScroll();
  }, [isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  if (!movement) return null;

  const isCollection =
    movement.movementType === "COLLECTION" ||
    movement.movementType === "PAYMENT_RECEIVED";
  const isRefund = movement.movementType === "REFUND";
  const patient = movement.payment?.patientAccount.patient;
  const paymentAllocations = movement.payment?.paymentAllocations || [];

  // Extract department and doctor from allocations
  const departments = [
    ...new Set(paymentAllocations.map((a) => a.serviceCharge.department.name)),
  ];
  const doctors = [
    ...new Set(
      paymentAllocations
        .map(
          (a) =>
            a.serviceCharge.admission?.doctor?.fullName ||
            a.serviceCharge.pathologyTest?.doctor?.fullName
        )
        .filter(Boolean)
    ),
  ];
  const services = paymentAllocations.map((a) => ({
    name: a.serviceCharge.serviceName,
    type: a.serviceCharge.serviceType,
    amount: a.allocatedAmount,
  }));

  // Determine icon color based on type
  const iconColor = isCollection ? "green" : isRefund ? "red" : "blue";
  const Icon = isCollection ? TrendingUp : isRefund ? TrendingDown : Receipt;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <ModalBackdrop
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-[100]"
          />

          {/* Modal */}
          <ModalContent
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 w-full max-w-lg pointer-events-auto flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <ModalHeader
                icon={Icon}
                iconColor={iconColor}
                title="Transaction Details"
                subtitle={`Movement #${movement.id}`}
                onClose={onClose}
              />

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
                {/* Amount Card - Hero Section */}
                <div
                  className={cn(
                    "rounded-2xl p-5 border-2",
                    isCollection
                      ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
                      : isRefund
                      ? "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200"
                      : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest mb-1",
                          isCollection
                            ? "text-emerald-600"
                            : isRefund
                            ? "text-rose-600"
                            : "text-blue-600"
                        )}
                      >
                        Transaction Amount
                      </p>
                      <p
                        className={cn(
                          "text-3xl font-black font-mono",
                          isCollection
                            ? "text-emerald-700"
                            : isRefund
                            ? "text-rose-700"
                            : "text-blue-700"
                        )}
                      >
                        {isCollection ? "+" : isRefund ? "-" : ""}
                        {formatCurrency(movement.amount)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        isCollection
                          ? "bg-emerald-100"
                          : isRefund
                          ? "bg-rose-100"
                          : "bg-blue-100"
                      )}
                    >
                      <Icon
                        size={28}
                        className={cn(
                          isCollection
                            ? "text-emerald-600"
                            : isRefund
                            ? "text-rose-600"
                            : "text-blue-600"
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest",
                        isCollection
                          ? "bg-emerald-200 text-emerald-800"
                          : isRefund
                          ? "bg-rose-200 text-rose-800"
                          : "bg-blue-200 text-blue-800"
                      )}
                    >
                      {movement.movementType.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                      Transaction Time
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {formatDateTime(movement.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {movement.description && (
                  <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                        Description
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {movement.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Department(s) */}
                {departments.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Department
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {departments.map((dept, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Doctor(s) */}
                {doctors.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                      <Stethoscope size={18} className="text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Doctor
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {doctors.map((doc, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-bold text-teal-700 bg-teal-100 px-2.5 py-1 rounded-lg"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Services Breakdown */}
                {services.length > 0 && (
                  <div className="p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers size={16} className="text-indigo-500" />
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Services Breakdown
                      </p>
                    </div>
                    <div className="space-y-2">
                      {services.map((service, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 truncate">
                              {service.name}
                            </p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                              {service.type.replace("_", " ")}
                            </p>
                          </div>
                          <span className="text-sm font-black text-gray-700 font-mono shrink-0 ml-3">
                            {formatCurrency(Number(service.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patient Information */}
                {patient && (
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={16} className="text-indigo-600" />
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                        Patient Information
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <User size={18} className="text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {patient.fullName}
                          </p>
                          <p className="text-xs text-gray-500">Patient</p>
                        </div>
                      </div>

                      {patient.phoneNumber && (
                        <div className="flex items-center gap-3 pl-1">
                          <Phone size={14} className="text-gray-400 shrink-0" />
                          <p className="text-sm font-medium text-gray-600">
                            {patient.phoneNumber}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pl-1">
                        <Hash size={14} className="text-gray-400 shrink-0" />
                        <p className="text-xs font-mono text-gray-500">
                          Patient ID: {patient.id}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment/Receipt Information */}
                {movement.payment && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard size={16} className="text-emerald-600" />
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                        Payment Details
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Receipt size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          Receipt Number
                        </p>
                        <p className="text-lg font-black text-gray-900 font-mono">
                          #{movement.payment.receiptNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction IDs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className="text-gray-400" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        Movement ID
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-600">
                      #{movement.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        Shift ID
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-600">
                      #{movement.shiftId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <ModalFooter
                onCancel={onClose}
                onSubmit={onClose}
                cancelText="Close"
                submitText="Done"
                theme="blue"
              />
            </div>
          </ModalContent>
        </>
      )}
    </AnimatePresence>
  );
};

export default CashMovementDetailModal;
