/**
 * Sale Package Resolver Hook
 * Fetches a source-controlled medicine package (e.g. "LUCS_OT_MEDICINE")
 * with live `Medicine` catalog resolution.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { ResolvedMedicinePackageItem } from "@/services/medicinePackageService";

interface SalePackageApiResponse {
  success: boolean;
  data: {
    code: string;
    name: string;
    operationName: string;
    items: Array<{
      templateName: string;
      matched: boolean;
      medicineId: number | null;
      medicineName: string;
      genericName: string | null;
      groupName: string | null;
      companyName: string | null;
      defaultSalePrice: number;
      currentStock: number;
      lowStockThreshold: number;
      quantity: number;
      matchReason: string | null;
    }>;
  } | null;
  error?: string;
}

export function useFetchSalePackage(code: string, enabled: boolean) {
  return useQuery({
    queryKey: ["medicine-inventory", "sale-package", code],
    queryFn: async (): Promise<{
      code: string;
      name: string;
      operationName: string;
      items: ResolvedMedicinePackageItem[];
    } | null> => {
      const response = await api.get<SalePackageApiResponse>(
        `/medicine-inventory/sale-packages?code=${encodeURIComponent(code)}`,
        { timeout: 8000 },
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.error || "Failed to load medicine package",
        );
      }
      return response.data.data;
    },
    enabled,
    staleTime: 30000,
    gcTime: 60000,
  });
}
