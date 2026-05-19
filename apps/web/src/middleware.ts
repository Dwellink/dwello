import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "next-runtime-env";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    // Bridge requests arrive with HMAC-signed identity headers from Dwellink's
    // proxy and authenticate via /api/auth/get-session — they must skip the
    // self-hosted login redirect even when NEXT_PUBLIC_KAN_ENV is unset.
    // Header presence alone is sufficient here: spoofed headers without a
    // valid signature resolve to a null session downstream (see
    // packages/auth/src/dwellink-bridge.ts), so bypassing this redirect leaks
    // only an empty app shell, not data.
    const hasBridgeHeaders = request.headers.has("x-dwellink-sig");

    if (!hasBridgeHeaders && env("NEXT_PUBLIC_KAN_ENV") !== "cloud") {
      // Clone preserves basePath (/dwello), unlike new URL("/login", request.url)
      // which resolves against the origin and strips basePath, causing the
      // browser to land on dwellink.co/login (404).
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
