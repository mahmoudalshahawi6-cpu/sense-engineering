import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readPrivateFile, contentTypeFor, isImage } from "@/lib/storage";

/** Payment proofs are customer data: only the owner or an admin can fetch them. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const orderId = Number(id);
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = rows[0];
  if (!order) return new NextResponse("Not found", { status: 404 });
  if (user.role !== "admin" && order.userId !== user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!order.proofPath) return new NextResponse("No proof", { status: 404 });

  try {
    const { data } = await readPrivateFile(order.proofPath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": isImage(order.proofPath) ? contentTypeFor(order.proofPath) : "application/pdf",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }
}
