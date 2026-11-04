import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { libraries, paymentSettings, resources, sections } from "@/db/schema";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodePath(value: string) {
  return value.split("/").map(encodeURIComponent).join("/");
}

async function saveSetting(key: string, label: string, value: string) {
  const existing = await db.select().from(paymentSettings).where(eq(paymentSettings.key, key)).limit(1);
  if (existing.length) await db.update(paymentSettings).set({ label, value }).where(eq(paymentSettings.id, existing[0].id));
  else await db.insert(paymentSettings).values({ key, label, value });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: "التخزين السحابي غير مربوط." }, { status: 503 });

  try {
    const body = await request.json() as {
      target?: string; bucket?: string; objectPath?: string; fileName?: string; title?: string;
      description?: string; libraryId?: number; sectionId?: number; isFree?: boolean; published?: boolean; caption?: string;
    };
    const target = body.target;
    const bucket = String(body.bucket || "");
    const objectPath = String(body.objectPath || "");
    const fileName = String(body.fileName || "").slice(0, 200);
    if (!objectPath || objectPath.includes("..") || objectPath.startsWith("/")) return NextResponse.json({ error: "مسار الملف غير صالح." }, { status: 400 });

    if (target === "homepageVideo") {
      const expectedBucket = process.env.SUPABASE_PUBLIC_BUCKET || "sense-media";
      if (bucket !== expectedBucket || !objectPath.startsWith("admin/homepage-preview/")) return NextResponse.json({ error: "مسار فيديو المعاينة غير صالح." }, { status: 400 });
      const check = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(objectPath)}`, {
        method: "HEAD", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store",
      });
      if (!check.ok) return NextResponse.json({ error: "لم نعثر على الفيديو في التخزين بعد رفعه." }, { status: 400 });
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodePath(objectPath)}`;
      await saveSetting("homepage_preview_url", "فيديو المعاينة المجاني للرئيسية", publicUrl);
      await saveSetting("homepage_preview_caption", "وصف فيديو المعاينة", body.caption || "شاهد شرحًا مجانيًا عن مكتبات SENSE وطريقة الاستفادة منها.");
      await saveSetting("homepage_preview_enabled", "إظهار فيديو المعاينة في الصفحة الرئيسية", "true");
      revalidatePath("/");
      revalidatePath("/admin/settings");
      return NextResponse.json({ ok: true, url: publicUrl });
    }

    if (target !== "library") return NextResponse.json({ error: "نوع المحتوى غير صالح." }, { status: 400 });
    const libraryId = Number(body.libraryId);
    const sectionId = Number(body.sectionId);
    const title = String(body.title || fileName.replace(/\.[^.]+$/, "")).slice(0, 200).trim();
    const expectedBucket = process.env.SUPABASE_PRIVATE_BUCKET || "sense-private";
    if (bucket !== expectedBucket || !objectPath.startsWith(`admin/library-files/${libraryId}/`)) return NextResponse.json({ error: "مسار الملف لا يتبع المكتبة المختارة." }, { status: 400 });
    if (!Number.isInteger(libraryId) || !Number.isInteger(sectionId) || !title) return NextResponse.json({ error: "بيانات الملف غير مكتملة." }, { status: 400 });
    const [libraryRows, sectionRows] = await Promise.all([
      db.select({ id: libraries.id, slug: libraries.slug }).from(libraries).where(eq(libraries.id, libraryId)).limit(1),
      db.select({ id: sections.id }).from(sections).where(and(eq(sections.id, sectionId), eq(sections.libraryId, libraryId))).limit(1),
    ]);
    if (!libraryRows.length || !sectionRows.length) return NextResponse.json({ error: "المكتبة أو القسم غير موجود." }, { status: 404 });
    const check = await fetch(`${supabaseUrl}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodePath(objectPath)}`, {
      method: "HEAD", headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store",
    });
    if (!check.ok) return NextResponse.json({ error: "لم نعثر على الملف في التخزين بعد رفعه." }, { status: 400 });
    await db.insert(resources).values({
      libraryId, sectionId, title, kind: "file", description: String(body.description || "").slice(0, 2000),
      content: "", externalUrl: null, duration: "", isFree: Boolean(body.isFree),
      published: Boolean(body.published), sortOrder: 0, filePath: objectPath, fileName,
    });
    revalidatePath("/admin/content");
    revalidatePath(`/library/${libraryRows[0].slug}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ الملف في المكتبة." }, { status: 400 });
  }
}
