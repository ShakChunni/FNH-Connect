import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { useAuth } from "@/app/AuthContext";

export interface ClientWithOrg {
  id: number;
  name: string;
  position: string | null;
  contact_number: string | null;
  contact_email: string | null;
  organization: {
    id: number;
    name: string;
  };
}

const useFetchClientInformation = () => {
  const { user } = useAuth(); // Get current user
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<ClientWithOrg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchClients = useCallback(
    async (query: string) => {
      // Early return if no user or short query
      if (!user?.username || query.length < 1) {
        setClients([]);
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
        const response = await axios.get<ClientWithOrg[]>(
          `/api/clients/search`,
          {
            params: {
              query: query.trim(),
              username: user.username,
              userRole: user.role,
            },
            signal: abortControllerRef.current.signal,
            timeout: 5000,
          }
        );

        setClients(response.data);
      } catch (err) {
        if (axios.isCancel(err)) return;

        setError("Failed to fetch clients.");
        console.error(err);
        setClients([]);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [user?.username]
  );

  const debouncedFetch = useCallback(debounce(fetchClients, 150), [
    fetchClients,
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
    clients,
    loading,
    error,
    setClients,
  };
};

export default useFetchClientInformation;
