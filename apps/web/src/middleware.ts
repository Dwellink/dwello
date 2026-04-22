import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "next-runtime-env";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    if (env("NEXT_PUBLIC_KAN_ENV") !== "cloud") {
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
