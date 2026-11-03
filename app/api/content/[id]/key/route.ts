import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { entitlements, resources } from "@/db/schema";
import { getCurrentUser, signContentKey } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Issue a fresh short-lived key only to a signed-in user who may view this resource. */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const resourceId = Number(id);
  if (!Number.isInteger(resourceId) || resourceId <= 0) {
    return NextResponse.json({ error: "Invalid resource" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
  const resource = rows[0];
  if (!resource || !resource.published || !resource.filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!resource.isFree) {
    const owned = await db
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(and(eq(entitlements.userId, user.id), eq(entitlements.libraryId, resource.libraryId)))
      .limit(1);
    if (!owned.length) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    { key: signContentKey(resourceId, user.id) },
    { headers: { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" } }
  );
}
