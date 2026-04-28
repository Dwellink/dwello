import type { TRPCLink } from "@trpc/client";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { QueryClient } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { observable } from "@trpc/server/observable";
import superjson from "superjson";

import type { AppRouter } from "@kan/api/root";

/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */

const authLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          if (typeof window !== "undefined" && err.message === "UNAUTHORIZED") {
            window.location.href = "/login";
          }
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });
      return unsubscribe;
    });
  };
};

// Kan is mounted at basePath /dwello — every URL the tRPC client emits has to include
// that prefix or it lands on Dwellink's domain (404). Same fix shape as authClient.ts.
const getBaseUrl = () => {
  const basePath = "/dwello";
  if (typeof window !== "undefined") return basePath;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${basePath}`;
  return `http://localhost:${process.env.PORT ?? 3000}${basePath}`;
};

const queryClient = new QueryClient();

// @ts-expect-error
export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        authLink,
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
      queryClient: queryClient,
    };
  },
  ssr: false,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
