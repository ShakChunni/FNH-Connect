/**
 * Fetch Available Staff Hook
 * React Query hook for fetching staff members who don't have a User account
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { StaffRecord } from "../types";

interface StaffResponse {
  success: boolean;
  data: StaffRecord[];
  error?: string;
}

export function useFetchAvailableStaff(search?: string) {
  return useQuery({
    queryKey: ["user-management", "available-staff", search],
    queryFn: async (): Promise<StaffRecord[]> => {
      const params = new URLSearchParams();

      if (search) {
        params.append("search", search);
      }

      const response = await api.get<StaffResponse>(
        `/admin/user-management/staff?${params.toString()}`,
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to fetch available staff",
        );
      }

      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
