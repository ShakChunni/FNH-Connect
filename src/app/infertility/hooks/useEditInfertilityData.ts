import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

// Edit request type
export interface EditInfertilityPatientRequest {
  id: number; // Infertility patient record ID
  patient: {
    id: number | null;
    firstName: string;
    lastName: string;
    fullName: string;
    gender: string;
    age: number | null;
    dateOfBirth: Date | null;
    guardianName: string;
    address: string;
    phoneNumber: string;
    email: string;
    bloodGroup: string;
  };
  hospital: {
    id: number | null;
    name: string;
    address: string;
    phoneNumber: string;
    email: string;
    website: string;
    type: string;
  };
  spouseInfo: {
    name: string;
    age: number | null;
    dateOfBirth: Date | null;
    gender: string;
  };
  medicalInfo: {
    yearsMarried: number | null;
    yearsTrying: number | null;
    infertilityType: string;
    para: string;
    gravida: string;
    weight: number | null;
    height: number | null;
    bmi: number | null;
    bloodPressure: string;
    medicalHistory: string;
    surgicalHistory: string;
    menstrualHistory: string;
    contraceptiveHistory: string;
    referralSource: string;
    chiefComplaint: string;
    treatmentPlan: string;
    medications: string;
    nextAppointment: Date | null;
    status: string;
    notes: string;
  };
}

// Edit response type
export interface EditInfertilityPatientResponse {
  success: boolean;
  data?: {
    id: number;
    patient: {
      id: number;
      fullName: string;
    };
    displayId: string;
  };
  message?: string;
  error?: string;
}

export function useEditInfertilityData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: EditInfertilityPatientRequest
    ): Promise<EditInfertilityPatientResponse> => {
      try {
        const { id, ...updateData } = data;
        const response = await api.patch<EditInfertilityPatientResponse>(
          `/infertility-patients/${id}`,
          updateData
        );

        console.log("Edit Infertility Patient API Response:", response.data);

        if (!response.data.success) {
          throw new Error(
            response.data.error || "Failed to edit infertility patient"
          );
        }

        return response.data;
      } catch (error) {
        console.error("Error editing infertility patient:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch infertility patients list
      queryClient.invalidateQueries({
        queryKey: ["infertilityPatients"],
      });
    },
  });
}
