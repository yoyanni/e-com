"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/useOrders";
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading, isError } = useOrder(id);

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <div className="h-6 w-32 rounded bg-muted animate-pulse mb-8" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link href="/account/orders">
            <ArrowLeft className="size-4 mr-1" />
            Back to orders
          </Link>
        </Button>
        <p className="text-destructive">Order not found or failed to load.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-12 px-4">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/account/orders">
          <ArrowLeft className="size-4 mr-1" />
          Back to orders
        </Link>
      </Button>

      {/* Order header */}
      <div className="rounded-lg border p-6 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Order ID</p>
          <p className="font-mono text-sm">{order.id}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Placed</p>
          <p className="text-sm">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <Badge variant={statusVariant[order.status]} className="capitalize">
            {order.status}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="font-semibold tabular-nums">
            {formatted.format(Number(order.total))}
          </p>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-center px-4 py-3 font-medium">Qty</th>
              <th className="text-right px-4 py-3 font-medium">Unit price</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">
                  {item.product?.slug ? (
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="hover:underline"
                    >
                      {item.product.name}
                    </Link>
                  ) : (
                    <span>{item.product?.name ?? "Product"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center tabular-nums">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatted.format(Number(item.unitPrice))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {formatted.format(Number(item.unitPrice) * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-muted/30">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                Order total
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">
                {formatted.format(Number(order.total))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
