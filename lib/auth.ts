import { cookies, headers } from "next/headers";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "sense_session";

/**
 * Signing secret for sessions and short-lived content links.
 * Priority: AUTH_SECRET env var → generated secret persisted in storage/.auth-secret.
 * There is deliberately NO hard-coded fallback: a deployment without a secret must
 * not share keys with any other deployment.
 */
function resolveSecret() {
  const fromEnv = process.env.AUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be configured in production. Generate one with: openssl rand -hex 48");
  }

  const dir = path.join(process.cwd(), "storage");
  const file = path.join(dir, ".auth-secret");
  try {
    if (existsSync(file)) return readFileSync(file, "utf8").trim();
    const generated = randomBytes(48).toString("hex");
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, generated, { mode: 0o600 });
    // eslint-disable-next-line no-console
    console.warn(
      "[security] AUTH_SECRET is not set — generated a local secret at storage/.auth-secret. Set AUTH_SECRET explicitly in production."
    );
    return generated;
  } catch {
    return randomBytes(48).toString("hex");
  }
}

const SECRET = resolveSecret();

export function hmac(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function signPayload(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

export function verifyPayload<T = Record<string, unknown>>(token: string): T | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = hmac(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  sessionsLimit: number;
  createdAt: Date;
};

export async function createSession(userId: number, userAgent?: string | null, ip?: string | null) {
  const token = randomBytes(32).toString("hex");
  const limitRow = await db
    .select({ limit: users.sessionsLimit })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const limit = limitRow[0]?.limit ?? 3;

  const existing = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.revoked, false)))
    .orderBy(desc(sessions.lastSeenAt));
  if (existing.length >= limit) {
    const toRevoke = existing.slice(Math.max(0, limit - 1)).map((s) => s.id);
    if (toRevoke.length) {
      await db.delete(sessions).where(inArray(sessions.id, toRevoke));
    }
  }

  await db.insert(sessions).values({
    userId,
    tokenHash: hmac(token),
    userAgent: userAgent?.slice(0, 250) ?? null,
    ip: ip ?? null,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.update(sessions).set({ revoked: true }).where(eq(sessions.tokenHash, hmac(raw)));
  }
  store.delete(SESSION_COOKIE);
}

/** Revoke every session of a user (optionally keeping the current one). */
export async function revokeAllSessions(userId: number, keepCurrent = false) {
  const store = await cookies();
  const current = keepCurrent ? store.get(SESSION_COOKIE)?.value : null;
  const conditions = [eq(sessions.userId, userId), eq(sessions.revoked, false)];
  if (current) conditions.push(ne(sessions.tokenHash, hmac(current)));
  await db.update(sessions).set({ revoked: true }).where(and(...conditions));
}

/** Very small in-memory throttle for authentication endpoints. */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function isThrottled(key: string, max = 8, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

export async function getSessionToken() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const raw = await getSessionToken();
  if (!raw) return null;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      emailVerified: users.emailVerified,
      sessionsLimit: users.sessionsLimit,
      createdAt: users.createdAt,
      revoked: sessions.revoked,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, hmac(raw)))
    .limit(1);
  const row = rows[0];
  if (!row || row.revoked) return null;
  if (row.status !== "active") return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    emailVerified: row.emailVerified,
    sessionsLimit: row.sessionsLimit,
    createdAt: row.createdAt,
  };
}

export async function getIpAddress() {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

/** Short-lived signed key used for protected content streaming. */
export function signContentKey(resourceId: number, userId: number, ttlSeconds = 600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return signPayload({ rid: resourceId, uid: userId, exp });
}

export function verifyContentKey(
  key: string,
  resourceId: number,
  userId: number
): boolean {
  const payload = verifyPayload<{ rid: number; uid: number; exp: number }>(key);
  if (!payload) return false;
  if (payload.rid !== resourceId || payload.uid !== userId) return false;
  return payload.exp * 1000 > Date.now();
}

export function sortByOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export const ascOrder = asc;
