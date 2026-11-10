"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { SearchForm, SearchFormFallback } from "./SearchForm";

// Shown until /api/auth/me answers, so a logged-in user never sees
// Login/Register first. Sized like Account/Logout (73px and 64px); Login and
// Register come to 8px less in total.
function AuthActionsPlaceholder() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <div className="h-7 w-[4.5rem] animate-pulse rounded-lg bg-muted" />
      <div className="h-7 w-16 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

interface NavbarContentProps {
  // The hero nav on the home page leaves the search box out.
  showSearch?: boolean;
}

export function NavbarContent({ showSearch = true }: NavbarContentProps) {
  const { isLoading, isAuthenticated, logoutMutation } = useAuth();
  const { cartItems } = useCart();
  const itemCount = isAuthenticated
    ? cartItems.reduce((n, i) => n + i.quantity, 0)
    : 0;

  return (
    <>
      {showSearch && (
        <Suspense fallback={<SearchFormFallback />}>
          <SearchForm />
        </Suspense>
      )}

      <nav className="ml-auto flex items-center gap-2">
        <ThemeToggle />
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

        {isLoading ? (
          <AuthActionsPlaceholder />
        ) : isAuthenticated ? (
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
