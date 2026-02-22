/**
 * Fetch Purchases Hook
 * React Query hook for fetching medicine purchases with filters
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { MedicinePurchase, PurchaseFilters } from "../types";

interface PurchasesResponse {
  success: boolean;
  data: MedicinePurchase[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface PaginatedPurchases {
  data: MedicinePurchase[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export function useFetchPurchases(filters: PurchaseFilters = {}) {
  return useQuery({
    queryKey: ["medicine-inventory", "purchases", filters],
    queryFn: async (): Promise<PaginatedPurchases> => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.companyId) {
        params.append("companyId", filters.companyId.toString());
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

      const response = await api.get<PurchasesResponse>(
        `/medicine-inventory/purchases?${params.toString()}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch purchases");
      }

      return {
        data: response.data.data,
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
