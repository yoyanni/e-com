"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

export function CartContent() {
  const { cartItems, isLoading, subtotal, updateMutation, removeMutation } =
    useCart();

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading cart…</p>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-lg text-muted-foreground">Your cart is empty.</p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Line items */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            data-testid="cart-item"
            className="flex items-center gap-4 rounded-lg border p-4"
          >
            {/* Product image */}
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.product?.imageUrl ? (
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>

            {/* Name + price */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.product?.slug}`}
                className="font-medium hover:underline line-clamp-2"
              >
                {item.product?.name ?? "Product"}
              </Link>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatted.format(Number(item.product?.price ?? 0))} each
              </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                aria-label="Decrease quantity"
                disabled={item.quantity <= 1 || updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    itemId: item.id,
                    quantity: item.quantity - 1,
                  })
                }
              >
                <Minus className="size-3" />
              </Button>
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                aria-label="Increase quantity"
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    itemId: item.id,
                    quantity: item.quantity + 1,
                  })
                }
              >
                <Plus className="size-3" />
              </Button>
            </div>

            {/* Line total */}
            <p className="w-20 text-right font-medium tabular-nums">
              {formatted.format(
                Number(item.product?.price ?? 0) * item.quantity,
              )}
            </p>

            {/* Remove */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              aria-label="Remove item"
              disabled={removeMutation.isPending}
              onClick={() => removeMutation.mutate(item.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Order summary sidebar */}
      <div className="rounded-lg border p-6 flex flex-col gap-4 h-fit">
        <h2 className="text-lg font-semibold">Order summary</h2>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({cartItems.reduce((n, i) => n + i.quantity, 0)} items)
          </span>
          <span className="font-medium tabular-nums">
            {formatted.format(subtotal)}
          </span>
        </div>

        <hr />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatted.format(subtotal)}</span>
        </div>

        <Button asChild className="w-full" size="lg">
          <Link href="/checkout" prefetch={false}>
            Proceed to checkout
          </Link>
        </Button>
      </div>
    </div>
  );
}
