import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { useAuth } from "@/app/AuthContext";

export interface InfertilityPatientBasic {
  id: number;
  patientFullName: string;
  mobileNumber: string | null;
  email: string | null;
  patientAge: number | null;
  hospitalName: string | null;
}

const useFetchPatientInformation = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQueryState] = useState("");
  const [patients, setPatients] = useState<InfertilityPatientBasic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized setSearchQuery to prevent infinite re-renders
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const fetchPatients = useCallback(
    async (query: string) => {
      if (!user?.username || query.length < 1) {
        setPatients([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        const response = await axios.get<InfertilityPatientBasic[]>(
          `/api/infertility-patients/search`,
          {
            params: {
              query: query.trim(),
              searchBy: "both", // Search by both name and mobile number
              username: user.username,
              userRole: user.role,
            },
            signal: abortControllerRef.current.signal,
            timeout: 5000,
          }
        );

        setPatients(response.data);
      } catch (err) {
        if (axios.isCancel(err)) return;

        // Handle specific error cases
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            setError("Patient search API not found. Please contact support.");
            console.warn("Patient search API endpoint not implemented");
          } else if (err.response && err.response.status >= 500) {
            setError("Server error. Please try again later.");
          } else if (err.code === "ECONNABORTED") {
            setError("Request timeout. Please try again.");
          } else {
            setError("Failed to fetch patients. Please try again.");
          }
        } else {
          setError("Network error. Please check your connection.");
        }

        console.error("Patient fetch error:", err);
        setPatients([]);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [user?.username]
  );

  const debouncedFetch = useCallback(debounce(fetchPatients, 150), [
    fetchPatients,
  ]);

  useEffect(() => {
    debouncedFetch(searchQuery);

    return () => {
      debouncedFetch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, debouncedFetch]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    patients,
    loading,
    error,
    setPatients,
  };
};

export default useFetchPatientInformation;
