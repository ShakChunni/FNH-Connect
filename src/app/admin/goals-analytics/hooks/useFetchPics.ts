import { useState, useEffect } from "react";
import { useAuth } from "@/app/AuthContext";

interface User {
  id: number;
  username: string;
  role: string;
  manages: string[];
  organizations: string[];
  archived: boolean;
}

const useFetchPics = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        const response = await fetch("/api/fetch/pics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentUsername: user.username,
            currentRole: user.role,
            managesUsers: user.manages || [],
          }),
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(String(error));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  return { users, loading, error };
};

export default useFetchPics;
