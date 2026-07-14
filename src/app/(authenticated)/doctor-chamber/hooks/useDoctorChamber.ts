import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  DoctorChamberConfigResponse,
  DoctorChamberInput,
  DoctorChamberListResponse,
  DoctorChamberMutationResponse,
  DoctorChamberPatientSearchResponse,
} from "../types";

export interface DoctorChamberListFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export function useDoctorChamberConfig() {
  return useQuery({
    queryKey: ["doctor-chamber", "config"],
    queryFn: async () => {
      const response = await api.get<DoctorChamberConfigResponse>(
        "/doctor-chamber/config",
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to load chamber configuration");
      }
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useDoctorChamberVisits(filters: DoctorChamberListFilters) {
  return useQuery({
    queryKey: ["doctor-chamber", "visits", filters],
    queryFn: async () => {
      const response = await api.get<DoctorChamberListResponse>(
        "/doctor-chamber",
        { params: filters },
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to load chamber visits");
      }
      return response.data;
    },
    placeholderData: (previous) => previous,
  });
}

export function useDoctorChamberPatientSearch(search: string) {
  return useQuery({
    queryKey: ["doctor-chamber", "patients", search],
    queryFn: async () => {
      const response = await api.get<DoctorChamberPatientSearchResponse>(
        "/doctor-chamber/patients",
        { params: { search } },
      );
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to search patients");
      }
      return response.data.data;
    },
    enabled: search.trim().length >= 2,
    staleTime: 60 * 1000,
  });
}

export function useCreateDoctorChamberVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DoctorChamberInput) => {
      const response = await api.post<DoctorChamberMutationResponse>(
        "/doctor-chamber",
        input,
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to create chamber visit");
      }
      return response.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctor-chamber"] });
    },
  });
}

export function useUpdateDoctorChamberVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: DoctorChamberInput }) => {
      const response = await api.patch<DoctorChamberMutationResponse>(
        `/doctor-chamber/${id}`,
        input,
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Failed to update chamber visit");
      }
      return response.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctor-chamber"] });
    },
  });
}

export async function fetchDoctorChamberReport(
  filters: Omit<DoctorChamberListFilters, "page" | "limit">,
) {
  const response = await api.get<DoctorChamberListResponse>(
    "/doctor-chamber/report",
    { params: filters },
  );
  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to load chamber report");
  }
  return response.data;
}

