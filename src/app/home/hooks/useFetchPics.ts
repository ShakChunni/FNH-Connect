import { useAuth } from "@/app/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  fullName?: string; // Add fullName to the interface
  role: string;
  roleType?: string;
  manages: string[];
  organizations: string[];
  archived: boolean;
}

const useFetchPics = () => {
  const { user } = useAuth();

  // Use React Query for automatic caching
  const {
    data: users = [],
    isLoading: loading,
    error,
  } = useQuery<User[]>({
    queryKey: ["pics", user?.username],
    queryFn: async () => {
      if (!user) return [];

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
        throw new Error(`Failed to fetch PICs: ${response.status}`);
      }

      const userData: User[] = await response.json();

      // Ensure fullName is properly handled
      return userData.map((user) => ({
        ...user,
        fullName: user.fullName || user.username, // Fallback to username if no fullName
      }));
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 15 * 60 * 1000, // Keep in garbage collection for 15 minutes
    enabled: !!user, // Only run query if user exists
  });

  return {
    users,
    loading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
  };
};

export default useFetchPics;
