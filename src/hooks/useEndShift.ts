import { useState } from "react";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useEndShift = () => {
  const [isEnding, setIsEnding] = useState(false);
  const queryClient = useQueryClient();

  const endShift = async (onSuccess?: () => void) => {
    setIsEnding(true);
    try {
      const response = await fetchWithCSRF("/api/shifts/end", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to end shift");
      }

      toast.success("Shift ended successfully");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cash-session"] });

      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Could not end shift. Please try again.");
    } finally {
      setIsEnding(false);
    }
  };

  return {
    endShift,
    isEnding,
  };
};
