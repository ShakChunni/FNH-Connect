import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { CashTrackingData, DetailedShift } from "../types";

export function useAdminShifts(filters: {
  staffId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["admin-shifts", filters],
    queryFn: async (): Promise<CashTrackingData> => {
      const params = new URLSearchParams();
      if (filters.staffId) params.append("staffId", filters.staffId.toString());
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search) params.append("search", filters.search);
      if (filters.status && filters.status !== "All")
        params.append("status", filters.status);

      const response = await api.get(
        `/admin/cash-tracking?${params.toString()}`
      );
      return response.data.data;
    },
  });
}

export function useShiftDetails(shiftId: number | null) {
  return useQuery({
    queryKey: ["admin-shift-details", shiftId],
    queryFn: async (): Promise<DetailedShift> => {
      if (!shiftId) throw new Error("No shift ID provided");
      const response = await api.get(`/admin/cash-tracking/${shiftId}`);
      return response.data.data;
    },
    enabled: !!shiftId,
  });
}
