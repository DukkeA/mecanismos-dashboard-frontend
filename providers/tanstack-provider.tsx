"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (isAuthStatus(error, [401, 403])) {
          return false;
        }

        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        if (isAuthStatus(error, [401, 403, 429])) {
          return false;
        }

        return failureCount < 1;
      },
    },
  },
});

function isAuthStatus(error: unknown, statuses: number[]) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number" &&
    statuses.includes(error.statusCode)
  );
}

export default function TanstackProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
