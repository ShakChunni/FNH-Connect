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
            staleTime: 60 * 1000,
            refetchInterval: false,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: true,
            retry: (failureCount, error) => {
              if (error instanceof Error && error.message.includes("4")) {
                return false;
              }
              return failureCount < 3;
            },
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
