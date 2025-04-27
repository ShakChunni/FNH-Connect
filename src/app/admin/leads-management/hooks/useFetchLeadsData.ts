import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/AuthContext";

interface ContactData {
  id: number;
  organization: string;
  client_position: string | null;
  client_name: string | null;
  client_email: string | null;
  client_Quality: string | null;
  client_otherEmail: string | null;
  client_phone: string | null;
  client_otherPhone: string | null;
  client_linkedinUrl: string | null;
  industry: string | null;
  address: string | null;
  ownerId: number | null;
  owner: { username: string; fullName: string | null } | null;
  assignedDate: string | null;
  assignedOrg: string | null;
  status: string | null;
  contactDate: string | null;
  notes: string | null;
  followUpDate: string | null;
  uploadedAt: string;
  isActive: boolean;
}

interface FetchProspectingDataParams {
  status?: string;
  owner?: string;
  assignedOrg?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

const useFetchLeadsData = (
  initialFilters: FetchProspectingDataParams = {}
) => {
  const { user } = useAuth();
  const [data, setData] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<FetchProspectingDataParams>(initialFilters);

  const fetchData = useCallback(
    async (params: FetchProspectingDataParams = {}) => {
      setLoading(true);
      setError(null);

      try {
        if (!user) {
          setLoading(false);
          return;
        }

        // Use request body for parameters instead of query string
        const requestData = {
          // Include all filters
          ...filters,
          ...params,

          // Include user context
          currentUsername: user.username,
          currentRole: user.role,
          manages: user.manages || [],
          organizations: user.organizations || [],
        };

        const response = await fetch("/api/admin/leads/fetch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const responseData = await response.json();
        setData(responseData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
        console.error("Error fetching prospecting data:", err);
      } finally {
        setLoading(false);
      }
    },
    [user, filters]
  );

  // Apply new filters and refetch data
  const applyFilters = useCallback(
    (newFilters: FetchProspectingDataParams) => {
      setFilters((prev) => {
        const updatedFilters = { ...prev, ...newFilters };
        fetchData(updatedFilters);
        return updatedFilters;
      });
    },
    [fetchData]
  );

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to manually trigger a refresh
  const refetch = useCallback(
    (newData?: ContactData[]) => {
      if (newData) {
        setData((prev) => [...prev, ...newData]);
      } else {
        fetchData();
      }
    },
    [fetchData]
  );

  return {
    data,
    loading,
    error,
    refetch,
    applyFilters,
    filters,
  };
};

export default useFetchLeadsData;
