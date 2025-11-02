import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

// Response type for infertility patient list
export interface InfertilityPatient {
  id: number;
  patientId: number;
  hospitalId: number;
  patient: {
    id: number;
    fullName: string;
    age: number | null;
    phoneNumber: string | null;
    email: string | null;
    gender: string;
  };
  hospital: {
    id: number;
    name: string;
    type: string | null;
  };
  yearsMarried: number | null;
  yearsTrying: number | null;
  infertilityType: string | null;
  status: string | null;
  nextAppointment: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Filter options
export interface InfertilityFilters {
  status?: string;
  hospitalId?: number;
  infertilityType?: string;
  search?: string;
}

export function useFetchInfertilityData(filters: InfertilityFilters = {}) {
  return useQuery({
    queryKey: ["infertilityPatients", filters],
    queryFn: async (): Promise<InfertilityPatient[]> => {
      try {
        const params = new URLSearchParams();

        // Add filters
        if (filters.status) {
          params.append("status", filters.status);
        }

        if (filters.hospitalId) {
          params.append("hospitalId", filters.hospitalId.toString());
        }

        if (filters.infertilityType) {
          params.append("infertilityType", filters.infertilityType);
        }

        if (filters.search) {
          params.append("search", filters.search);
        }

        const response = await api.get<{
          success: boolean;
          data: InfertilityPatient[];
          error?: string;
        }>(`/infertility-patients?${params.toString()}`);

        console.log("Infertility Patients API Response:", response.data);

        if (!response.data.success) {
          throw new Error(
            response.data.error || "Failed to fetch infertility patients"
          );
        }

        return response.data.data;
      } catch (error) {
        console.error("Error fetching infertility patients:", error);
        throw error;
      }
    },
  });
}
