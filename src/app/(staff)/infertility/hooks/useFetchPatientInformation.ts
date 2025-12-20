import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";
import { getAgeInYears } from "../../../../components/form-sections/utils/dateUtils";
import type { InfertilityPatientBasic } from "@/app/(staff)/infertility/types";

export function useFetchPatientInformation(searchQuery: string) {
  // Use the global debounce hook
  const debouncedQuery = useDebounce(searchQuery || "", 150);

  return useQuery({
    queryKey: ["infertilityPatients", "search", debouncedQuery],
    queryFn: async (): Promise<InfertilityPatientBasic[]> => {
      if (!debouncedQuery || !debouncedQuery.trim()) {
        return [];
      }

      const response = await api.get<{
        success: boolean;
        data: Array<{
          id: number;
          patientId: number;
          patient: {
            id: number;
            fullName: string;
            dateOfBirth: string | null;
            phoneNumber: string | null;
            email: string | null;
          };
        }>;
        error?: string;
      }>("/infertility-patients", {
        params: {
          search: debouncedQuery.trim(),
          limit: 10,
        },
        timeout: 5000,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch patients");
      }

      // Transform the data to match InfertilityPatientBasic format
      return (response.data.data || []).map((record) => ({
        id: record.patientId,
        patientFullName: record.patient.fullName,
        patientAge: getAgeInYears(record.patient.dateOfBirth),
        dateOfBirth: record.patient.dateOfBirth,
        mobileNumber: record.patient.phoneNumber,
        email: record.patient.email,
      }));
    },
    enabled: !!(debouncedQuery && debouncedQuery.trim()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
  });
}
