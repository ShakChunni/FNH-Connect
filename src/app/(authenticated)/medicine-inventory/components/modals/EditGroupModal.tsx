/**
 * Edit Group Modal
 * Edit an existing medicine group
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
import { useUpdateGroupData } from "../../hooks";
import { GroupSearch } from "../shared";
import type { MedicineGroup } from "../../types";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGroupId?: number | null;
  initialGroupName?: string;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  initialGroupId = null,
  initialGroupName = "",
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  const [groupId, setGroupId] = useState<number | null>(initialGroupId);
  const [groupName, setGroupName] = useState(initialGroupName);
  const [newName, setNewName] = useState(initialGroupName);

  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      preserveLockBodyScroll();
      setGroupId(initialGroupId);
      setGroupName(initialGroupName);
      setNewName(initialGroupName);
    } else {
      preserveUnlockBodyScroll();
    }
    return () => {
      preserveUnlockBodyScroll();
    };
  }, [isOpen, initialGroupId, initialGroupName]);

  const { updateGroup, isLoading: isSubmitting } = useUpdateGroupData({
    onSuccess: () => {
      onClose();
    },
  });

  const isValid = groupId !== null && newName.trim().length > 0;

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(() => {
    if (isSubmitting) return;

    if (!groupId) {
      showNotification("Please select a group to edit", "error");
      return;
    }

    if (!newName.trim()) {
      showNotification("Group name is required", "error");
      return;
    }

    updateGroup({
      id: groupId,
      data: {
        name: newName.trim(),
      },
    });
  }, [isSubmitting, groupId, newName, updateGroup, showNotification]);

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

  const handleGroupChange = useCallback((group: MedicineGroup | null) => {
    if (group) {
      setGroupId(group.id);
      setGroupName(group.name);
      setNewName(group.name);
    } else {
      setGroupId(null);
      setGroupName("");
      setNewName("");
    }
  }, []);

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
              icon={Layers}
              iconColor="purple"
              title="Edit Group"
              subtitle="Select a group and update its name"
              onClose={handleClose}
              isDisabled={isSubmitting}
            />

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Select Group <span className="text-red-500">*</span>
                  </label>
                  <GroupSearch
                    value={groupId}
                    displayValue={groupName}
                    onChange={handleGroupChange}
                    placeholder="Search group to edit..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    New Group Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter updated group name"
                      className={`${getInputClass(!!newName)} pl-10`}
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
              theme="purple"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditGroupModal;
