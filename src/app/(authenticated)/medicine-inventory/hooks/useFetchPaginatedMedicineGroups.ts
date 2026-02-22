import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { MedicineGroup } from "../types";

interface GroupsResponse {
  success: boolean;
  data: MedicineGroup[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface GroupFilters {
  search?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedGroups {
  data: MedicineGroup[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export function useFetchPaginatedMedicineGroups(filters: GroupFilters = {}) {
  return useQuery({
    queryKey: ["medicine-inventory", "groups", "paginated", filters],
    queryFn: async (): Promise<PaginatedGroups> => {
      const params = new URLSearchParams();
      params.append("activeOnly", String(filters.activeOnly !== false));

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.page) {
        params.append("page", filters.page.toString());
      }

      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }

      const response = await api.get<GroupsResponse>(
        `/medicine-inventory/groups?${params.toString()}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch groups");
      }

      return {
        data: response.data.data || [],
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
        currentPage: response.data.pagination.page,
        limit: response.data.pagination.limit,
      };
    },

    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
