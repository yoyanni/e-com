import { Metadata } from "next";
import { CartContent } from "./CartContent";

export const metadata: Metadata = { title: "Cart — E-com" };

export default function CartPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your cart</h1>
      <CartContent />
    </div>
  );
}
