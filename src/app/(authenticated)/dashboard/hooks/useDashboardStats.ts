"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import type {
  DashboardStats,
  RecentPatient,
  CashFlowSession,
  DashboardData,
} from "../types";

// ============================================
// Mock Data (Fallback for Demo/Development)
// ============================================

const mockData: DashboardData = {
  stats: {
    totalActivePatients: 47,
    patientsAdmittedToday: 5,
    dischargedToday: 3,
    dischargedAllTime: 156,
    occupancyRate: 78,
    pathologyDoneToday: 12,
    pathologyDoneAllTime: 1248,
  },
  recentPatients: [
    {
      id: 1,
      patientId: 101,
      name: "Fatima Rahman",
      phoneNumber: "01712345678",
      admissionDate: new Date().toISOString(),
      department: "Gynecology",
      departmentType: "general",
      status: "admitted",
      roomNumber: "201-A",
    },
    {
      id: 2,
      patientId: 102,
      name: "Ayesha Begum",
      phoneNumber: "01823456789",
      admissionDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      department: "Infertility",
      departmentType: "infertility",
      status: "admitted",
    },
    {
      id: 3,
      patientId: 103,
      name: "Nasreen Khatun",
      phoneNumber: "01934567890",
      admissionDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      department: "Pathology",
      departmentType: "pathology",
      status: "pending",
    },
  ],
  cashSession: null,
};

// ============================================
// Single Dashboard Data Hook (RESTful)
// ============================================

interface DashboardApiResponse {
  success: boolean;
  data: DashboardData;
  error?: string;
}

export function useDashboardData() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      try {
        const response = await api.get<DashboardApiResponse>("/dashboard");
        if (!response.data.success) {
          throw new Error(
            response.data.error || "Failed to fetch dashboard data"
          );
        }
        return response.data.data;
      } catch (error) {
        console.warn("[useDashboardData] Using mock data:", error);
        return mockData;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  return {
    stats: query.data?.stats ?? null,
    recentPatients: query.data?.recentPatients ?? [],
    cashSession: query.data?.cashSession ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export default useDashboardData;
