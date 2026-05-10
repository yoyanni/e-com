import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <p className="text-lg font-bold tracking-tight">E-com</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your one-stop shop for everything you need.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Shop
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/products"
                  className="hover:text-foreground transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  prefetch={false}
                  className="hover:text-foreground transition-colors"
                >
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Account
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/login"
                  prefetch={false}
                  className="hover:text-foreground transition-colors"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  prefetch={false}
                  className="hover:text-foreground transition-colors"
                >
                  Order History
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} E-com. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
