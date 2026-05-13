import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/cart", "/checkout", "/orders", "/account"];
const GUEST_ROUTES = ["/login", "/register"];

function getSafeRedirectPath(redirectTo: string | null) {
  if (
    !redirectTo ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//")
  ) {
    return "/products";
  }

  return redirectTo;
}

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
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestOnly && isAuthenticated) {
    const redirectTo = getSafeRedirectPath(
      request.nextUrl.searchParams.get("redirectTo"),
    );

    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/account/:path*",
    "/login",
    "/register",
  ],
};
