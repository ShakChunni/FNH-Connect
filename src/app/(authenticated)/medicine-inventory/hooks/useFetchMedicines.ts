/**
 * Fetch Medicines Hook
 * React Query hook for fetching medicines with filters and pagination
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Medicine, MedicineFilters } from "../types";

interface MedicinesResponse {
  success: boolean;
  data: Medicine[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface PaginatedMedicines {
  data: Medicine[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useFetchMedicines(filters: MedicineFilters = {}) {
  return useQuery({
    queryKey: ["medicine-inventory", "medicines", filters],
    queryFn: async (): Promise<PaginatedMedicines> => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.groupId) {
        params.append("groupId", filters.groupId.toString());
      }

      if (filters.lowStockOnly) {
        params.append("lowStockOnly", "true");
      }

      if (filters.page) {
        params.append("page", filters.page.toString());
      }

      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }

      const response = await api.get<MedicinesResponse>(
        `/medicine-inventory/medicines?${params.toString()}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch medicines");
      }

      return {
        data: response.data.data,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
        currentPage: response.data.pagination.page,
      };
    },

    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
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
