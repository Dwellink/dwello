import type { BetterAuthClientPlugin } from "better-auth";
import type { BetterFetchOption } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import {
  apiKeyClient,
  genericOAuthClient,
  magicLinkClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { socialProvidersPlugin } from "./providers";

const socialProvidersPluginClient = {
  id: "social-providers-plugin",
  $InferServerPlugin: {} as ReturnType<typeof socialProvidersPlugin>,
  getActions: ($fetch) => {
    return {
      getSocialProviders: async (fetchOptions?: BetterFetchOption) => {
        const res = $fetch("/social-providers", {
          method: "GET",
          ...fetchOptions,
        });
        return res.then((res) => res.data as string[]);
      },
    };
  },
} satisfies BetterAuthClientPlugin;

// Kan is mounted at /dwello behind Dwellink's proxy. Fetches from the
// browser are origin-absolute, so without this prefix authClient would
// call /api/auth/* (Dwellink's own NextAuth handler) instead of
// /dwello/api/auth/* (Kan's own handler).
//
// In the browser, derive baseURL from the current origin so the request
// stays same-host as the page — critical because Dwellink's session
// cookie is host-only (no Domain= attribute), so a fetch to a different
// host (e.g. dwellink.co vs. www.dwellink.co) drops the cookie and the
// middleware bounces the request to /auth/signin.
//
// On the server (SSR / build), fall back to the env var. Better Auth
// validates baseURL with new URL() so we always need an absolute URL.
//
// globalThis cast avoids needing DOM in @kan/auth's tsconfig lib.
const browserOrigin = (
  globalThis as { location?: { origin: string } }
).location?.origin;
const baseURL = browserOrigin
  ? `${browserOrigin}/dwello`
  : process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000/dwello";

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    stripeClient({
      subscription: true,
    }),
    magicLinkClient(),
    apiKeyClient(),
    genericOAuthClient(),
    socialProvidersPluginClient,
  ],
});
