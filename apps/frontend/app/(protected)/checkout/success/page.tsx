import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Order confirmed — E-com" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <div className="container mx-auto max-w-md py-20 flex flex-col items-center gap-6 text-center">
      <div className="rounded-full bg-green-100 p-4">
        <svg
          className="size-10 text-green-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold">Order confirmed!</h1>
      <p className="text-muted-foreground">
        Thank you for your purchase. Your order has been placed successfully.
      </p>

      {orderId && (
        <p className="text-sm text-muted-foreground">
          Order ID:{" "}
          <span className="font-mono font-medium text-foreground">
            {orderId}
          </span>
        </p>
      )}

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/account/orders" prefetch={false}>View orders</Link>
        </Button>
        <Button asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
