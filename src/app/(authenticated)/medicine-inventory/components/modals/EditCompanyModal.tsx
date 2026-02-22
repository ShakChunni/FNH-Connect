/**
 * Edit Company Modal
 * Edit an existing pharmaceutical company/supplier
 */

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Building2, Save, Phone, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  modalVariants,
  backdropVariants,
  preserveLockBodyScroll,
  preserveUnlockBodyScroll,
} from "@/components/ui/modal-animations";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalFooter } from "@/components/ui/ModalFooter";
import { useNotification } from "@/hooks/useNotification";
import { useUpdateCompanyData } from "../../hooks";

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: number | null;
  initialName?: string;
  initialAddress?: string;
  initialPhoneNumber?: string;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  isOpen,
  onClose,
  companyId = null,
  initialName = "",
  initialAddress = "",
  initialPhoneNumber = "",
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);

  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      setName(initialName);
      setAddress(initialAddress);
      setPhoneNumber(initialPhoneNumber);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, initialName, initialAddress, initialPhoneNumber]);

  const { updateCompany, isLoading: isSubmitting } = useUpdateCompanyData({
    onSuccess: () => {
      onClose();
    },
  });

  const isValid = !!companyId && name.trim().length > 0;

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;

    if (!companyId) {
      showNotification("Invalid company selected", "error");
      return;
    }

    if (!name.trim()) {
      showNotification("Company name is required", "error");
      return;
    }

    updateCompany({
      id: companyId,
      data: {
        name: name.trim(),
        address: address.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      },
    });
  }, [
    isSubmitting,
    companyId,
    name,
    address,
    phoneNumber,
    updateCompany,
    showNotification,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose, handleSubmit]);

  const getInputClass = (hasValue: boolean) => {
    const base =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";

    return hasValue
      ? `${base} bg-white border-2 border-green-600`
      : `${base} bg-white border-2 border-gray-300`;
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-100000"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            isolation: "isolate",
            willChange: "opacity",
            backfaceVisibility: "hidden",
            perspective: 1000,
          }}
        >
          <motion.div
            ref={popupRef}
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[500px] h-auto max-h-[90%] popup-content flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
            }}
          >
            <ModalHeader
              icon={Building2}
              iconColor="green"
              title="Edit Company"
              subtitle="Update supplier details"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Company name"
                      className={`${getInputClass(!!name)} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Optional contact number"
                      className={`${getInputClass(!!phoneNumber)} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Optional company address"
                      rows={2}
                      className={`${getInputClass(!!address)} pl-10 resize-none h-auto min-h-[80px]`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <ModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              isDisabled={!isValid}
              cancelText="Cancel"
              submitText="Save Changes"
              loadingText="Saving..."
              submitIcon={Save}
              theme="green"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditCompanyModal;
