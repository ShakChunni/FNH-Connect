import { useState } from "react";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const useEndShift = () => {
  const [isEnding, setIsEnding] = useState(false);
  const queryClient = useQueryClient();

  const endShift = async (
    onSuccess?: () => void,
    allowProceedOnError = true
  ) => {
    setIsEnding(true);
    try {
      const response = await fetchWithCSRF("/api/shifts/end", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to end shift");
      }

      toast.success("Shift ended - logging out from all devices");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cash-session"] });

      onSuccess?.();
    } catch (error) {
      console.error("[useEndShift] Error ending shift:", error);
      toast.error("Could not end shift. Please try again.");

      // If allowProceedOnError is true (default), still call onSuccess
      // This is important for logout flow - we don't want to block logout
      // just because shift-end failed
      if (allowProceedOnError) {
        onSuccess?.();
      }
    } finally {
      setIsEnding(false);
    }
  };

  return {
    endShift,
    isEnding,
  };
};
