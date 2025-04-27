import { useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface ActiveDataProps {
  id: number;
  sourceTable: string;
}

const useActiveData = (onClose: () => void) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleActive = useCallback(
    async ({ id, sourceTable }: ActiveDataProps) => {
      if (!id || !sourceTable) {
        throw new Error("Missing required fields");
      }

      const convertedData = {
        id,
        sourceTable,
        username: user?.username || "",
      };

      const response = await fetch("/api/unarchive/tableData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(convertedData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Invalidate and refetch the dashboard data query
      await queryClient.invalidateQueries({ queryKey: ["dashboardData"] });

      return response.json();
    },
    [user?.username, queryClient]
  );

  return handleActive;
};

export default useActiveData;
