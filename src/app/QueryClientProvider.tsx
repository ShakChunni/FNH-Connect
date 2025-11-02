"use client";
import { PropsWithChildren, useState } from "react";
import {
  QueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from "@tanstack/react-query";

const QueryClientProvider = ({ children }: PropsWithChildren) => {
  // FIXED: Create QueryClient with aggressive memory management to prevent leaks
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // FIXED: Reduced staleTime to prevent excessive caching
            staleTime: 30 * 1000, // 30 seconds (reduced from 1 minute)
            // FIXED: Disable automatic refetching to reduce memory pressure
            refetchInterval: false,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: true,
            // Retry configuration for better error handling
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && error.message.includes("4")) {
                return false;
              }
              return failureCount < 2; // Reduced from 3 to 2
            },
            // FIXED: Aggressive garbage collection - 2 minutes instead of 5
            gcTime: 2 * 60 * 1000, // 2 minutes - aggressively clean unused cache
          },
          mutations: {
            retry: false, // Don't retry mutations by default
            gcTime: 0, // Immediately clean up mutation cache
          },
        },
      })
  );

  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
    </ReactQueryClientProvider>
  );
};

export default QueryClientProvider;
