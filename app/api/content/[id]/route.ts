import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { entitlements, resources } from "@/db/schema";
import { getCurrentUser, verifyContentKey } from "@/lib/auth";
import { readPrivateFile, contentTypeFor } from "@/lib/storage";

/**
 * The only route that can read paid files out of private storage.
 * Requirements enforced here (not in the UI):
 *  1. a valid session cookie,
 *  2. a short-lived HMAC key bound to that user + this resource,
 *  3. a database entitlement row (or a resource flagged as free).
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const resourceId = Number(id);
  if (!Number.isFinite(resourceId)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const key = url.searchParams.get("k") ?? "";
  if (!verifyContentKey(key, resourceId, user.id)) {
    return new NextResponse("Link expired or invalid", { status: 403 });
  }

  const rows = await db.select().from(resources).where(eq(resources.id, resourceId)).limit(1);
  const resource = rows[0];
  if (!resource || !resource.published) return new NextResponse("Not found", { status: 404 });

  if (!resource.isFree) {
    const owned = await db
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(and(eq(entitlements.userId, user.id), eq(entitlements.libraryId, resource.libraryId)))
      .limit(1);
    if (!owned.length) return new NextResponse("Forbidden", { status: 403 });
  }

  if (!resource.filePath) return new NextResponse("No file", { status: 404 });

  try {
    const { data } = await readPrivateFile(resource.filePath);
    const headers: Record<string, string> = {
      "Content-Type": contentTypeFor(resource.filePath),
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self' 'unsafe-inline'; frame-ancestors 'self'",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Disposition": `inline; filename="${encodeURIComponent(resource.fileName || "document")}"`,
    };
    return new NextResponse(new Uint8Array(data), { headers });
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }
}
