"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";

export default function CheckoutPage() {
  const { cartItems, isLoading, subtotal } = useCart();
  const { checkoutMutation } = useCheckout();

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
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
    <div className="container mx-auto max-w-lg py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="rounded-lg border p-6 flex flex-col gap-4">
        <h2 className="font-semibold">Order summary</h2>

        <ul className="flex flex-col gap-2 text-sm">
          {cartItems.map((item) => (
            <li key={item.id} data-testid="checkout-item" className="flex justify-between">
              <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                {item.product?.name ?? "Product"} × {item.quantity}
              </span>
              <span className="tabular-nums shrink-0">
                {formatted.format(
                  Number(item.product?.price ?? 0) * item.quantity,
                )}
              </span>
            </li>
          ))}
        </ul>

        <hr />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatted.format(subtotal)}</span>
        </div>

        {checkoutMutation.isError && (
          <p role="alert" data-testid="checkout-error" className="text-sm text-destructive">
            {(checkoutMutation.error as Error)?.message ??
              "Something went wrong. Please try again."}
          </p>
        )}

        <Button
          size="lg"
          className="w-full"
          disabled={checkoutMutation.isPending}
          onClick={() => checkoutMutation.mutate()}
        >
          {checkoutMutation.isPending ? "Placing order…" : "Place order"}
        </Button>

        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link href="/cart" prefetch={false}>
            ← Back to cart
          </Link>
        </Button>
      </div>
    </div>
  );
}
