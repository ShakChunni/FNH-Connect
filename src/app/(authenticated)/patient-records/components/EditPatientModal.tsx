"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User, Phone, MapPin, Save } from "lucide-react";
import { ModalHeader, ModalFooter } from "@/components/ui";

// Existing field components from infertility
import GenderDropdown from "@/components/form-sections/Fields/GenderDropdown";
import DobDropdown from "@/components/form-sections/Fields/DobDropdown";

import type { PatientData } from "../types";
import { useUpdatePatient } from "../hooks";
import { useNotificationContext } from "@/app/NotificationProvider";

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: PatientData;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  onClose,
  patientData,
}) => {
  const { showNotification } = useNotificationContext();
  const updatePatient = useUpdatePatient();

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "Female",
    dateOfBirth: null as Date | null,
    guardianName: "",
    phoneNumber: "",
    address: "",
  });

  // Populate form when patient data changes
  useEffect(() => {
    if (patientData) {
      setFormData({
        firstName: patientData.firstName || "",
        lastName: patientData.lastName || "",
        gender: patientData.gender || "Female",
        dateOfBirth: patientData.dateOfBirth
          ? new Date(patientData.dateOfBirth)
          : null,
        guardianName: patientData.guardianName || "",
        phoneNumber: patientData.phoneNumber || "",
        address: patientData.address || "",
      });
    }
  }, [patientData]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handleGenderChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
  }, []);

  const handleDobChange = useCallback((date: Date | null) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData.firstName.trim()) {
      showNotification("First name is required", "error");
      return;
    }

    try {
      await updatePatient.mutateAsync({
        id: patientData.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName, // Allow empty string to clear lastName
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth?.toISOString() || null,
          guardianName: formData.guardianName || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          address: formData.address || undefined,
        },
      });

      showNotification("Patient updated successfully", "success");
      onClose();
    } catch (error) {
      console.error("[EditPatientModal] Error:", error);
      showNotification("Failed to update patient", "error");
    }
  }, [formData, patientData.id, updatePatient, showNotification, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-101 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Global Modal Header */}
              <ModalHeader
                icon={User}
                iconColor="blue"
                title="Edit Patient"
                subtitle="Update basic patient information"
                onClose={onClose}
                isDisabled={updatePatient.isPending}
              />

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 h-12 md:h-14 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950 transition-all text-xs sm:text-sm cursor-text"
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 h-12 md:h-14 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950 transition-all text-xs sm:text-sm cursor-text"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                {/* Guardian Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Guardian / Spouse Name
                  </label>
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 h-12 md:h-14 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950 transition-all text-xs sm:text-sm cursor-text"
                    placeholder="Guardian or spouse name"
                  />
                </div>

                {/* Gender - own row */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Gender
                  </label>
                  <GenderDropdown
                    value={formData.gender}
                    onSelect={handleGenderChange}
                    defaultValue="Female"
                  />
                </div>

                {/* Date of Birth - own row */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Date of Birth
                  </label>
                  <DobDropdown
                    value={formData.dateOfBirth}
                    onChange={handleDobChange}
                    placeholder="Select date of birth"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 h-12 md:h-14 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950 transition-all text-xs sm:text-sm cursor-text"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950 transition-all resize-none text-xs sm:text-sm cursor-text"
                      placeholder="Patient address"
                    />
                  </div>
                </div>
              </div>

              {/* Global Modal Footer */}
              <ModalFooter
                onCancel={onClose}
                onSubmit={handleSubmit}
                isSubmitting={updatePatient.isPending}
                cancelText="Cancel"
                submitText="Save Changes"
                loadingText="Saving..."
                submitIcon={Save}
                theme="blue"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditPatientModal;
