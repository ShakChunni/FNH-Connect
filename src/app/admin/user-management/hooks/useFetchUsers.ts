import { useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  role: string;
  manages: string[];
  organizations: string[];
  archived: boolean;
}

const useFetchUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users/fetch");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (error) {
      setError("Error fetching users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, error, loading, fetchUsers };
};

export default useFetchUsers;
