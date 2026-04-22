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
// /dwello/api/auth/* (Kan's own handler). Better Auth's client validates
// baseURL with new URL(), which requires an absolute URL — so this has
// to be read from the build-time env and include the /dwello path.
// Set NEXT_PUBLIC_BASE_URL=https://dwellink.co/dwello (prod) or
// http://localhost:3000/dwello (dev) in Vercel / .env.
const baseURL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000/dwello";

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
