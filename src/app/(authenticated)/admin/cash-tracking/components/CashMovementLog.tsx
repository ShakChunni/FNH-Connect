"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CashMovementDetail } from "../types";
import {
  TrendingUp,
  TrendingDown,
  User,
  Receipt,
  Clock,
  ChevronRight,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { rowVariants } from "@/lib/motion";
import { TONE_BADGE } from "@/lib/statusStyles";
import CashMovementDetailModal from "./CashMovementDetailModal";

interface CashMovementLogProps {
  movements: CashMovementDetail[];
}

const CashMovementLog: React.FC<CashMovementLogProps> = ({ movements }) => {
  const [selectedMovement, setSelectedMovement] =
    useState<CashMovementDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleOpenDetail = (movement: CashMovementDetail) => {
    setSelectedMovement(movement);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    // Delay clearing movement to allow exit animation
    setTimeout(() => setSelectedMovement(null), 200);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-BD", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (movements.length === 0) {
    return (
      <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-slate-500">
        <Receipt size={48} className="mb-4 opacity-10" />
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
          No cash movements recorded
        </p>
        <p className="text-2xs font-medium text-slate-500 mt-1">
          Everything looks quiet for this shift.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-slate-100">
        <AnimatePresence>
          {movements.map((movement, index) => {
            const isCollection =
              movement.movementType === "COLLECTION" ||
              movement.movementType === "PAYMENT_RECEIVED";
            const isRefund = movement.movementType === "REFUND";
            const patient =
              movement.payment?.patientAccount.patient ??
              movement._refundSource?.patient;

            return (
              <motion.div
                key={movement.id}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => handleOpenDetail(movement)}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer group relative"
              >
                {/* Click indicator line */}
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-r-full",
                    isCollection
                      ? "bg-emerald-500"
                      : isRefund
                      ? "bg-red-500"
                      : "bg-blue-500"
                  )}
                />

                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div
                      className={cn(
                        "mt-0.5 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-200",
                        isCollection
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-100"
                          : isRefund
                          ? "bg-red-50 text-red-700 border-red-100 group-hover:bg-red-100"
                          : "bg-blue-50 text-blue-700 border-blue-100 group-hover:bg-blue-100"
                      )}
                    >
                      {isCollection ? (
                        <TrendingUp size={16} className="sm:w-[18px]" />
                      ) : isRefund ? (
                        <TrendingDown size={16} className="sm:w-[18px]" />
                      ) : (
                        <Receipt size={16} className="sm:w-[18px]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className="text-2xs sm:text-xs font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">
                          {movement.description ||
                            movement.movementType.replace("_", " ")}
                        </p>
                        <span
                          className={cn(
                            "text-2xs font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ring-1 ring-inset shrink-0",
                            TONE_BADGE[
                              isCollection ? "success" : isRefund ? "danger" : "info"
                            ]
                          )}
                        >
                          {movement.movementType}
                        </span>
                      </div>

                      {patient && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <User size={10} className="text-fnh-blue sm:w-3" />
                            <p className="text-2xs font-bold text-slate-700 truncate max-w-[120px] sm:max-w-[200px]">
                              {patient.fullName}
                            </p>
                          </div>
                          {(movement.payment?.receiptNumber || movement._refundSource?.registrationId) && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Receipt
                                size={10}
                                className="text-fnh-navy sm:w-3"
                              />
                              <p className="text-2xs font-bold text-slate-500">
                                #{movement.payment?.receiptNumber || movement._refundSource?.registrationId}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-2xs text-slate-500 font-medium italic">
                        <Clock size={10} />
                        {formatTime(movement.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Amount & View indicator */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm sm:text-base font-black font-mono tabular-nums leading-none",
                          isCollection
                            ? "text-emerald-700"
                            : isRefund
                            ? "text-red-700"
                            : "text-slate-900"
                        )}
                      >
                        {isCollection ? "+" : isRefund ? "-" : ""}
                        {formatCurrency(movement.amount)}
                      </p>
                      <p className="text-2xs font-black text-slate-500 tracking-wider mt-1 uppercase">
                        BDT
                      </p>
                    </div>

                    {/* View details indicator */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          isCollection
                            ? "bg-emerald-100 text-emerald-700"
                            : isRefund
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        <Eye size={14} />
                      </div>
                    </div>

                    {/* Mobile tap indicator */}
                    <ChevronRight
                      size={16}
                      className="text-slate-300 sm:hidden group-hover:text-slate-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Click to view hint - shows on first few items */}
                {index < 2 && (
                  <div className="absolute bottom-1 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                    <span className="text-2xs font-bold text-slate-500 uppercase tracking-widest">
                      Click for details
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <CashMovementDetailModal
        movement={selectedMovement}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </>
  );
};

export default CashMovementLog;
