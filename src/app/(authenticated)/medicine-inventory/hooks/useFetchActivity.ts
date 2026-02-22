import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export interface ActivityRecord {
  id: string;
  type: "purchase" | "sale";
  date: string;
  medicineName: string;
  medicineBrand?: string | null;
  groupName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  companyName?: string | null;
  invoiceNumber?: string | null;
  patientName?: string | null;
  patientPhone?: string | null;
}

interface ActivityResponse {
  success: boolean;
  data: ActivityRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface ActivityFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedActivity {
  data: ActivityRecord[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export function useFetchActivity(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: ["medicine-inventory", "activity", filters],
    queryFn: async (): Promise<PaginatedActivity> => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
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

      const response = await api.get<ActivityResponse>(
        `/medicine-inventory/activity?${params.toString()}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch activity");
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
