import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkoutCart } from "@/api/service";
import { CART_QUERY_KEY } from "./useCart";

export const ORDERS_QUERY_KEY = ["orders"] as const;

export function useCheckout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const checkoutMutation = useMutation({
    mutationFn: checkoutCart,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      router.push(`/checkout/success?orderId=${order.id}`);
    },
  });

  return { checkoutMutation };
}
