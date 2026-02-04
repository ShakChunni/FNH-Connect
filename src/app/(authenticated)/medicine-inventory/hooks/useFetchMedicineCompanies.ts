/**
 * Fetch Medicine Companies Hook
 * React Query hook for fetching pharmaceutical companies/suppliers
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { MedicineCompany } from "../types";

interface CompaniesResponse {
  success: boolean;
  data: MedicineCompany[];
  error?: string;
}

export function useFetchMedicineCompanies(
  activeOnly: boolean = true,
  search?: string,
) {
  return useQuery({
    queryKey: ["medicine-inventory", "companies", activeOnly, search],
    queryFn: async (): Promise<MedicineCompany[]> => {
      const params = new URLSearchParams();
      params.append("activeOnly", String(activeOnly));
      if (search) {
        params.append("search", search);
      }

      const response = await api.get<CompaniesResponse>(
        `/medicine-inventory/companies?${params.toString()}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch companies");
      }

      return response.data.data || [];
    },

    staleTime: 5 * 60 * 1000, // 5 minutes
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
