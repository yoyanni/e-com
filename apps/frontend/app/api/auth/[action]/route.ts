import { AUTH_CONSTANTS } from "@e-com/shared";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

/**
 * valid actions: "login", "register", "refresh", "logout"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  if (!["login", "register", "refresh", "logout"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const backendEndpoint = `${BACKEND_URL}/auth/${action}`;

    const forwardRequest: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body:
        action !== "refresh" && action !== "logout"
          ? JSON.stringify(await request.json())
          : undefined,
    };

    // For refresh and logout, include the refresh token cookie
    if (action === "refresh" || action === "logout") {
      const refreshToken = request.cookies.get("refreshToken")?.value;
      if (!refreshToken) {
        return NextResponse.json(
          { error: "No refresh token found" },
          { status: 401 },
        );
      }
      forwardRequest.body = JSON.stringify({ refreshToken });
    }

    // Call NestJS backend
    const backendResponse = await fetch(backendEndpoint, forwardRequest);
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    // Create logout response without tokens
    if (action === "logout") {
      const response = new NextResponse(null, {
        status: backendResponse.status,
      });
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }

    const data = await backendResponse.json();
    const { accessToken, refreshToken } = data;

    // Create response (no tokens in the body sent back to client)
    const response = NextResponse.json(
      {
        message:
          action === "refresh" ? "Token refreshed" : `${action} successful`,
      },
      { status: backendResponse.status },
    );

    // Set httpOnly cookies
    if (accessToken) {
      response.cookies.set("accessToken", accessToken, {
        ...TOKEN_COOKIE_OPTIONS,
        maxAge: AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS,
      });
    }

    if (refreshToken) {
      response.cookies.set("refreshToken", refreshToken, {
        ...TOKEN_COOKIE_OPTIONS,
        maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS,
      });
    }

    return response;
  } catch (error) {
    console.error(`[BFF /api/auth/${action}]`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
