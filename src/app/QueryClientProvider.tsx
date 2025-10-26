"use client";
import { PropsWithChildren, useState } from "react";
import {
  QueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from "@tanstack/react-query";

const QueryClientProvider = ({ children }: PropsWithChildren) => {
  // FIXED: Create QueryClient with proper SSR configuration and prevent recreation
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            // FIXED: Increase refetch interval to reduce background requests
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
              return failureCount < 3;
            },
            // FIXED: Prevent automatic background refetching to reduce load
            gcTime: 5 * 60 * 1000, // 5 minutes
          },
          mutations: {
            retry: false, // Don't retry mutations by default
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
