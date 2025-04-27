import { useState } from "react";
import { useAuth } from "@/app/AuthContext";

interface NewUser {
  username: string;
  role: string;
  password: string;
  manages?: string[];
  organizations?: string[];
}


const useAddUsers = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (newUser: NewUser) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...newUser, actor: user?.username }),
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      const data = await response.json();
      console.log("User created:", data);
    } catch (err) {
      setError("Error creating user");
      console.error("Error creating user:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return { createUser, isLoading, error };
};

export default useAddUsers;
