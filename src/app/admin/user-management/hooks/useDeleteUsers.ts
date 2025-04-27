import { useState } from "react";
import { useAuth } from "@/app/AuthContext";

const useDeleteUsers = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteUser = async (id: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/users/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, actor: user?.username }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      const data = await response.json();
      console.log("User deleted:", data);
    } catch (err) {
      setError("Error deleting user");
      console.error("Error deleting user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteUser, isLoading, error };
};

export default useDeleteUsers;
