import Link from "next/link";
import { getLibraries, getSections, getResources, getPaymentSettings, egp, SITE } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "المكتبات الرقمية الهندسية | SENSE",
  description:
    "تصفح أربع مكتبات رقمية هندسية: ميكاترونكس، ميكانيكا، كهرباء، وبرمجة. فيديو معاينة مجاني لكل مكتبة ودفع مرة واحدة.",
};

const defaultCovers: Record<string, string> = {
  mechatronics: "https://images.pexels.com/photos/3913031/pexels-photo-3913031.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mechanical: "https://images.pexels.com/photos/8439008/pexels-photo-8439008.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  electrical: "https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  programming: "https://images.pexels.com/photos/29320998/pexels-photo-29320998.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

const libraryEmojis: Record<string, string> = {
  mechatronics: "🤖",
  mechanical: "⚙️",
  electrical: "⚡",
  programming: "💻",
};

export default async function LibrariesPage() {
  const [libraries, paymentSettings] = await Promise.all([
    getLibraries({ publishedOnly: true }),
    getPaymentSettings(),
  ]);
  const availablePaymentMethods = [
    { key: "instapay", label: "InstaPay" },
    { key: "wallet", label: "محافظ إلكترونية" },
    { key: "bank", label: "تحويل بنكي" },
  ].filter((method) => Boolean(paymentSettings[method.key]?.value?.trim()));
  const libraryStats = await Promise.all(libraries.map(async (lib) => {
    const [sections, resources] = await Promise.all([getSections(lib.id), getResources(lib.id)]);
    return { id: lib.id, sections: sections.length, items: resources.filter((r) => r.published).length };
  }));

  return (
    <div className="container-page py-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900/60 p-8 sm:p-10">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
        <div className="max-w-2xl">
          <span className="chip mb-3">Digital Libraries</span>
          <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl md:text-[34px]">
            المكتبات المتاحة
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-300/90 sm:text-base">
            كل مكتبة تُحدّث باستمرار، وتُفتح مرة واحدة على حسابك. شاهد فيديو المعاينة المجاني قبل أي دفع.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-slate-300">
          {availablePaymentMethods.length > 0 ? availablePaymentMethods.map((method) => (
            <span key={method.key} className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 font-bold text-cyan-200">
              {method.label}
            </span>
          )) : (
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">تجهيز وسائل الدفع قيد الإعداد</span>
          )}
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-emerald-200">
            وصول دائم بدون تجديد
          </span>
        </div>
      </div>

      {/* Grid */}
      {libraries.length === 0 ? (
        <div className="card-surface mt-8 p-10 text-center">
          <p className="text-4xl">📚</p>
          <h2 className="mt-4 text-xl font-extrabold text-white">المكتبات قيد التجهيز</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-300">نعمل على مراجعة المحتوى والأسعار وفيديوهات المعاينة قبل نشر المكتبات. ارجع قريبًا للاطلاع على المكتبات المتاحة.</p>
          <Link href="/contact" className="btn-ghost mt-5 text-xs">تواصل معنا</Link>
        </div>
      ) : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {libraries.map((lib) => {
          const cover = lib.coverImage || defaultCovers[lib.slug] || defaultCovers.mechatronics;
          const emoji = libraryEmojis[lib.slug] || "📐";
          const stats = libraryStats.find((item) => item.id === lib.id) || { sections: 0, items: 0 };
          const discountPercent =
            lib.discountValue !== null && lib.priceValue > 0 && lib.discountValue > 0 && lib.discountValue < lib.priceValue
              ? Math.round(((lib.priceValue - lib.discountValue) / lib.priceValue) * 100)
              : 0;

          return (
            <article
              key={lib.id}
              className="card-surface group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_25px_60px_-35px_rgba(34,211,238,0.6)]"
            >
              <Link href={`/library/${lib.slug}`} className="relative block aspect-[16/9] overflow-hidden">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-navy-950 via-navy-950/55 to-transparent" />
                <img
                  src={cover}
                  alt={lib.titleAr}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-x-4 bottom-3 z-20 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-200/90">
                      {lib.titleAr}
                    </p>
                    <h2 className="mt-0.5 font-display text-lg font-extrabold leading-tight text-white">
                      {lib.titleEn}
                    </h2>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-navy-950/70 text-xl backdrop-blur">
                    {emoji}
                  </span>
                </div>
                {discountPercent > 0 && (
                  <span className="absolute end-3 top-3 z-20 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-lg">
                    خصم {discountPercent}%
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="text-sm leading-6 text-slate-300/90 line-clamp-2">{lib.tagline}</p>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                    {stats.sections} قسم
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                    {stats.items} ملف ودرس
                  </span>
                  <span className="rounded-md border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-cyan-200">
                    فيديو معاينة مجاني
                  </span>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-3">
                  <div>
                    {lib.discountValue !== null && (
                      <span className="block text-[11px] text-slate-500 line-through">
                        {egp(lib.priceValue)} ج.م
                      </span>
                    )}
                    <span className="font-display text-xl font-extrabold text-white">
                      {lib.finalPrice > 0 ? `${egp(lib.finalPrice)} ج.م` : "السعر قريبًا"}
                    </span>
                    <span className="ms-1 text-[10px] text-slate-400">دفعة واحدة</span>
                  </div>
                  <Link href={`/library/${lib.slug}`} className="btn-ghost !py-1.5 !px-3 text-xs">
                    التفاصيل والشراء
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>}

      {/* Help box */}
      <div className="card-surface mt-12 p-8 text-center sm:p-10">
        <span className="chip mb-2">Need Help?</span>
        <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
          غير متأكد أي مكتبة تناسبك؟
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
          تواصل مع إدارة {SITE.name} لمساعدتك في اختيار المسار الأنسب لتخصصك ومستواك، وتوضيح محتوى كل مكتبة بالتفصيل.
        </p>
        <div className="mt-5">
          <Link href="/contact" className="btn-primary text-xs">
            تواصل معنا عبر الواتساب أو البريد
          </Link>
        </div>
      </div>
    </div>
  );
}
