import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, Plus, Pencil, Trash2, FolderTree, FileText, Save } from "lucide-react";
import { db } from "@/db";
import { libraries, resources, sections } from "@/db/schema";
import { withPrices } from "@/lib/data";
import {
  adminDeleteResourceAction,
  adminDeleteSectionAction,
  adminSaveResourceAction,
  adminSaveSectionAction,
  adminSaveLibraryAction,
} from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "تعديل المكتبة | لوحة التحكم" };

const kindLabel: Record<string, string> = {
  document: "مستند / درس",
  video: "فيديو",
  link: "رابط خارجي",
  file: "ملف محمي",
};

export default async function AdminLibraryEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editSection?: string; editResource?: string; saved?: string; deleted?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";

  const libRows = isNew ? [] : await db.select().from(libraries).where(eq(libraries.id, Number(id))).limit(1);
  const lib = libRows[0] ? withPrices(libRows[0]) : null;
  if (!isNew && !lib) notFound();

  const secs = isNew
    ? []
    : await db
        .select()
        .from(sections)
        .where(eq(sections.libraryId, Number(id)))
        .orderBy(sections.sortOrder, sections.id);
  const res = isNew
    ? []
    : await db
        .select()
        .from(resources)
        .where(eq(resources.libraryId, Number(id)))
        .orderBy(resources.sortOrder, resources.id);

  const editingSection = sp.editSection ? secs.find((s) => s.id === Number(sp.editSection)) : null;
  const editingResource = sp.editResource ? res.find((r) => r.id === Number(sp.editResource)) : null;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/libraries"
        className="btn-ghost inline-flex items-center gap-2 text-xs !py-1.5 !px-3"
      >
        <ArrowRight size={14} />
        العودة لقائمة المكتبات
      </Link>

      <div>
        <span className="chip mb-2">{isNew ? "NEW LIBRARY" : `LIBRARY ${lib?.code}`}</span>
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">
          {isNew ? "إضافة مكتبة جديدة" : lib?.titleAr}
        </h1>
        {sp.saved && (
          <div className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-xs text-cyan-200">
            تم حفظ التعديلات بنجاح.
          </div>
        )}
        {sp.deleted && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            تم حذف العنصر بنجاح.
          </div>
        )}
      </div>

      {/* Library details form */}
      <div className="card-surface p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Save size={16} className="text-cyan-300" />
          <h2 className="font-display text-base font-extrabold text-white">بيانات المكتبة والأسعار</h2>
        </div>

        <form action={adminSaveLibraryAction} className="grid gap-4 md:grid-cols-2 text-xs">
          <input type="hidden" name="id" value={isNew ? "" : lib?.id} />
          <input type="hidden" name="coverImage" value={lib?.coverImage ?? ""} />

          <div>
            <label className="field-label">اسم المكتبة (عربي)</label>
            <input name="titleAr" defaultValue={lib?.titleAr} required className="field text-xs" />
          </div>
          <div>
            <label className="field-label">اسم المكتبة (إنجليزي)</label>
            <input name="titleEn" defaultValue={lib?.titleEn} required className="field text-xs" dir="ltr" />
          </div>
          <div>
            <label className="field-label">الرابط (slug)</label>
            <input name="slug" defaultValue={lib?.slug} required className="field text-xs" dir="ltr" />
          </div>
          <div>
            <label className="field-label">الكود</label>
            <input name="code" defaultValue={lib?.code} className="field text-xs" dir="ltr" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">الوصف المختصر</label>
            <input name="tagline" defaultValue={lib?.tagline} className="field text-xs" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">الوصف التفصيلي</label>
            <textarea name="description" rows={4} defaultValue={lib?.description} className="field text-xs" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">لمن هذه المكتبة؟</label>
            <textarea name="audience" rows={2} defaultValue={lib?.audience} className="field text-xs" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">المخرجات والفوائد (كل بند في سطر)</label>
            <textarea name="benefits" rows={4} defaultValue={(lib?.benefits ?? []).join("\n")} className="field text-xs" />
          </div>
          <div>
            <label className="field-label">السعر (ج.م)</label>
            <input name="price" defaultValue={lib?.priceValue} className="field text-xs" dir="ltr" />
          </div>
          <div>
            <label className="field-label">سعر بعد الخصم (اختياري)</label>
            <input name="discountPrice" defaultValue={lib?.discountValue ?? ""} className="field text-xs" dir="ltr" />
          </div>
          <div>
            <label className="field-label">رابط فيديو المعاينة المجاني (YouTube)</label>
            <input name="videoUrl" defaultValue={lib?.videoUrl} className="field text-xs" dir="ltr" />
          </div>
          <div>
            <label className="field-label">وصف الفيديو</label>
            <input name="videoCaption" defaultValue={lib?.videoCaption} className="field text-xs" />
          </div>
          <div>
            <label className="field-label">صورة الغلاف (اختياري)</label>
            <input name="cover" type="file" accept="image/*" className="field text-xs" />
          </div>
          <div>
            <label className="field-label">ترتيب الظهور</label>
            <input name="sortOrder" defaultValue={lib?.sortOrder ?? 0} className="field text-xs" dir="ltr" />
          </div>

          <div className="flex flex-wrap items-center gap-4 md:col-span-2 pt-2">
            <label className="flex items-center gap-2 text-xs text-white">
              <input type="checkbox" name="published" defaultChecked={lib?.published ?? false} className="h-4 w-4 accent-cyan-400" />
              منشورة (تأكد من السعر وفيديو المعاينة قبل النشر)
            </label>
            <label className="flex items-center gap-2 text-xs text-white">
              <input type="checkbox" name="featured" defaultChecked={lib?.featured ?? true} className="h-4 w-4 accent-cyan-400" />
              مميزة
            </label>
            <button type="submit" className="btn-primary text-xs ms-auto">
              حفظ بيانات المكتبة
            </button>
          </div>
        </form>
      </div>

      {/* Sections management */}
      <div className="card-surface p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <FolderTree size={16} className="text-cyan-300" />
          <h2 className="font-display text-base font-extrabold text-white">الأقسام (إضافة وتعديل وحذف)</h2>
        </div>

        <div className="space-y-2">
          {secs.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="font-tech text-xs text-cyan-300 font-bold">{s.code}</span>
                <span className="font-bold text-white">{s.title}</span>
                <span className="text-[11px] text-slate-400">
                  ({res.filter((r) => r.sectionId === s.id).length} عناصر)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/libraries/${id}?editSection=${s.id}`}
                  className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-400"
                >
                  <Pencil size={11} className="inline ms-1" /> تعديل
                </Link>
                <form action={adminDeleteSectionAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="libraryId" value={id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-rose-500/30 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 size={11} className="inline ms-1" /> حذف
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <form action={adminSaveSectionAction} className="grid gap-3 pt-3 border-t border-white/10 md:grid-cols-4 text-xs">
          <input type="hidden" name="id" value={editingSection?.id ?? ""} />
          <input type="hidden" name="libraryId" value={id} />
          <div>
            <label className="field-label text-[11px]">الكود</label>
            <input name="code" defaultValue={editingSection?.code} className="field text-xs font-tech" dir="ltr" placeholder="00" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label text-[11px]">عنوان القسم</label>
            <input name="title" defaultValue={editingSection?.title} required className="field text-xs" placeholder="ابدأ من هنا" />
          </div>
          <div>
            <label className="field-label text-[11px]">الترتيب</label>
            <input name="sortOrder" defaultValue={editingSection?.sortOrder ?? secs.length} className="field text-xs font-tech" dir="ltr" />
          </div>
          <div className="md:col-span-4">
            <label className="field-label text-[11px]">وصف القسم</label>
            <input name="description" defaultValue={editingSection?.description} className="field text-xs" />
          </div>
          <div className="md:col-span-4">
            <button type="submit" className="btn-primary text-xs">
              <Plus size={14} />
              {editingSection ? "حفظ تعديل القسم" : "إضافة قسم جديد"}
            </button>
          </div>
        </form>
      </div>

      {/* Resources & Files management */}
      <div className="card-surface p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <FileText size={16} className="text-cyan-300" />
          <h2 className="font-display text-base font-extrabold text-white">الملفات والدروس والمصادر</h2>
        </div>

        <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-4 text-xs leading-6 text-slate-200">
          <p className="font-bold text-cyan-200">إدارة الملفات أصبحت أسهل</p>
          <p className="mt-1">افتح مركز رفع الملفات، اختار المكتبة والقسم، ثم اسحب عدة ملفات من جهازك مرة واحدة. كل ملف يضاف تلقائيًا إلى المحتوى ويمكنك تحديد هل هو مجاني أو منشور.</p>
          <Link href="/admin/content" className="btn-primary mt-3 inline-flex text-xs"><FileText size={13} /> فتح مركز رفع الملفات</Link>
        </div>

        <div className="space-y-2">
          {res.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-white">{r.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {kindLabel[r.kind] ?? r.kind} {r.isFree && " · مجاني"} {!r.published && " · مخفي"}
                  {r.fileName && ` · ${r.fileName}`}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/libraries/${id}?editResource=${r.id}`}
                  className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-400"
                >
                  <Pencil size={11} className="inline ms-1" /> تعديل
                </Link>
                <form action={adminDeleteResourceAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="libraryId" value={id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-rose-500/30 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 size={11} className="inline ms-1" /> حذف
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <form action={adminSaveResourceAction} className="grid gap-3 pt-3 border-t border-white/10 md:grid-cols-2 text-xs">
          <input type="hidden" name="id" value={editingResource?.id ?? ""} />
          <input type="hidden" name="libraryId" value={id} />
          <input type="hidden" name="filePath" value={editingResource?.filePath ?? ""} />
          <input type="hidden" name="fileName" value={editingResource?.fileName ?? ""} />

          <div className="md:col-span-2">
            <label className="field-label text-[11px]">عنوان الملف / الدرس</label>
            <input name="title" defaultValue={editingResource?.title} required className="field text-xs" />
          </div>
          <div>
            <label className="field-label text-[11px]">القسم التابع له</label>
            <select name="sectionId" defaultValue={editingResource?.sectionId ?? secs[0]?.id} className="field text-xs" required>
              {secs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label text-[11px]">النوع</label>
            <select name="kind" defaultValue={editingResource?.kind ?? "document"} className="field text-xs">
              {Object.entries(kindLabel).filter(([k]) => editingResource || k !== "file").map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="field-label text-[11px]">وصف مختصر</label>
            <textarea name="description" rows={2} defaultValue={editingResource?.description} className="field text-xs" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label text-[11px]">نص الدرس (يُعرض داخل القارئ)</label>
            <textarea name="content" rows={4} defaultValue={editingResource?.content} className="field text-xs" />
          </div>
          <div>
            <label className="field-label text-[11px]">رابط خارجي أو فيديو</label>
            <input name="externalUrl" defaultValue={editingResource?.externalUrl ?? ""} className="field text-xs" dir="ltr" />
          </div>
          <div>
            <label className="field-label text-[11px]">المدة</label>
            <input name="duration" defaultValue={editingResource?.duration} className="field text-xs font-tech" dir="ltr" placeholder="30 min" />
          </div>
          <div>
            <label className="field-label text-[11px]">رفع الملفات من جهازك</label>
            <Link href="/admin/content" className="btn-primary inline-flex text-xs"><FileText size={13} /> فتح مركز رفع الملفات</Link>
            {editingResource?.fileName && (
              <p className="mt-1 text-[11px] text-slate-400">الملف الحالي: {editingResource.fileName}. استخدم مركز رفع الملفات لإضافة ملفات جديدة أو استبدال هذا العنصر.</p>
            )}
            <p className="mt-1 text-[11px] text-slate-400">مركز الرفع يدعم اختيار عدة ملفات دفعة واحدة، ويضيف كل ملف تلقائيًا إلى القسم المختار.</p>
          </div>
          <div>
            <label className="field-label text-[11px]">الترتيب</label>
            <input name="sortOrder" defaultValue={editingResource?.sortOrder ?? res.length} className="field text-xs font-tech" dir="ltr" />
          </div>
          <div className="flex flex-wrap items-center gap-4 md:col-span-2 pt-2">
            <label className="flex items-center gap-2 text-xs text-white">
              <input type="checkbox" name="isFree" defaultChecked={editingResource?.isFree ?? false} className="h-4 w-4 accent-cyan-400" />
              متاح مجانًا قبل الشراء
            </label>
            <label className="flex items-center gap-2 text-xs text-white">
              <input type="checkbox" name="published" defaultChecked={editingResource?.published ?? true} className="h-4 w-4 accent-cyan-400" />
              منشور
            </label>
            <button type="submit" className="btn-primary text-xs ms-auto">
              <Plus size={14} />
              {editingResource ? "حفظ تعديل الملف" : "إضافة ملف جديد"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
