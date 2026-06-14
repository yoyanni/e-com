"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmitEvent, useRef } from "react";
import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

export function NavbarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, logoutMutation } = useAuth();
  const { cartItems } = useCart();
  const itemCount = isAuthenticated
    ? cartItems.reduce((n, i) => n + i.quantity, 0)
    : 0;

  function handleSearch(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = inputRef.current?.value.trim() ?? "";
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    params.delete("page"); // reset pagination on new search
    router.push(`/products?${params.toString()}`);
  }

  return (
    <>
      <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search products…"
          defaultValue={searchParams.get("search") ?? ""}
          className="h-8 max-w-sm"
          aria-label="Search products"
        />
      </form>

      <nav className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild aria-label="Cart">
          <Link href="/cart" prefetch={false} className="relative">
            <ShoppingCart className="size-5" />
            {itemCount > 0 && (
              <Badge
                variant="default"
                className="absolute -right-1.5 -top-1.5 h-4 min-w-4 rounded-full px-1 text-[10px] leading-none"
                aria-label={`${itemCount} items in cart`}
              >
                {itemCount > 99 ? "99+" : itemCount}
              </Badge>
            )}
          </Link>
        </Button>

        {isAuthenticated ? (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account/orders" prefetch={false}>
                Account
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login" prefetch={false}>
                Login
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register" prefetch={false}>
                Register
              </Link>
            </Button>
          </>
        )}
      </nav>
    </>
  );
}
