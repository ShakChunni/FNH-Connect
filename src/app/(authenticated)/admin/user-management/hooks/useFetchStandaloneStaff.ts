/**
 * Fetch Standalone Staff Hook
 * React Query hook for fetching staff records without linked User accounts
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { StaffRecord } from "../types";

interface StandaloneStaffResponse {
  success: boolean;
  data: StaffRecord[];
  error?: string;
}

interface UseFetchStandaloneStaffOptions {
  search?: string;
  includeInactive?: boolean;
}

export function useFetchStandaloneStaff(
  options: UseFetchStandaloneStaffOptions = {},
) {
  const { search, includeInactive } = options;

  return useQuery({
    queryKey: [
      "user-management",
      "standalone-staff",
      { search, includeInactive },
    ],
    queryFn: async (): Promise<StaffRecord[]> => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (includeInactive) params.set("includeInactive", "true");

      const response = await api.get<StandaloneStaffResponse>(
        `/admin/user-management/staff?${params.toString()}`,
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
