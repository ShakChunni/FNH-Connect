import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useDebounce } from "@/hooks/useDebounce";

import {
  getAgeInYearsFromDateOfBirth,
  parseDateOfBirth,
} from "@/lib/dateOfBirth";
// Helper to calculate age from DOB
const getAgeFromDOB = (dob: string | null): number | null => {
  return getAgeInYearsFromDateOfBirth(dob);
};

// Basic patient type for pathology search results
export interface PathologyPatientBasic {
  id: number;
  firstName: string;
  lastName: string;
  patientFullName: string;
  patientAge: number | null;
  patientGender: string;
  dateOfBirth: Date | string | null;
  mobileNumber: string | null;
  email: string | null;
  address: string | null;
  guardianName: string | null;
  guardianDOB: Date | string | null;
  guardianGender: string | null;
  bloodGroup: string | null;
}

export function useFetchPathologyPatients(searchQuery: string) {
  // Use the global debounce hook
  const debouncedQuery = useDebounce(searchQuery || "", 150);

  return useQuery({
    queryKey: ["patientRecords", "search", debouncedQuery],
    queryFn: async (): Promise<PathologyPatientBasic[]> => {
      if (
        !debouncedQuery ||
        !debouncedQuery.trim() ||
        debouncedQuery.trim().length < 2
      ) {
        return [];
      }

      const response = await api.get<{
        success: boolean;
        data: Array<{
          id: number;
          firstName: string;
          lastName: string;
          fullName: string;
          gender: string;
          dateOfBirth: string | null;
          guardianName: string | null;
          guardianDOB: string | null;
          guardianGender: string | null;
          address: string | null;
          phoneNumber: string | null;
          email: string | null;
          bloodGroup: string | null;
        }>;
        error?: string;
      }>("/patient-records", {
        params: {
          search: debouncedQuery.trim(),
        },
        timeout: 5000,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch patients");
      }

      // Transform the data to match PathologyPatientBasic format
      return (response.data.data || []).slice(0, 10).map((patient) => ({
        id: patient.id,
        firstName: patient.firstName || "",
        lastName: patient.lastName || "",
        patientFullName: patient.fullName,
        patientAge: getAgeFromDOB(patient.dateOfBirth),
        patientGender: patient.gender || "",
        dateOfBirth: parseDateOfBirth(patient.dateOfBirth),
        mobileNumber: patient.phoneNumber,
        email: patient.email,
        address: patient.address,
        guardianName: patient.guardianName,
        guardianDOB: parseDateOfBirth(patient.guardianDOB),
        guardianGender: patient.guardianGender,
        bloodGroup: patient.bloodGroup,
      }));
    },
    enabled: !!(
      debouncedQuery &&
      debouncedQuery.trim() &&
      debouncedQuery.trim().length >= 2
    ),
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
