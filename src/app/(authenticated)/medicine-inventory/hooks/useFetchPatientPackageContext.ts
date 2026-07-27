import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface PatientPackageAdmissionContext {
  admissionId: number;
  admissionNumber: string;
  status: string;
  dateAdmitted: string;
  departmentId: number;
  departmentName: string;
  attachedPackageCodes: string[];
}

interface PackageContextApiResponse {
  success: boolean;
  data: { admissions: PatientPackageAdmissionContext[] };
  error?: string;
}

export function useFetchPatientPackageContext(
  patientId: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["medicine-inventory", "patient-package-context", patientId],
    queryFn: async () => {
      if (!patientId) return { admissions: [] };
      const response = await api.get<PackageContextApiResponse>(
        `/medicine-inventory/patients/${patientId}/package-context`,
        { timeout: 5000 },
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to load package context");
      }
      return response.data.data;
    },
    enabled: enabled && Boolean(patientId),
    staleTime: 0,
    gcTime: 60000,
  });
}
