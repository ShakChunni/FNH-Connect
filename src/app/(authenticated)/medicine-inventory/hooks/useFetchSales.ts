/**
 * Fetch Sales Hook
 * React Query hook for fetching medicine sales with filters
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { MedicineSale, SaleFilters } from "../types";

interface SalesResponse {
  success: boolean;
  data: MedicineSale[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface PaginatedSales {
  data: MedicineSale[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useFetchSales(filters: SaleFilters = {}) {
  return useQuery({
    queryKey: ["medicine-inventory", "sales", filters],
    queryFn: async (): Promise<PaginatedSales> => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.patientId) {
        params.append("patientId", filters.patientId.toString());
      }

      if (filters.medicineId) {
        params.append("medicineId", filters.medicineId.toString());
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

      const response = await api.get<SalesResponse>(
        `/medicine-inventory/sales?${params.toString()}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch sales");
      }

      return {
        data: response.data.data,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
        currentPage: response.data.pagination.page,
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
