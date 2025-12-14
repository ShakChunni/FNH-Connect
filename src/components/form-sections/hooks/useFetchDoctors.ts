import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

interface Doctor {
  id: number;
  fullName: string;
  specialization: string | null;
  role: string;
}

export function useFetchDoctors() {
  return useQuery({
    queryKey: ["doctors", "all"],
    queryFn: async (): Promise<Doctor[]> => {
      const response = await api.get<{
        success: boolean;
        data: Doctor[];
        error?: string;
      }>("/staff/doctors", {
        timeout: 5000,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch doctors");
      }

      return response.data.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - doctors list changes infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
