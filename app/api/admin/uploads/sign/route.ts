import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedPrivate = new Set(["pdf", "png", "jpg", "jpeg", "webp", "mp4", "webm", "txt", "md"]);
const allowedHomepage = new Set(["mp4", "webm"]);
const maxBytes = 50 * 1024 * 1024;

function safeName(value: string) {
  return value.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/-+/g, "-").slice(-90) || "upload";
}

function encodePath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "التخزين السحابي غير مربوط. اضبط Supabase Storage أولًا." }, { status: 503 });
  }

  try {
    const body = await request.json() as {
      target?: string; fileName?: string; contentType?: string; size?: number;
      libraryId?: number; sectionId?: number;
    };
    const target = body.target;
    const fileName = String(body.fileName || "").slice(0, 200);
    const size = Number(body.size || 0);
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    if (!fileName || !Number.isFinite(size) || size <= 0 || size > maxBytes) {
      return NextResponse.json({ error: "اختر ملفًا صالحًا لا يتجاوز 50 ميجابايت." }, { status: 400 });
    }

    let bucket: string;
    let objectPath: string;
    if (target === "homepageVideo") {
      if (!allowedHomepage.has(extension)) return NextResponse.json({ error: "فيديو الصفحة الرئيسية يجب أن يكون MP4 أو WEBM." }, { status: 400 });
      bucket = process.env.SUPABASE_PUBLIC_BUCKET || "sense-media";
      objectPath = `admin/homepage-preview/${randomUUID()}-${safeName(fileName)}`;
    } else if (target === "library") {
      const libraryId = Number(body.libraryId);
      const sectionId = Number(body.sectionId);
      if (!Number.isInteger(libraryId) || libraryId <= 0 || !Number.isInteger(sectionId) || sectionId <= 0) {
        return NextResponse.json({ error: "اختر المكتبة والقسم أولًا." }, { status: 400 });
      }
      if (!allowedPrivate.has(extension)) return NextResponse.json({ error: "الصيغة غير مدعومة. استخدم PDF أو صورة أو MP4/WEBM أو TXT/MD." }, { status: 400 });
      bucket = process.env.SUPABASE_PRIVATE_BUCKET || "sense-private";
      objectPath = `admin/library-files/${libraryId}/${randomUUID()}-${safeName(fileName)}`;
    } else {
      return NextResponse.json({ error: "نوع رفع غير معروف." }, { status: 400 });
    }

    const endpoint = `${supabaseUrl}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodePath(objectPath)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return NextResponse.json({ error: `لم يتم إنشاء رابط الرفع. تأكد من وجود الحاوية ${bucket}. ${detail.slice(0, 180)}` }, { status: 502 });
    }
    const data = await response.json() as { url?: string; token?: string };
    if (!data.url || !data.token) return NextResponse.json({ error: "استجابة التخزين غير مكتملة." }, { status: 502 });
    const signedUrl = data.url.startsWith("http") ? data.url : `${supabaseUrl}/storage/v1${data.url}`;
    return NextResponse.json({ bucket, objectPath, token: data.token, signedUrl, target }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء تجهيز الرفع. حاول مرة أخرى." }, { status: 400 });
  }
}
