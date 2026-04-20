"use client";

import { useAuth } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function AuthLoader({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
      retryDelay: 2000,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthLoader>{children}</AuthLoader>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}