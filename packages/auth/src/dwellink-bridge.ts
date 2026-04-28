import { createHash } from "crypto";
import { and, eq, isNull } from "drizzle-orm";

import type { dbClient } from "@kan/db/client";
import { users, workspaceMembers } from "@kan/db/schema";

const MAX_SKEW_MS = 60_000;

// Fixed namespace so Dwellink user cuids always derive the same Kan UUID.
// Kan's users.id column is uuid — derive via UUID-v5 style (SHA-1 of
// namespace||name, with version/variant bits set per RFC 4122).
const NAMESPACE_UUID = "f7a3e6c9-1d24-4a8b-9e52-0b3c7f1a2e61";

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return out;
}

export function dwellinkIdToKanUuid(dwellinkId: string): string {
  const nsBytes = hexToBytes(NAMESPACE_UUID.replace(/-/g, ""));
  const nameBytes = new TextEncoder().encode(dwellinkId);
  const buf = new Uint8Array(nsBytes.length + nameBytes.length);
  buf.set(nsBytes, 0);
  buf.set(nameBytes, nsBytes.length);

  const hash = createHash("sha1").update(buf).digest();
  const bytes = new Uint8Array(hash.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50; // UUID v5
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // RFC 4122 variant

  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256Hex(
  payload: string,
  secret: string,
): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface BridgeSessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  stripeCustomerId?: string | null;
}

export interface BridgeSession {
  user: BridgeSessionUser;
}

/**
 * Verifies the HMAC-signed identity headers Dwellink's middleware attaches
 * to every /dwello/* request, upserts a shadow user row keyed by Dwellink's
 * User.id (mapped to a deterministic UUID), and returns a Better-Auth-shaped
 * session so downstream Kan code needs no further changes.
 *
 * Returns null for any failure — missing headers, expired timestamp, bad
 * signature, or DB error — which Kan treats as "unauthenticated" and
 * rejects at the tRPC layer. That's the correct fail-closed behavior:
 * valid admins always carry valid headers because they came through
 * Dwellink's proxy.
 */
export type BridgeDebug = {
  reason:
    | "missing-header"
    | "missing-secret"
    | "bad-timestamp"
    | "expired"
    | "hmac-mismatch"
    | "upsert-failed";
  details?: Record<string, unknown>;
};

let lastFailure: BridgeDebug | null = null;
export function getLastBridgeFailure(): BridgeDebug | null {
  return lastFailure;
}

export async function getSessionFromBridgeHeaders(
  db: dbClient,
  headers: Headers,
): Promise<BridgeSession | null> {
  const dwellinkUserId = headers.get("x-dwellink-user-id");
  const email = headers.get("x-dwellink-user-email");
  const name = headers.get("x-dwellink-user-name") ?? "";
  const ts = headers.get("x-dwellink-ts");
  const sig = headers.get("x-dwellink-sig");
  const secret = process.env.DWELLO_BRIDGE_SECRET;

  if (!dwellinkUserId || !email || !ts || !sig) {
    lastFailure = {
      reason: "missing-header",
      details: {
        hasUserId: !!dwellinkUserId,
        hasEmail: !!email,
        hasTs: !!ts,
        hasSig: !!sig,
      },
    };
    return null;
  }
  if (!secret) {
    lastFailure = { reason: "missing-secret" };
    return null;
  }

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) {
    lastFailure = { reason: "bad-timestamp", details: { ts } };
    return null;
  }
  const skewMs = Date.now() - tsNum;
  if (Math.abs(skewMs) > MAX_SKEW_MS) {
    lastFailure = { reason: "expired", details: { skewMs } };
    return null;
  }

  const expected = await hmacSha256Hex(
    `${dwellinkUserId}|${email}|${ts}`,
    secret,
  );
  if (!timingSafeEqualHex(expected, sig)) {
    lastFailure = {
      reason: "hmac-mismatch",
      details: {
        // Reveals only the first 8 chars of each so we can confirm the
        // signing inputs match without leaking the full secret-derived sigs.
        expectedPrefix: expected.slice(0, 8),
        receivedPrefix: sig.slice(0, 8),
        secretLength: secret.length,
      },
    };
    return null;
  }

  const kanUserId = dwellinkIdToKanUuid(dwellinkUserId);
  const now = new Date();

  try {
    const [row] = await db
      .insert(users)
      .values({
        id: kanUserId,
        email,
        name: name || null,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          name: name || null,
          updatedAt: now,
        },
      })
      .returning();

    if (!row) {
      lastFailure = { reason: "upsert-failed", details: { kanUserId } };
      return null;
    }

    // Reconcile pending invites — bridged users never trigger Better Auth's magic-link accept-flow, so link userId here. Best-effort.
    try {
      await db
        .update(workspaceMembers)
        .set({ status: "active", userId: row.id })
        .where(
          and(
            eq(workspaceMembers.email, email),
            eq(workspaceMembers.status, "invited"),
            isNull(workspaceMembers.deletedAt),
          ),
        );
    } catch (err) {
      console.error("dwellink bridge: invite reconciliation failed", err);
    }

    lastFailure = null;

    return {
      user: {
        id: row.id,
        email: row.email,
        name: row.name ?? "",
        emailVerified: row.emailVerified,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        image: row.image ?? null,
        stripeCustomerId: row.stripeCustomerId ?? null,
      },
    };
  } catch (err) {
    lastFailure = {
      reason: "upsert-failed",
      details: { error: (err as Error).message },
    };
    return null;
  }
}
