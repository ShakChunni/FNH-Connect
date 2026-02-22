/**
 * Fetch Users Hook
 * React Query hook for fetching users with filters and pagination
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { UserWithStaff, UserFilters } from "../types";

interface UsersResponse {
  success: boolean;
  data: UserWithStaff[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

export interface PaginatedUsers {
  data: UserWithStaff[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export function useFetchUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ["user-management", "users", filters],
    queryFn: async (): Promise<PaginatedUsers> => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.append("search", filters.search);
      }

      if (filters.role) {
        params.append("role", filters.role);
      }

      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }

      if (filters.page) {
        params.append("page", filters.page.toString());
      }

      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }

      const response = await api.get<UsersResponse>(
        `/admin/user-management?${params.toString()}`,
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch users");
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
