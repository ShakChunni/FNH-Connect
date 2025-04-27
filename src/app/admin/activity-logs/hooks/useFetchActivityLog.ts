import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";

interface ActivityLog {
  id: number;
  timestamp: string;
  action: string;
  description: string;
  username: string;
  ip_address: string;
  device_type: string;
  source_id?: number;
  source_table?: string;
  // Add new fields from schema
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_vendor?: string;
  device_model?: string;
  device_type_spec?: string;
}

interface FetchParams {
  activityTypes?: string[];
  dateRange?: {
    start: string | null;
    end: string | null;
    option: string[];
  };
  searchQuery?: string;
}

interface CacheEntry {
  data: ActivityLog[];
  total: number;
  totalPages: number;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000;
const PAGE_SIZE = 50;

const useFetchActivityLog = (filters: FetchParams = {}) => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const cache = useRef<Record<string, CacheEntry>>({});
  const isFirstMount = useRef(true);
  const lastFetchedFilters = useRef<string>("");
  const lastFetchedPage = useRef<number>(1);

  const areFiltersDefault = useMemo(() => {
    return (
      !filters.activityTypes?.length &&
      !filters.searchQuery &&
      (!filters.dateRange ||
        (filters.dateRange.start === null &&
          filters.dateRange.end === null &&
          !filters.dateRange.option.length))
    );
  }, [filters.activityTypes, filters.dateRange, filters.searchQuery]);

  const getKLTime = useCallback(() => {
    const now = new Date();
    const klTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return klTime.toISOString();
  }, []);

  const getCacheKey = useCallback(
    (currentPage: number) => {
      return JSON.stringify({
        page: currentPage,
        activityTypes: filters.activityTypes || [],
        dateRange: filters.dateRange || { start: null, end: null, option: [] },
        searchQuery: filters.searchQuery || "",
        pageSize: PAGE_SIZE,
      });
    },
    [filters]
  );

  const fetchActivityLogs = useCallback(
    async (currentPage: number) => {
      const cacheKey = getCacheKey(currentPage);
      const cachedData = cache.current[cacheKey];

      // Update tracking refs
      lastFetchedFilters.current = JSON.stringify(filters);
      lastFetchedPage.current = currentPage;

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        setActivityLogs(cachedData.data);
        setTotalRecords(cachedData.total);
        setTotalPages(cachedData.totalPages);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const now = getKLTime();

        const response = await axios.post(`/api/admin/activity-logs/fetch`, {
          page: currentPage,
          pageSize: PAGE_SIZE,
          activityTypes: filters.activityTypes || [],
          searchQuery: filters.searchQuery || "",
          startDate: filters.dateRange?.start || null,
          endDate: filters.dateRange?.end || null,
          dateOption: filters.dateRange?.option || [],
          currentTime: now,
        });

        const { data, total, totalPages: responseTotalPages } = response.data;

        cache.current[cacheKey] = {
          data,
          total,
          totalPages: responseTotalPages,
          timestamp: Date.now(),
        };

        setActivityLogs(data);
        setTotalRecords(total);
        setTotalPages(responseTotalPages);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setError(
            err.response.data.message || "An error occurred while fetching data"
          );
        } else {
          setError("An unknown error occurred");
        }
        delete cache.current[cacheKey];
      } finally {
        setLoading(false);
      }
    },
    [filters, getCacheKey, getKLTime]
  );

  // Single unified effect to handle all data fetching logic
  useEffect(() => {
    // First mount - just fetch data
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchActivityLogs(1);
      return;
    }

    const currentFiltersStr = JSON.stringify(filters);
    const filtersChanged = currentFiltersStr !== lastFetchedFilters.current;

    // If filters changed, reset to page 1 and fetch
    if (filtersChanged) {
      setPage(1);
      fetchActivityLogs(1);
    }
    // Otherwise, if page changed but filters are the same, fetch that page
    else if (page !== lastFetchedPage.current) {
      fetchActivityLogs(page);
    }

    // Cleanup function
    return () => {
      // No cleanup needed here
    };
  }, [
    page,
    filters.activityTypes,
    filters.dateRange?.start,
    filters.dateRange?.end,
    filters.dateRange?.option,
    filters.searchQuery,
    fetchActivityLogs,
  ]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      cache.current = {};
    };
  }, []);

  return {
    activityLogs,
    loading,
    error,
    page,
    totalPages,
    totalRecords,
    setPage,
    refetch: () => fetchActivityLogs(page),
    clearCache: () => {
      cache.current = {};
    },
  };
};

export default useFetchActivityLog;
