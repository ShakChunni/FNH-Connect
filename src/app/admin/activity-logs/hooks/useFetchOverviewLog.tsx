import { useState, useCallback, useEffect, useRef } from "react";

interface OverviewData {
  id: number;
  organization_name: string;
  client_name: string | null;
  client_contact_number: string | null;
  client_contact_email: string | null;
  organization_website: string | null;
  industry_name: string | null;
  organization_location: string;
  lead_source: string;
  prospect_date: string | null;
  meetings_conducted: boolean | null;
  meeting_date: string | null;
  proposal_in_progress: boolean | null;
  proposal_in_progress_date: string | null;
  proposal_sent_out: boolean | null;
  proposal_sent_out_date: string | null;
  quotation_signed: boolean | null;
  quotation_signed_date: string | null;
  quotation_number: string | null;
  lost_lead: boolean | null;
  type: string | null;
  notes: string | null;
  total_proposal_value: number | null;
  total_closed_sale: number | null;
  source_table: string;
  PIC: string;
  source_organization: string | null;

  // Status fields
  isInactive: boolean | null;
  inactiveReason: string | null;
  deleteReason: string | null;

  // Audit fields
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  old_id?: number; // Only in DeletedData
}

const useFetchOverviewLog = (
  initialId?: number,
  initialSourceTable?: string,
  initialIsDeleted: boolean = false
) => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track if component is mounted
  const isMounted = useRef(true);

  // Add a ref to track the current request to prevent duplicate calls
  const currentRequest = useRef<{
    id: number;
    table: string;
    deleted: boolean;
  } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchOverviewData = useCallback(
    async (id: number, sourceTable: string, isDeleted: boolean = false) => {
      // Only proceed if we have valid parameters
      if (!id || !sourceTable) {
        return;
      }

      // Check if this is a duplicate request - if same params, don't fetch again
      if (
        currentRequest.current?.id === id &&
        currentRequest.current?.table === sourceTable &&
        currentRequest.current?.deleted === isDeleted
      ) {
        return;
      }

      // Set current request
      currentRequest.current = { id, table: sourceTable, deleted: isDeleted };

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/activity-logs/fetch-expanded?id=${id}&sourceTable=${sourceTable}&isDeleted=${isDeleted}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch overview data");
        }

        const data = await response.json();

        // Only update state if component is still mounted
        if (isMounted.current) {
          setOverviewData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in fetch:", err);
        if (isMounted.current) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
          setOverviewData(null);
          setLoading(false);
        }
      }
    },
    []
  );

  // Auto-fetch if initial values are provided, but ONLY ONCE
  useEffect(() => {
    if (initialId && initialSourceTable && !currentRequest.current) {
      fetchOverviewData(initialId, initialSourceTable, initialIsDeleted);
    }
  }, [initialId, initialSourceTable, initialIsDeleted, fetchOverviewData]);

  const resetData = useCallback(() => {
    setOverviewData(null);
    setLoading(false);
    setError(null);
    currentRequest.current = null;
  }, []);

  return {
    overviewData,
    loading,
    error,
    fetchOverviewData,
    resetData,
  };
};

export default useFetchOverviewLog;
