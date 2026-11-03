import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const storageRoot = path.resolve(process.env.PRIVATE_STORAGE_DIR || path.join(process.cwd(), "storage"));
    const zipPath = path.join(storageRoot, "admin-downloads", "sense-project-source.zip");
    const fileStat = await stat(zipPath);
    const fileBuffer = await readFile(zipPath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="sense-project-source.zip"',
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "ملف المصدر الخاص غير جاهز. شغّل npm run build:source من جهاز الإدارة." },
      { status: 404 }
    );
  }
}
