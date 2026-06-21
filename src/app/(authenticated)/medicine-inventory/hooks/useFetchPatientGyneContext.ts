/**
 * Patient Gynecology Context Hook
 * React Query query used by the Medicine Inventory multi-item sale modal
 * to decide whether to enable the LUCS quick-fill action.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { GyneAdmissionContext } from "../types";

interface GyneContextApiResponse {
  success: boolean;
  data: GyneAdmissionContext | null;
  error?: string;
}

export function useFetchPatientGyneContext(
  patientId: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["medicine-inventory", "patient-gyne-context", patientId],
    queryFn: async (): Promise<GyneAdmissionContext | null> => {
      if (!patientId) return null;
      const response = await api.get<GyneContextApiResponse>(
        `/medicine-inventory/patients/${patientId}/gyne-context`,
        { timeout: 5000 },
      );
      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to load gynecology context",
        );
      }
      return response.data.data;
    },
    enabled: enabled && Boolean(patientId),
    staleTime: 30000,
    gcTime: 60000,
  });
}
