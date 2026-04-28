import { useQuery } from "@tanstack/react-query";
import { fetchOrders, fetchOrder } from "@/api/service";

export const ORDERS_QUERY_KEY = ["orders"] as const;

export function useOrders() {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: fetchOrders,
    retry: false,
  });

  return { orders, isLoading, isError };
}

export function useOrder(id: string) {
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [...ORDERS_QUERY_KEY, id],
    queryFn: () => fetchOrder(id),
    enabled: !!id,
    retry: false,
  });

  return { order, isLoading, isError };
}
