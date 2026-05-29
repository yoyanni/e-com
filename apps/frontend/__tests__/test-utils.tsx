import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export {
  mockUser,
  mockCategory,
  mockProduct,
  mockCartItem,
  mockOrderItem,
  mockOrder,
} from "./fixtures/mock-data";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Keep cached data alive for the lifetime of the test
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function createWrapper(client = createQueryClient()) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

export function renderWithQuery(
  ui: React.ReactElement,
  client = createQueryClient(),
) {
  return {
    ...render(ui, { wrapper: createWrapper(client) }),
    queryClient: client,
  };
}

