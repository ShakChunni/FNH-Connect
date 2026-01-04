/**
 * Fetch Departments Hook
 * React Query hook for fetching available departments
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Department } from "../types";

interface FetchDepartmentsResponse {
  success: boolean;
  data: Department[];
  error?: string;
}

// Departments to exclude from general admission (they have dedicated modules)
const EXCLUDED_DEPARTMENTS = ["pathology", "infertility"];

export function useFetchDepartments() {
  return useQuery({
    queryKey: ["departments", "admission"],
    queryFn: async (): Promise<Department[]> => {
      const response = await api.get<FetchDepartmentsResponse>("/departments");

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch departments");
      }

      // Filter out pathology and infertility departments
      const filteredDepartments = response.data.data.filter(
        (dept) => !EXCLUDED_DEPARTMENTS.includes(dept.name.toLowerCase())
      );

      return filteredDepartments;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (departments don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
