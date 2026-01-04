import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";
import { getAgeInYears } from "../../../../components/form-sections/utils/dateUtils";
import type { InfertilityPatientBasic } from "@/app/(authenticated)/infertility/types";

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
          fullName: string;
          dateOfBirth: string | null;
          phoneNumber: string | null;
          email: string | null;
          gender: string | null;
          address: string | null;
          guardianName: string | null;
          guardianDOB: string | null;
          guardianGender: string | null;
          guardianPhone: string | null;
          guardianEmail: string | null;
          guardianAddress: string | null;
          bloodGroup: string | null;
          occupation: string | null;
          guardianOccupation: string | null;
        }>;
        error?: string;
      }>("/patient-records", {
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
        id: record.id,
        patientFullName: record.fullName,
        patientAge: getAgeInYears(record.dateOfBirth),
        dateOfBirth: record.dateOfBirth ?? null, // Ensure explicitly null if undefined
        mobileNumber: record.phoneNumber,
        email: record.email,
        gender: record.gender,
        address: record.address,
        guardianName: record.guardianName,
        guardianDOB: record.guardianDOB,
        guardianGender: record.guardianGender,
        guardianPhone: record.guardianPhone,
        guardianEmail: record.guardianEmail,
        guardianAddress: record.guardianAddress,
        bloodGroup: record.bloodGroup,
        occupation: record.occupation,
        guardianOccupation: record.guardianOccupation,
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
