/**
 * Add Group Modal
 * Compact modal for quickly adding a new medicine group/category
 */

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Layers, Save } from "lucide-react";
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
import { useAddGroupData } from "../../hooks";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess?: (group: { id: number; name: string }) => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({
  isOpen,
  onClose,
  initialName = "",
  onSuccess,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Form state
  const [name, setName] = useState(initialName);

  // Notification
  const { showNotification } = useNotification();

  // Handle body scroll locking
  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      setName(initialName);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, initialName]);

  // Mutation
  const { addGroup, isLoading: isSubmitting } = useAddGroupData({
    onSuccess: (group) => {
      onSuccess?.({ id: group.id, name: group.name });
      onClose();
    },
    showSuccessNotification: true,
  });

  // Validation
  const isValid = name.trim().length > 0;

  // Handlers
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;

    if (!isValid) {
      showNotification("Group name is required", "error");
      return;
    }

    addGroup({
      name: name.trim(),
    });
  }, [isSubmitting, isValid, name, addGroup, showNotification]);

  // Keyboard handling
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

  // Common input class
  const getInputClass = (hasValue: boolean) => {
    const base =
      "text-gray-700 font-normal rounded-lg h-12 md:h-14 py-2 px-4 w-full focus:border-blue-900 focus:ring-2 focus:ring-blue-950 outline-none shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-gray-400 placeholder:font-light text-xs sm:text-sm cursor-pointer";

    return hasValue
      ? `${base} bg-white border-2 border-green-600`
      : `${base} bg-white border-2 border-gray-300`;
  };

  // Common group examples
  const groupExamples = [
    "Antibiotic",
    "Painkiller",
    "Antacid",
    "Antidiabetic",
    "Cardiovascular",
    "Antihypertensive",
    "Vitamin",
    "Antihistamine",
  ];

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
            className="bg-white rounded-3xl shadow-lg w-full max-w-[95%] sm:max-w-[450px] h-auto max-h-[90%] popup-content flex flex-col"
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
              icon={Layers}
              iconColor="purple"
              title="Add Group"
              subtitle="Add a new medicine category/group"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4">
                {/* Group Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Antibiotic"
                      autoFocus
                      className={`${getInputClass(!!name)} pl-10`}
                    />
                  </div>
                </div>

                {/* Quick Select Examples */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Common groups (click to use):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {groupExamples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setName(example)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                          name === example
                            ? "bg-purple-600 text-white"
                            : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                        }`}
                      >
                        {example}
                      </button>
                    ))}
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
              submitText="Add Group"
              loadingText="Adding..."
              submitIcon={Save}
              theme="purple"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddGroupModal;
