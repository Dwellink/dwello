import { toNodeHandler } from "better-auth/node";

import { initAuth } from "@kan/auth/server";
import {
  getLastBridgeFailure,
  getSessionFromBridgeHeaders,
} from "@kan/auth/dwellink-bridge";
import { createDrizzleClient } from "@kan/db/client";
import { withRateLimit } from "@kan/api/utils/rateLimit";

export const config = { api: { bodyParser: false } };

const db = createDrizzleClient();
export const auth = initAuth(db);

const authHandler = toNodeHandler(auth.handler);

// Convert the Node-style req.headers bag into a WHATWG Headers instance
// the bridge helper expects.
function nodeHeadersToWhatwg(nodeHeaders: Record<string, string | string[] | undefined>): Headers {
  const h = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) h.set(key, value.join(","));
    else h.set(key, value);
  }
  return h;
}

export default withRateLimit(
  { points: 100, duration: 60 },
  async (req, res) => {
    // Intercept Better Auth's /get-session so Kan's frontend (useSession)
    // sees the Dwellink-bridged session instead of Better Auth's (which
    // is always null — admins never set a Better Auth cookie).
    if (req.url?.includes("/get-session")) {
      const headers = nodeHeadersToWhatwg(req.headers);
      const bridgeSession = await getSessionFromBridgeHeaders(db, headers);
      res.setHeader("content-type", "application/json");
      if (!bridgeSession) {
        // Debug payload is admin-gated by Dwellink's middleware before
        // reaching this handler — safe to expose. Frontend useSession()
        // ignores any extra fields beyond null/{user,session}.
        const failure = getLastBridgeFailure();
        if (failure && req.query.debug === "1") {
          res.status(200).end(JSON.stringify({ session: null, _debug: failure }));
        } else {
          res.status(200).end("null");
        }
        return;
      }
      const now = new Date();
      const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      res.status(200).end(
        JSON.stringify({
          user: bridgeSession.user,
          session: {
            id: bridgeSession.user.id,
            userId: bridgeSession.user.id,
            token: "dwellink-bridge",
            expiresAt: expires.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            ipAddress: null,
            userAgent: null,
          },
        }),
      );
      return;
    }

    /**
     * Better-auth behind proxies (Nginx/Cloudflare) can sometimes fail to parse the protocol
     * if headers are incorrectly set or if there are multiple values in X-Forwarded-Proto.
     * We sanitize these headers here to ensure better-auth gets a clean protocol and host.
     */
    const forwardedProto = req.headers["x-forwarded-proto"];
    if (forwardedProto) {
      const p = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
      req.headers["x-forwarded-proto"] = p?.split(",")[0]?.trim();
    }

    const forwardedHost = req.headers["x-forwarded-host"];
    if (forwardedHost) {
      const h = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
      req.headers["host"] = h?.split(",")[0]?.trim();
    }

    return await authHandler(req, res);
  },
);
