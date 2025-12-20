"use client";
import React from "react";
import {
  User,
  Building2,
  Beaker,
  CreditCard,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PathologyPatientData } from "../../../types";
import {
  modalVariants,
  backdropVariants,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";

interface PatientOverviewProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PathologyPatientData | null;
}

const PatientOverview: React.FC<PatientOverviewProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  if (!patient) return null;

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString("en-BD")}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    colorClass = "text-gray-900",
  }: {
    icon: any;
    label: string;
    value: string | number | null;
    colorClass?: string;
  }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-fnh-porcelain transition-colors border border-transparent hover:border-fnh-grey-light">
      <div className="p-2 bg-fnh-porcelain rounded-lg">
        <Icon className="w-4 h-4 text-fnh-navy" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold text-fnh-grey tracking-wider">
          {label}
        </p>
        <p className={`text-sm font-semibold ${colorClass}`}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );

  const SectionHeader = ({
    icon: Icon,
    title,
    colorClass = "text-fnh-navy",
  }: {
    icon: any;
    title: string;
    colorClass?: string;
  }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <Icon className={`w-5 h-5 ${colorClass}`} />
      <h3
        className={`text-base font-bold uppercase tracking-tight ${colorClass}`}
      >
        {title}
      </h3>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-100001 p-4"
          onClick={onClose}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-white/20"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ModalHeader
              icon={User}
              iconColor="indigo"
              title={patient.patientFullName}
              subtitle={`Patient Overview • Test ID: ${patient.testNumber}`}
              onClose={onClose}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                    patient.isCompleted
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                  }`}
                >
                  {patient.isCompleted ? "Completed" : "Pending"}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-fnh-navy/10 text-fnh-navy border border-fnh-navy/20 text-xs font-bold uppercase tracking-widest">
                  {patient.testCategory}
                </span>
              </div>
            </ModalHeader>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 bg-fnh-porcelain/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Patient Information */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <SectionHeader icon={User} title="Patient Details" />
                  <div className="grid grid-cols-1 gap-2">
                    <InfoItem
                      icon={User}
                      label="Full Name"
                      value={patient.patientFullName}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Gender / Age"
                      value={`${patient.patientGender} / ${
                        patient.patientAge || "N/A"
                      } YRS`}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Date of Birth"
                      value={formatDate(patient.patientDOB)}
                    />
                    <InfoItem
                      icon={Phone}
                      label="Mobile"
                      value={patient.mobileNumber}
                    />
                    <InfoItem icon={Mail} label="Email" value={patient.email} />
                    <InfoItem
                      icon={MapPin}
                      label="Address"
                      value={patient.address}
                    />
                    <InfoItem
                      icon={ShieldCheck}
                      label="Blood Group"
                      value={patient.bloodGroup}
                      colorClass="text-red-600 font-bold"
                    />
                  </div>
                </div>

                {/* Guardian & Hospital */}
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <SectionHeader
                      icon={ShieldCheck}
                      title="Guardian Details"
                    />
                    <div className="grid grid-cols-1 gap-2">
                      <InfoItem
                        icon={User}
                        label="Guardian Name"
                        value={patient.guardianName}
                      />
                      <InfoItem
                        icon={Calendar}
                        label="Guardian Age"
                        value={
                          patient.guardianAge
                            ? `${patient.guardianAge} YRS`
                            : "N/A"
                        }
                      />
                      <InfoItem
                        icon={User}
                        label="Guardian Gender"
                        value={patient.guardianGender}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <SectionHeader icon={Building2} title="Hospital Info" />
                    <div className="grid grid-cols-1 gap-2">
                      <InfoItem
                        icon={Building2}
                        label="Hospital Name"
                        value={patient.hospitalName}
                      />
                      <InfoItem
                        icon={Phone}
                        label="Contact"
                        value={patient.hospitalPhone}
                      />
                      <InfoItem
                        icon={MapPin}
                        label="Address"
                        value={patient.hospitalAddress}
                      />
                    </div>
                  </div>
                </div>

                {/* Test & Financial */}
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <SectionHeader
                      icon={Beaker}
                      title="Test Information"
                      colorClass="text-fnh-blue"
                    />
                    <div className="grid grid-cols-1 gap-2">
                      <InfoItem
                        icon={Clock}
                        label="Test Number"
                        value={patient.testNumber}
                        colorClass="font-mono text-fnh-navy"
                      />
                      <InfoItem
                        icon={Calendar}
                        label="Test Date"
                        value={formatDate(patient.testDate)}
                      />
                      <InfoItem
                        icon={Calendar}
                        label="Report Date"
                        value={formatDate(patient.reportDate)}
                      />
                      <InfoItem
                        icon={FileText}
                        label="Remarks"
                        value={patient.remarks}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <SectionHeader
                      icon={CreditCard}
                      title="Financial Summary"
                      colorClass="text-green-600"
                    />
                    <div className="grid grid-cols-1 gap-2">
                      <div className="grid grid-cols-2 gap-4 px-3 py-2">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-fnh-grey">
                            Total Charge
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(patient.testCharge)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-fnh-grey">
                            Discount
                          </p>
                          <p className="text-lg font-bold text-red-500">
                            {formatCurrency(patient.discountAmount || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-3 bg-fnh-navy/5 rounded-2xl border border-fnh-navy/10 mt-2">
                        <p className="text-[10px] uppercase font-black text-fnh-navy tracking-tightest">
                          Grand Total
                        </p>
                        <p className="text-2xl font-black text-fnh-navy">
                          {formatCurrency(patient.grandTotal)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 px-3 py-2 mt-2">
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-[10px] uppercase font-bold text-blue-600">
                            Paid
                          </p>
                          <p className="text-base font-bold text-blue-700">
                            {formatCurrency(patient.paidAmount)}
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded-xl border ${
                            patient.dueAmount > 0
                              ? "bg-red-50 border-red-100"
                              : "bg-green-50 border-green-100"
                          }`}
                        >
                          <p
                            className={`text-[10px] uppercase font-bold ${
                              patient.dueAmount > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            Due
                          </p>
                          <p
                            className={`text-base font-bold ${
                              patient.dueAmount > 0
                                ? "text-red-700"
                                : "text-green-700"
                            }`}
                          >
                            {formatCurrency(patient.dueAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Indicator Bar at bottom */}
              <div
                className={`mt-8 p-6 rounded-4xl flex items-center justify-between border-2 ${
                  patient.isCompleted
                    ? "bg-green-50/50 border-green-200"
                    : "bg-yellow-50/50 border-yellow-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-2xl ${
                      patient.isCompleted ? "bg-green-100" : "bg-yellow-100"
                    }`}
                  >
                    {patient.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <h4
                      className={`text-lg font-bold ${
                        patient.isCompleted
                          ? "text-green-800"
                          : "text-yellow-800"
                      }`}
                    >
                      Test Status:{" "}
                      {patient.isCompleted
                        ? "Successfully Completed"
                        : "Order is Pending"}
                    </h4>
                    <p
                      className={`text-sm ${
                        patient.isCompleted
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {patient.isCompleted
                        ? `The pathology test was completed on ${formatDate(
                            patient.reportDate
                          )}.`
                        : "The laboratory is currently processing this request."}
                    </p>
                  </div>
                </div>
                {!patient.isCompleted && patient.dueAmount > 0 && (
                  <div className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-yellow-200 shadow-sm">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-bold text-red-700">
                      Payment Required: {formatCurrency(patient.dueAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-fnh-navy text-white rounded-2xl font-bold hover:bg-fnh-navy-dark transition-all shadow-lg hover:shadow-fnh-navy/20 active:scale-95 cursor-pointer"
              >
                Close Overview
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PatientOverview;
