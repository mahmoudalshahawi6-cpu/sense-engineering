import { and, eq, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verify an email address using a one-time token delivered to that mailbox. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.slice(0, 160) ?? "";
  if (!token) {
    return NextResponse.redirect(new URL("/login?verify=invalid", request.url), { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  }

  const matches = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.verifyToken, token), gt(users.verifyTokenExpires, new Date())))
    .limit(1);

  if (!matches.length) {
    return NextResponse.redirect(new URL("/login?verify=invalid", request.url), { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  }

  await db.update(users).set({
    emailVerified: true,
    verifyToken: null,
    verifyTokenExpires: null,
  }).where(eq(users.id, matches[0].id));

  return NextResponse.redirect(new URL("/login?verified=1", request.url), { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
