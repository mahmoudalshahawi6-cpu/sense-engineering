import { NextResponse } from "next/server";
import { readPublicFile, contentTypeFor } from "@/lib/storage";

/**
 * Serves rotating media assets (library covers) from private storage.
 * Files are never addressable from /public, so they can be rotated or
 * removed without touching the build output.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ dir: string; file: string }> }
) {
  try {
    const { dir, file } = await ctx.params;
    const rel = `${dir}/${file}`;
    const data = await readPublicFile(rel);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeFor(rel),
        "Cache-Control": "public, max-age=3600",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
