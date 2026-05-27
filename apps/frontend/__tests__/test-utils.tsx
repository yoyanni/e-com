import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ICartItem, IProduct, ICategory, AuthUser } from "@e-com/shared";

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

export function mockCategory(overrides: Partial<ICategory> = {}): ICategory {
  return {
    id: "cat-1",
    name: "Category",
    slug: "category",
    ...overrides,
  };
}

export function mockProduct(overrides: Partial<IProduct> = {}): IProduct {
  return {
    id: "prod-1",
    name: "Test Product",
    slug: "test-product",
    description: null,
    price: 49.99,
    stock: 10,
    imageUrl: null,
    category: mockCategory(),
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function mockCartItem(overrides: Partial<ICartItem> = {}): ICartItem {
  return {
    id: "item-1",
    userId: "user-1",
    productId: "prod-1",
    quantity: 2,
    product: mockProduct(),
    ...overrides,
  };
}

export function mockUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    email: "test@example.com",
    role: "customer",
    ...overrides,
  };
}
