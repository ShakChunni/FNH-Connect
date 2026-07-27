import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface SalePackageSummary {
  code: string;
  name: string;
  operationName: string;
  departmentName: string;
}

interface SalePackageSummaryApiResponse {
  success: boolean;
  data: SalePackageSummary[];
  error?: string;
}

export function useFetchSalePackageSummaries(enabled: boolean) {
  return useQuery({
    queryKey: ["medicine-inventory", "sale-package-summaries"],
    queryFn: async () => {
      const response = await api.get<SalePackageSummaryApiResponse>(
        "/medicine-inventory/sale-packages?mode=list",
        { timeout: 5000 },
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to load medicine packages");
      }
      return response.data.data;
    },
    enabled,
    staleTime: 30000,
    gcTime: 60000,
  });
}
