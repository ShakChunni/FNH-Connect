import { useState } from "react";
import { useAuth } from "@/app/AuthContext";

const useArchiveUsers = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const archiveUser = async (id: number, archived: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/admin/users/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, archived, actor: user?.username }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user archive status");
      }

      const data = await response.json();
      console.log("User archive status updated:", data);
    } catch (err) {
      setError("Error updating user archive status");
      console.error("Error updating user archive status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { archiveUser, isLoading, error };
};

export default useArchiveUsers;
