import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { CashTrackingData, DetailedShift } from "./types";

export function useInfertilityCashTrackingShifts(filters: {
  staffId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["infertility-cash-tracking-shifts", filters],
    queryFn: async (): Promise<CashTrackingData> => {
      const params = new URLSearchParams();
      if (filters.staffId) params.append("staffId", filters.staffId.toString());
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "All")
        params.append("status", filters.status);

      const response = await api.get(
        `/infertility/cash-tracking?${params.toString()}`
      );
      return response.data;
    },
  });
}

export function useInfertilityCashTrackingShiftDetails(shiftId: number | null) {
  return useQuery({
    queryKey: ["infertility-cash-tracking-shift-details", shiftId],
    queryFn: async (): Promise<DetailedShift> => {
      if (!shiftId) throw new Error("No shift ID provided");
      const response = await api.get(`/infertility/cash-tracking/${shiftId}`);
      return response.data.shift;
    },
    enabled: !!shiftId,
  });
}
