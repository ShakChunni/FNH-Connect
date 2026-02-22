/**
 * Fetch Medicines Hook
 * React Query hook for fetching medicines with filters and pagination
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Medicine, MedicineFilters } from "../types";

interface MedicinesResponse {
  success: boolean;
  data: Array<
    Medicine & {
      group?: {
        id: number;
        name: string;
      };
      groupId?: number;
      groupName?: string;
    }
  >;
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
  limit: number;
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

      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.append("endDate", filters.endDate);
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

      const normalizedMedicines: Medicine[] = response.data.data.map(
        (medicine) => ({
          ...medicine,
          group: medicine.group ?? {
            id: medicine.groupId ?? 0,
            name: medicine.groupName || "Unknown Group",
          },
        }),
      );

      return {
        data: normalizedMedicines,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
        currentPage: response.data.pagination.page,
        limit: response.data.pagination.limit,
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
