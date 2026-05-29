import type {
  AuthUser,
  ICartItem,
  ICategory,
  IOrder,
  IOrderItem,
  IProduct,
} from "@e-com/shared";

export function mockUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    email: "test@example.com",
    role: "customer",
    ...overrides,
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

export function mockOrderItem(overrides: Partial<IOrderItem> = {}): IOrderItem {
  return {
    id: "order-item-1",
    orderId: "order-1",
    productId: "prod-1",
    quantity: 2,
    unitPrice: 49.99,
    product: mockProduct(),
    ...overrides,
  };
}

export function mockOrder(overrides: Partial<IOrder> = {}): IOrder {
  return {
    id: "order-1",
    userId: "user-1",
    status: "pending",
    total: 99.98,
    items: [mockOrderItem()],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
