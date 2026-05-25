import { renderHook, act, waitFor } from "@testing-library/react";
import { useCart } from "@/hooks/useCart";
import {
  createQueryClient,
  createWrapper,
  mockCartItem,
  mockProduct,
} from "../test-utils";
import type { QueryClient } from "@tanstack/react-query";
import type { ICartItem } from "@e-com/shared";

// Mocks
jest.mock("@/api/service", () => ({
  fetchCart: jest.fn(),
  addCartItem: jest.fn(),
  updateCartItem: jest.fn(),
  removeCartItem: jest.fn(),
}));

import * as service from "@/api/service";
const mockFetchCart = jest.mocked(service.fetchCart);
const mockAddCartItem = service.addCartItem as jest.Mock;
const mockUpdateCartItem = service.updateCartItem as jest.Mock;
const mockRemoveCartItem = service.removeCartItem as jest.Mock;

// Per-test setup
let queryClient: QueryClient;

function renderUseCart() {
  return renderHook(() => useCart(), { wrapper: createWrapper(queryClient) });
}

// Check this, maybe add default empty array for items
function seedCart(items: ICartItem[]) {
  queryClient.setQueryData(["cart"], items);
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = createQueryClient();
  // Default safe value — mutation tests use seedCart() instead
  mockFetchCart.mockResolvedValue([]);
});

// Tests
describe("useCart", () => {
  describe("cartItems and loading", () => {
    it("returns empty cart initially", async () => {
      const { result } = renderUseCart();

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.cartItems).toEqual([]);
    });

    it("returns cart items from fetchCart", async () => {
      const items = [mockCartItem()];
      mockFetchCart.mockResolvedValue(items);

      const { result } = renderUseCart();

      await waitFor(() => expect(result.current.cartItems).toHaveLength(1));
      expect(result.current.cartItems[0].id).toBe("item-1");
    });
  });

  describe("subtotal", () => {
    it("calculates subtotal from cart items", async () => {
      // price: 49.99, quantity: 2 => 99.98
      // price: 10.00, quantity: 3 => 30.00
      // total: 129.98
      const items: ICartItem[] = [
        mockCartItem({
          id: "item-1",
          quantity: 2,
          product: mockProduct(),
        }),
        mockCartItem({
          id: "item-2",
          productId: "prod-2",
          quantity: 3,
          product: mockProduct({ id: "prod-2", price: 10.0 }),
        }),
      ];
      mockFetchCart.mockResolvedValue(items);

      const { result } = renderUseCart();

      await waitFor(() => expect(result.current.cartItems).toHaveLength(2));

      expect(result.current.subtotal).toBeCloseTo(129.98);
    });

    it("returns 0 for an empty cart", async () => {
      mockFetchCart.mockResolvedValue([]);

      const { result } = renderUseCart();

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.subtotal).toBe(0);
    });
  });

  describe("addMutation", () => {
    it("calls addCartItem with the correct payload", async () => {
      mockAddCartItem.mockResolvedValue({});
      seedCart([]);

      const { result } = renderUseCart();

      await act(async () => {
        await result.current.addMutation.mutateAsync({
          productId: "prod-1",
          quantity: 1,
        });
      });

      expect(mockAddCartItem).toHaveBeenCalledWith({
        productId: "prod-1",
        quantity: 1,
      });
    });

    it("optimistically adds a new item to the cache before the request settles", async () => {
      // Never resolves — keeps the optimistic window open
      mockAddCartItem.mockReturnValue(new Promise(() => {}));
      seedCart([]);

      const { result } = renderUseCart();

      act(() => {
        result.current.addMutation.mutate({
          productId: "prod-new",
          quantity: 1,
        });
      });

      await waitFor(() =>
        expect(
          result.current.cartItems.some((i) => i.productId === "prod-new"),
        ).toBe(true),
      );
    });

    it("optimistically increments quantity for an existing product", async () => {
      const existing = mockCartItem({ quantity: 2 });
      mockAddCartItem.mockReturnValue(new Promise(() => {}));
      seedCart([existing]);

      const { result } = renderUseCart();

      act(() => {
        result.current.addMutation.mutate({
          productId: existing.productId,
          quantity: 3,
        });
      });

      await waitFor(() => {
        const item = result.current.cartItems.find(
          (i) => i.productId === existing.productId,
        );
        expect(item?.quantity).toBe(5);
      });
    });
  });

  describe("updateMutation", () => {
    it("calls updateCartItem with the correct itemId and quantity", async () => {
      const item = mockCartItem({ quantity: 2 });
      mockUpdateCartItem.mockResolvedValue({});
      seedCart([item]);

      const { result } = renderUseCart();

      await act(async () => {
        await result.current.updateMutation.mutateAsync({
          itemId: item.id,
          quantity: 5,
        });
      });

      expect(mockUpdateCartItem).toHaveBeenCalledWith(item.id, 5);
    });

    it("optimistically updates the quantity in the cache", async () => {
      const item = mockCartItem({ quantity: 2 });
      mockUpdateCartItem.mockReturnValue(new Promise(() => {}));
      seedCart([item]);

      const { result } = renderUseCart();

      act(() => {
        result.current.updateMutation.mutate({ itemId: item.id, quantity: 7 });
      });

      await waitFor(() => {
        const cached = result.current.cartItems.find((i) => i.id === item.id);
        expect(cached?.quantity).toBe(7);
      });
    });

    it("rolls back quantity on error", async () => {
      const item = mockCartItem({ quantity: 2 });
      mockUpdateCartItem.mockRejectedValue(new Error("server error"));
      mockFetchCart.mockResolvedValue([item]); // refetch returns the original item
      seedCart([item]);

      const { result } = renderUseCart();

      await act(async () => {
        await expect(
          result.current.updateMutation.mutateAsync({
            itemId: item.id,
            quantity: 7,
          }),
        ).rejects.toThrow();
      });

      const cached = result.current.cartItems.find((i) => i.id === item.id);
      expect(cached?.quantity).toBe(2);
    });
  });

  describe("removeMutation", () => {
    it("calls removeCartItem with the item id", async () => {
      const item = mockCartItem();
      mockRemoveCartItem.mockResolvedValue({});
      seedCart([item]);

      const { result } = renderUseCart();

      await act(async () => {
        await result.current.removeMutation.mutateAsync(item.id);
      });

      expect(mockRemoveCartItem).toHaveBeenCalledWith(item.id);
    });

    it("optimistically removes the item from the cache", async () => {
      const item = mockCartItem();
      mockRemoveCartItem.mockReturnValue(new Promise(() => {}));
      seedCart([item]);

      const { result } = renderUseCart();

      act(() => {
        result.current.removeMutation.mutate(item.id);
      });

      await waitFor(() =>
        expect(
          result.current.cartItems.find((i) => i.id === item.id),
        ).toBeUndefined(),
      );
    });

    it("rolls back the removed item on error", async () => {
      const item = mockCartItem();
      mockRemoveCartItem.mockRejectedValue(new Error("server error"));
      mockFetchCart.mockResolvedValue([item]); // refetch returns the original item
      seedCart([item]);

      const { result } = renderUseCart();

      await act(async () => {
        await expect(
          result.current.removeMutation.mutateAsync(item.id),
        ).rejects.toThrow();
      });

      const cached = result.current.cartItems.find((i) => i.id === item.id);
      expect(cached).toBeDefined();
      expect(cached?.id).toBe(item.id);
    });
  });
});
