import { useCallback } from "react";
import { useAuth } from "../../AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface DeleteDataProps {
  id: number;
  sourceTable: string;
  pic: string;
  deleteReason: string; // Add this field
}

const useDeleteData = (
  onClose: () => void,
  onDelete: (
    id: number,
    sourceTable: string,
    pic: string,
    deleteReason: string
  ) => void
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleDelete = useCallback(
    async (data: DeleteDataProps) => {
      if (!data.id || !data.sourceTable || !data.deleteReason) {
        return;
      }

      const convertedData = {
        id: data.id,
        sourceTable: data.sourceTable,
        pic: data.pic,
        username: user?.username,
        deleteReason: data.deleteReason, // Add this field
      };

      try {
        const response = await fetch("/api/delete/tableData", {
          method: "DELETE",
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

        onDelete(data.id, data.sourceTable, data.pic, data.deleteReason);
        onClose();
      } catch (error) {
        console.error("Error deleting data:", error);
        throw error; // Re-throw to handle in component
      }
    },
    [onClose, onDelete, user?.username, queryClient]
  );

  return handleDelete;
};

export default useDeleteData;
