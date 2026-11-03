import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, Pencil, Trash2, Eye, EyeOff, LibraryBig } from "lucide-react";
import { db } from "@/db";
import { libraries, resources, sections } from "@/db/schema";
import { egp, withPrices } from "@/lib/data";
import { adminDeleteLibraryAction, adminSaveLibraryAction } from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة المكتبات | لوحة التحكم" };

const defaultCovers: Record<string, string> = {
  mechatronics: "https://images.pexels.com/photos/3913031/pexels-photo-3913031.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mechanical: "https://images.pexels.com/photos/8439008/pexels-photo-8439008.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  electrical: "https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  programming: "https://images.pexels.com/photos/29320998/pexels-photo-29320998.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

export default async function AdminLibrariesPage() {
  const libs = (await db.select().from(libraries).orderBy(desc(libraries.createdAt))).map(withPrices);
  const secs = await db.select().from(sections);
  const res = await db.select().from(resources);

  return (
    <div className="space-y-8">
      <div>
        <span className="chip mb-2">LIBRARIES · إدارة المكتبات</span>
        <h1 className="font-display text-2xl font-black text-white sm:text-3xl">المكتبات والمحتوى</h1>
        <p className="mt-2 text-xs leading-6 text-slate-300">
          أضف مكتبة جديدة أو عدّل البيانات والأسعار والأقسام والملفات. يمكنك إضافة أي عدد من المكتبات مستقبلًا.
        </p>
      </div>

      <div className="card-surface overflow-x-auto p-1">
        <table className="sheet-table min-w-[850px]">
          <thead>
            <tr>
              <th>الغلاف</th>
              <th>الكود</th>
              <th>اسم المكتبة</th>
              <th>السعر</th>
              <th>الأقسام</th>
              <th>الملفات</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {libs.map((lib) => {
              const cover = defaultCovers[lib.slug] || lib.coverImage || defaultCovers.mechatronics;
              return (
                <tr key={lib.id}>
                  <td>
                    <div className="relative h-12 w-16 overflow-hidden rounded-lg border border-white/10 bg-navy-950">
                      <img
                        src={cover}
                        alt={lib.titleAr}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="font-tech text-xs text-cyan-300 font-bold">{lib.code}</td>
                  <td>
                    <p className="font-bold text-white text-xs">{lib.titleAr}</p>
                    <p className="font-tech text-[10px] text-slate-400">
                      {lib.titleEn.toUpperCase()}
                    </p>
                  </td>
                  <td>
                    <p className="font-tech text-xs font-bold text-cyan-300">{egp(lib.finalPrice)} ج.م</p>
                    {lib.discountValue !== null && (
                      <p className="font-tech text-[10px] text-slate-500 line-through">{egp(lib.priceValue)}</p>
                    )}
                  </td>
                  <td className="font-tech text-xs text-slate-300">
                    {secs.filter((s) => s.libraryId === lib.id).length}
                  </td>
                  <td className="font-tech text-xs text-slate-300">
                    {res.filter((r) => r.libraryId === lib.id).length}
                  </td>
                  <td>
                    <span className={`pill ${lib.published ? "pill-approved" : "pill-rejected"}`}>
                      {lib.published ? (
                        <>
                          <Eye size={11} /> منشورة
                        </>
                      ) : (
                        <>
                          <EyeOff size={11} /> مخفية
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/libraries/${lib.id}`}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                      >
                        <Pencil size={12} className="inline ms-1" /> تعديل
                      </Link>
                      <Link
                        href={`/library/${lib.slug}`}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                      >
                        <LibraryBig size={12} className="inline ms-1" /> عرض
                      </Link>
                      <form action={adminDeleteLibraryAction}>
                        <input type="hidden" name="id" value={lib.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-500/30 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 size={12} className="inline ms-1" /> حذف
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Library Form */}
      <div className="card-surface p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Plus size={18} className="text-cyan-300" />
          <h2 className="font-display text-lg font-extrabold text-white">إضافة مكتبة جديدة</h2>
        </div>

        <form action={adminSaveLibraryAction} className="grid gap-4 md:grid-cols-2 text-xs">
          <input type="hidden" name="id" value="" />
          <div>
            <label className="field-label">اسم المكتبة (عربي)</label>
            <input name="titleAr" required className="field text-xs" placeholder="مثال: مكتبة الذكاء الاصطناعي والروبوتات" />
          </div>
          <div>
            <label className="field-label">اسم المكتبة (إنجليزي)</label>
            <input name="titleEn" required className="field text-xs" dir="ltr" placeholder="AI & Robotics Digital Library" />
          </div>
          <div>
            <label className="field-label">الرابط (slug)</label>
            <input name="slug" required className="field text-xs" dir="ltr" placeholder="ai-robotics" />
          </div>
          <div>
            <label className="field-label">الكود</label>
            <input name="code" className="field text-xs" dir="ltr" placeholder="LIB-05" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">الوصف المختصر</label>
            <input name="tagline" className="field text-xs" placeholder="سطر تعريفي يظهر في البطاقات" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">الوصف التفصيلي</label>
            <textarea name="description" rows={3} className="field text-xs" placeholder="نبذة تعريفية شاملة بالمكتبة…" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">لمن هذه المكتبة؟</label>
            <textarea name="audience" rows={2} className="field text-xs" />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">المخرجات والفوائد (كل بند في سطر)</label>
            <textarea name="benefits" rows={3} className="field text-xs" placeholder={"مسار منظم\nكورسات عملية\nكتب ومراجع"} />
          </div>
          <div>
            <label className="field-label">السعر (ج.م)</label>
            <input name="price" className="field text-xs" dir="ltr" placeholder="850" />
          </div>
          <div>
            <label className="field-label">سعر بعد الخصم (اختياري)</label>
            <input name="discountPrice" className="field text-xs" dir="ltr" placeholder="650" />
          </div>
          <div>
            <label className="field-label">رابط فيديو المعاينة المجاني (YouTube)</label>
            <input name="videoUrl" className="field text-xs" dir="ltr" placeholder="https://youtu.be/..." />
          </div>
          <div>
            <label className="field-label">وصف الفيديو</label>
            <input name="videoCaption" className="field text-xs" />
          </div>
          <div>
            <label className="field-label">صورة الغلاف (اختياري)</label>
            <input name="cover" type="file" accept="image/*" className="field text-xs" />
          </div>
          <div>
            <label className="field-label">ترتيب الظهور</label>
            <input name="sortOrder" className="field text-xs" dir="ltr" placeholder="0" />
          </div>
          <div className="flex flex-wrap items-center gap-4 md:col-span-2 pt-2">
            <label className="flex items-center gap-2 text-xs text-white">
              <input type="checkbox" name="published" defaultChecked className="h-4 w-4 accent-cyan-400" />
              منشورة (ظاهرة للزوار)
            </label>
            <label className="flex items-center gap-2 text-xs text-white">
              <input type="checkbox" name="featured" defaultChecked className="h-4 w-4 accent-cyan-400" />
              مميزة
            </label>
            <button type="submit" className="btn-primary text-xs ms-auto">
              <Plus size={15} />
              إضافة المكتبة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
