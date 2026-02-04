/**
 * Fetch Medicine Groups Hook
 * React Query hook for fetching medicine categories/groups
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { MedicineGroup } from "../types";

interface GroupsResponse {
  success: boolean;
  data: MedicineGroup[];
  error?: string;
}

export function useFetchMedicineGroups(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ["medicine-inventory", "groups", activeOnly],
    queryFn: async (): Promise<MedicineGroup[]> => {
      const response = await api.get<GroupsResponse>(
        `/medicine-inventory/groups?activeOnly=${activeOnly}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch groups");
      }

      return response.data.data || [];
    },

    staleTime: 5 * 60 * 1000, // 5 minutes - groups change less frequently
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });
}
