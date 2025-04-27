import { useState } from "react";
import { useAuth } from "@/app/AuthContext";

interface User {
  id: number;
  username: string;
  role: string;
  password?: string;
  manages?: string[];
  organizations?: string[];
}

const useUpdateUsers = () => {
  const { user: authUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (user: User) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...user, actor: authUser?.username }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const data = await response.json();
      console.log("User updated:", data);
    } catch (err) {
      setError("Error updating user");
      console.error("Error updating user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { updateUser, isLoading, error };
};

export default useUpdateUsers;
