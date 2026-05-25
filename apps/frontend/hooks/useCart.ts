import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { IAddCartItemDto, ICartItem } from "@e-com/shared";
import {
  fetchCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} from "@/api/service";

export const CART_QUERY_KEY = ["cart"] as const;

export function useCart() {
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: fetchCart,
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: (dto: IAddCartItemDto) => addCartItem(dto),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<ICartItem[]>(CART_QUERY_KEY);

      queryClient.setQueryData<ICartItem[]>(CART_QUERY_KEY, (old = []) => {
        const existing = old.find((i) => i.productId === newItem.productId);
        if (existing) {
          return old.map((i) =>
            i.productId === newItem.productId
              ? { ...i, quantity: i.quantity + newItem.quantity }
              : i,
          );
        }
        // Optimistic placeholder — real item replaces it on settle
        return [
          ...old,
          {
            id: `optimistic-${newItem.productId}`,
            userId: "",
            productId: newItem.productId,
            quantity: newItem.quantity,
            product: { id: newItem.productId } as ICartItem["product"],
          },
        ];
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<ICartItem[]>(CART_QUERY_KEY);

      queryClient.setQueryData<ICartItem[]>(CART_QUERY_KEY, (old = []) =>
        old.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<ICartItem[]>(CART_QUERY_KEY);

      queryClient.setQueryData<ICartItem[]>(CART_QUERY_KEY, (old = []) =>
        old.filter((i) => i.id !== itemId),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product?.price ?? 0) * item.quantity,
    0,
  );

  return {
    cartItems,
    isLoading,
    subtotal,
    addMutation,
    updateMutation,
    removeMutation,
  };
}
