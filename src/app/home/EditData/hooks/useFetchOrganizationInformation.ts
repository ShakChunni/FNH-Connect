import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { debounce } from "lodash";
import { useAuth } from "@/app/AuthContext";

export interface Client {
  id: number;
  name: string;
  position: string | null;
  contact_number: string | null;
  contact_email: string | null;
}

export interface Organization {
  id: number;
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
  lead_source: string | null;
  contacts: Client[];
}

const useFetchOrganizationInformation = (
  searchQuery: string,
  shouldFetch: boolean = true
) => {
  const { user } = useAuth(); // Get current user
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchOrganizations = useCallback(
    async (query: string) => {
      // Early return if no user, shouldFetch is false, or short query
      if (!user?.username || !shouldFetch || query.length < 1) {
        setOrganizations([]);
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
        const response = await axios.get<Organization[]>(
          `/api/organizations/search`,
          {
            params: {
              query: trimmedQuery,
              username: user.username,
              userRole: user.role,
            },
            signal: abortControllerRef.current.signal,
            timeout: 5000,
          }
        );

        setOrganizations(response.data);
      } catch (err) {
        if (axios.isCancel(err)) return;

        setError("Failed to fetch organizations.");
        console.error(err);
        setOrganizations([]);
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [user?.username, shouldFetch]
  );

  const debouncedFetch = useCallback(debounce(fetchOrganizations, 200), [
    fetchOrganizations,
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
    organizations,
    loading,
    error,
    setOrganizations,
  };
};

export default useFetchOrganizationInformation;
