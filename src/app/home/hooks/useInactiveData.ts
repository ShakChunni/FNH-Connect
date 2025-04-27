import { useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface InactiveDataProps {
  id: number;
  sourceTable: string;
  pic: string;
  inactiveReason: string;
}

export type InactiveCallback = (
  id: number,
  sourceTable: string,
  pic: string,
  inactiveReason: string
) => void;

const useInactiveData = (onClose: () => void, onInactive: InactiveCallback) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleInactive = useCallback(
    async ({ id, sourceTable, pic, inactiveReason }: InactiveDataProps) => {
      if (!id || !sourceTable || !inactiveReason) {
        throw new Error("Missing required fields");
      }

      const convertedData = {
        id,
        sourceTable,
        pic,
        username: user?.username || "",
        inactiveReason,
      };

      const response = await fetch("/api/archive/tableData", {
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

  return handleInactive;
};

export default useInactiveData;
