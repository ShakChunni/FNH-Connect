/**
 * Fetch Doctors Hook for Admissions
 * Fetches all available doctors
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type { Doctor } from "../types";

interface FetchDoctorsResponse {
  success: boolean;
  data: Doctor[];
  error?: string;
}

export function useFetchDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async (): Promise<Doctor[]> => {
      const response = await api.get<FetchDoctorsResponse>("/staff/doctors");
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch doctors");
      }
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
