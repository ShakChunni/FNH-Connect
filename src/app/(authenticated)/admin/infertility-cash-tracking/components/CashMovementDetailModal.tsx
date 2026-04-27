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
  useEffect(() => {
    if (isOpen) lockBodyScroll();
    else unlockBodyScroll();
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

  const isCollection = movement
    ? movement.movementType === "COLLECTION" ||
      movement.movementType === "PAYMENT_RECEIVED"
    : false;
  const isRefund = movement ? movement.movementType === "REFUND" : false;
  const patient = movement?.payment?.patientAccount.patient;
  const paymentAllocations = movement?.payment?.paymentAllocations || [];

  const departments = [
    ...new Set(paymentAllocations.map((a) => a.serviceCharge.department.name)),
  ];
  const doctors = [
    ...new Set(
      paymentAllocations
        .map((a) => a.serviceCharge.infertilityTest?.orderedBy?.fullName)
        .filter(Boolean)
    ),
  ];
  const services = paymentAllocations.map((a) => ({
    name: a.serviceCharge.serviceName,
    type: a.serviceCharge.serviceType,
    amount: a.allocatedAmount,
  }));

  const iconColor = isCollection ? "green" : isRefund ? "red" : "blue";
  const Icon = isCollection ? TrendingUp : isRefund ? TrendingDown : Receipt;

  return (
    <AnimatePresence>
      {isOpen && movement && (
        <>
          <ModalBackdrop
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-[100]"
          />

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
              <ModalHeader
                icon={Icon}
                iconColor={iconColor}
                title="Infertility Transaction"
                subtitle={`Movement #${movement.id}`}
                onClose={onClose}
              />

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50">
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
                      <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isCollection ? "text-emerald-600" : isRefund ? "text-rose-600" : "text-blue-600")}>
                        Department Revenue
                      </p>
                      <p className={cn("text-3xl font-black font-mono", isCollection ? "text-emerald-700" : isRefund ? "text-rose-700" : "text-blue-700")}>
                        {isCollection ? "+" : isRefund ? "-" : ""}
                        {formatCurrency(movement.amount)}
                      </p>
                    </div>
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", isCollection ? "bg-emerald-100" : isRefund ? "bg-rose-100" : "bg-blue-100")}>
                      <Icon size={28} className={cn(isCollection ? "text-emerald-600" : isRefund ? "text-rose-600" : "text-blue-600")} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Transaction Time</p>
                    <p className="text-sm font-bold text-gray-800">{formatDateTime(movement.timestamp)}</p>
                  </div>
                </div>

                {departments.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Department</p>
                      <div className="flex flex-wrap gap-1.5">
                        {departments.map((dept, idx) => (
                          <span key={idx} className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg">{dept}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {doctors.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                      <Stethoscope size={18} className="text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ordered By</p>
                      <div className="flex flex-wrap gap-1.5">
                        {doctors.map((doc, idx) => (
                          <span key={idx} className="text-xs font-bold text-teal-700 bg-teal-100 px-2.5 py-1 rounded-lg">{doc}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {services.length > 0 && (
                  <div className="p-4 bg-white rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers size={16} className="text-indigo-500" />
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Investigations Detail</p>
                    </div>
                    <div className="space-y-2">
                      {services.map((service, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-800 truncate">{service.name}</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider">{service.type.replace("_", " ")}</p>
                          </div>
                          <span className="text-sm font-black text-gray-700 font-mono shrink-0 ml-3">{formatCurrency(Number(service.amount))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {patient && (
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={16} className="text-indigo-600" />
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Patient Information</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <User size={18} className="text-indigo-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{patient.fullName}</p>
                          <p className="text-xs text-gray-500">Infertility Patient</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <ModalFooter onCancel={onClose} onSubmit={onClose} cancelText="Close" submitText="Done" theme="blue" />
            </div>
          </ModalContent>
        </>
      )}
    </AnimatePresence>
  );
};

export default CashMovementDetailModal;
