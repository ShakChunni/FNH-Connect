import { useState, useCallback } from "react";

interface SortOrderUpdate {
  id: number;
  sortOrder: number;
}

interface UseUpdatePreDefinedTasksSortOrderResult {
  updateSortOrders: (
    updates: SortOrderUpdate[]
  ) => Promise<{ success: boolean }>;
  isLoading: boolean;
  error: Error | null;
}

export default function useUpdatePreDefinedTasksSortOrder(): UseUpdatePreDefinedTasksSortOrderResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const updateSortOrders = useCallback(async (updates: SortOrderUpdate[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/pre-defined-tasks/update-sort-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ updates }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Error updating task sort orders: ${response.status}`
        );
      }

      const data = await response.json();
      return { success: true };
    } catch (err) {
      const errorObject =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setError(errorObject);
      console.error("Error updating task sort orders:", err);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    updateSortOrders,
    isLoading,
    error,
  };
}
