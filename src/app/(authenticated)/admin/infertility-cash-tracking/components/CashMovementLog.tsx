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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { rowVariants } from "@/lib/motion";
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
          No infertility movements
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-slate-100">
        <AnimatePresence>
          {movements.map((movement) => {
            const isCollection =
              movement.movementType === "COLLECTION" ||
              movement.movementType === "PAYMENT_RECEIVED";
            const isRefund = movement.movementType === "REFUND";
            const patient = movement.payment?.patientAccount.patient;

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
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-r-full",
                    isCollection ? "bg-emerald-500" : isRefund ? "bg-red-500" : "bg-blue-500"
                  )}
                />

                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={cn(
                        "mt-0.5 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-200",
                        isCollection ? "bg-emerald-50 text-emerald-700 border-emerald-100" : isRefund ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100"
                      )}>
                      {isCollection ? <TrendingUp size={16} /> : isRefund ? <TrendingDown size={16} /> : <Receipt size={16} />}
                    </div>

                    <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className="text-2xs sm:text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                          {movement.description || movement.movementType.replace("_", " ")}
                        </p>
                      </div>

                      {patient && (
                        <div className="flex items-center gap-1.5">
                          <User size={10} className="text-fnh-blue" />
                          <p className="text-2xs font-bold text-slate-700 truncate">
                            {patient.fullName}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-2xs text-slate-500 font-medium italic">
                        <Clock size={10} />
                        {formatTime(movement.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={cn("text-sm sm:text-base font-black font-mono tabular-nums leading-none", isCollection ? "text-emerald-700" : isRefund ? "text-red-700" : "text-slate-900")}>
                      {isCollection ? "+" : isRefund ? "-" : ""}
                      {formatCurrency(movement.amount)}
                    </p>
                    <p className="text-2xs font-black text-slate-500 tracking-wider mt-1 uppercase">BDT</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <CashMovementDetailModal
        movement={selectedMovement}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </>
  );
};

export default CashMovementLog;
