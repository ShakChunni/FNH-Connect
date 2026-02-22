/**
 * Fetch All Staff Hook
 * React Query hook for fetching all staff records
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { StaffRecord } from "../types";

interface StaffResponse {
  success: boolean;
  data: StaffRecord[];
  error?: string;
}

export function useFetchAllStaff() {
  return useQuery({
    queryKey: ["user-management", "all-staff"],
    queryFn: async (): Promise<StaffRecord[]> => {
      const response = await api.get<StaffResponse>(
        "/admin/user-management/staff?all=true",
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch staff");
      }

      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
