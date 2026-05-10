import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/cart", "/checkout", "/orders", "/account"];
const GUEST_ROUTES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has("accessToken");
  const canRefresh = request.cookies.has("refreshToken");

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isGuestOnly = GUEST_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !isAuthenticated && !canRefresh) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestOnly && isAuthenticated) {
    const nextUrl = request.nextUrl.searchParams.get("next");
    return NextResponse.redirect(new URL(nextUrl ?? "/products", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
