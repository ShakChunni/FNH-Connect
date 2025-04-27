import { useState, useCallback } from "react";
import { useAuth } from "@/app/AuthContext";

interface ImportLeadsOptions {
  onSuccess?: (data: any[]) => void;
  onError?: (message: string) => void;
}

interface ImportLeadsResponse {
  success: boolean;
  data?: any[];
  message?: string;
}

const useImportLeadsData = (options: ImportLeadsOptions = {}) => {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any[] | null>(null);

  const importLeads = useCallback(
    async (mappedData: any[]) => {
      if (!mappedData?.length) {
        const errorMessage = "No data to import";
        setImportError(errorMessage);
        options.onError?.(errorMessage);
        return { success: false, message: errorMessage };
      }

      setIsImporting(true);
      setImportError(null);

      try {
        // Add user context to the request
        const requestData = {
          mappedData,
          userContext: {
            username: user?.username,
            role: user?.role,
            organizations: user?.organizations || [],
          },
        };

        const response = await fetch("/api/admin/leads/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const result: ImportLeadsResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to import data");
        }

        setImportResult(result.data || []);
        options.onSuccess?.(result.data || []);

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unknown error occurred during import";

        setImportError(errorMessage);
        options.onError?.(errorMessage);

        return { success: false, message: errorMessage };
      } finally {
        setIsImporting(false);
      }
    },
    [user, options]
  );

  const resetImportState = useCallback(() => {
    setImportError(null);
    setImportResult(null);
  }, []);

  return {
    importLeads,
    isImporting,
    importError,
    importResult,
    resetImportState,
  };
};

export default useImportLeadsData;
