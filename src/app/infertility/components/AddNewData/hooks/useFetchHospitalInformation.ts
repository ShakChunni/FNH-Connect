import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { useAuth } from "@/app/AuthContext";

export interface Hospital {
  id: number;
  name: string;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  type: string | null;
}

const useFetchHospitalInformation = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHospitals = useCallback(
    async (query: string) => {
      if (!user?.username || query.length < 1) {
        setHospitals([]);
        setLoading(false);
        return;
      }

      const trimmedQuery = query.trim();
      setLoading(true);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setError(null);

      try {
        const response = await axios.get<Hospital[]>(`/api/hospitals/search`, {
          params: {
            query: trimmedQuery,
            username: user.username,
            userRole: user.role,
          },
          signal: abortControllerRef.current.signal,
          timeout: 5000,
        });

        setHospitals(response.data);
      } catch (err) {
        if (axios.isCancel(err)) return;

        setError("Failed to fetch hospitals.");
        console.error(err);
        setHospitals([]);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [user?.username]
  );

  const debouncedFetch = useCallback(debounce(fetchHospitals, 200), [
    fetchHospitals,
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
    hospitals,
    loading,
    error,
    setHospitals,
  };
};

export default useFetchHospitalInformation;
