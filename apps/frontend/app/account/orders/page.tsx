"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useOrders";
import { OrderStatus } from "@e-com/shared";

const statusVariant: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [OrderStatus.PENDING]: "secondary",
  [OrderStatus.PAID]: "default",
  [OrderStatus.SHIPPED]: "default",
  [OrderStatus.DELIVERED]: "outline",
  [OrderStatus.CANCELLED]: "destructive",
};

const formatted = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function OrdersPage() {
  const { orders, isLoading, isError } = useOrders();

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-8">My Orders</h1>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-8">My Orders</h1>
        <p className="text-destructive">
          Failed to load orders. Please try again.
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">
          You haven&apos;t placed any orders yet.
        </p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">My Orders</h1>
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-lg border px-5 py-4"
          >
            <div className="flex flex-col gap-1">
              <span className="font-mono text-sm text-muted-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <Badge variant={statusVariant[order.status]} className="capitalize">
              {order.status}
            </Badge>
            <span className="font-semibold tabular-nums">
              {formatted.format(Number(order.total))}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href={`/account/orders/${order.id}`}>View</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
