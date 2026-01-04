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
      <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-gray-400">
        <Receipt size={48} className="mb-4 opacity-10" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">
          No cash movements recorded
        </p>
        <p className="text-[10px] font-medium text-gray-400 mt-1">
          Everything looks quiet for this shift.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-100/50">
        <AnimatePresence>
          {movements.map((movement, index) => {
            const isCollection =
              movement.movementType === "COLLECTION" ||
              movement.movementType === "PAYMENT_RECEIVED";
            const isRefund = movement.movementType === "REFUND";
            const patient = movement.payment?.patientAccount.patient;

            return (
              <motion.div
                key={movement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                onClick={() => handleOpenDetail(movement)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-all duration-200 cursor-pointer group relative"
              >
                {/* Click indicator line */}
                <motion.div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-r-full",
                    isCollection
                      ? "bg-emerald-500"
                      : isRefund
                      ? "bg-rose-500"
                      : "bg-blue-500"
                  )}
                />

                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Icon with hover animation */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "mt-0.5 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 group-hover:shadow-md",
                        isCollection
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100"
                          : isRefund
                          ? "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100"
                          : "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100"
                      )}
                    >
                      {isCollection ? (
                        <TrendingUp size={16} className="sm:w-[18px]" />
                      ) : isRefund ? (
                        <TrendingDown size={16} className="sm:w-[18px]" />
                      ) : (
                        <Receipt size={16} className="sm:w-[18px]" />
                      )}
                    </motion.div>

                    {/* Info */}
                    <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className="text-[11px] sm:text-xs font-black text-gray-900 uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">
                          {movement.description ||
                            movement.movementType.replace("_", " ")}
                        </p>
                        <span
                          className={cn(
                            "text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border shrink-0",
                            isCollection
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : isRefund
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-blue-100 text-blue-800 border-blue-200"
                          )}
                        >
                          {movement.movementType}
                        </span>
                      </div>

                      {patient && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                          <div className="flex items-center gap-1.5 opacity-80 shrink-0">
                            <User size={10} className="text-fnh-blue sm:w-3" />
                            <p className="text-[10px] sm:text-[11px] font-bold text-gray-700 truncate max-w-[120px] sm:max-w-[200px]">
                              {patient.fullName}
                            </p>
                          </div>
                          {movement.payment?.receiptNumber && (
                            <div className="flex items-center gap-1.5 opacity-60 shrink-0">
                              <Receipt
                                size={10}
                                className="text-fnh-navy sm:w-3"
                              />
                              <p className="text-[9px] sm:text-[10px] font-bold text-gray-500">
                                #{movement.payment.receiptNumber}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-400 font-medium italic">
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
                          "text-sm sm:text-base font-black font-mono leading-none",
                          isCollection
                            ? "text-emerald-600"
                            : isRefund
                            ? "text-rose-600"
                            : "text-gray-900"
                        )}
                      >
                        {isCollection ? "+" : isRefund ? "-" : ""}
                        {formatCurrency(movement.amount)}
                      </p>
                      <p className="text-[8px] sm:text-[9px] font-black text-gray-400 tracking-wider mt-1 uppercase">
                        BDT
                      </p>
                    </div>

                    {/* View details indicator */}
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex"
                      whileHover={{ x: 2 }}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          isCollection
                            ? "bg-emerald-100 text-emerald-600"
                            : isRefund
                            ? "bg-rose-100 text-rose-600"
                            : "bg-blue-100 text-blue-600"
                        )}
                      >
                        <Eye size={14} />
                      </div>
                    </motion.div>

                    {/* Mobile tap indicator */}
                    <ChevronRight
                      size={16}
                      className="text-gray-300 sm:hidden group-hover:text-gray-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Click to view hint - shows on first few items */}
                {index < 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-1 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block"
                  >
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                      Click for details
                    </span>
                  </motion.div>
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
