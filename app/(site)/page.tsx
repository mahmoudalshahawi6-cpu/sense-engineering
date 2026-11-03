import Link from "next/link";
import { getLibraries, getSections, getResources, egp } from "@/lib/data";

export const dynamic = "force-dynamic";

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

const features = [
  {
    icon: "🗂️",
    title: "مسارات مرتبة من الصفر",
    desc: "كل مكتبة مقسمة إلى أقسام مرقّمة تبدأ بالتأسيس وتنتهي بالمشروعات والاستعداد لسوق العمل.",
  },
  {
    icon: "🎬",
    title: "فيديو معاينة مجاني",
    desc: "شاهد المكتبة وطريقة تنظيمها والاستفادة منها قبل الشراء — بدون حساب ولا دفع.",
  },
  {
    icon: "🔐",
    title: "قارئ محمي بعلامة مائية",
    desc: "الملفات تُعرض داخل المنصة بعلامة مائية تحمل بريد حسابك، بدون روابط تحميل مباشرة.",
  },
  {
    icon: "♾️",
    title: "دفع مرة واحدة ووصول دائم",
    desc: "لا اشتراكات شهرية ولا تجديد. تظل المكتبة متاحة على حسابك بعد الشراء، وتشمل التحديثات التي تضيفها المنصة إلى محتواها.",
  },
  {
    icon: "🧾",
    title: "مراجعة يدوية للدفع",
    desc: "InstaPay ومحافظ إلكترونية وتحويل بنكي، والتفعيل يتم بعد مراجعة إثبات التحويل لضمان الأمان.",
  },
  {
    icon: "📱",
    title: "يعمل على كل الأجهزة",
    desc: "واجهة عربية RTL سريعة ومتجاوبة، وتُكمل من حيث توقفت على الموبايل أو الكمبيوتر.",
  },
];

const steps = [
  { n: "01", t: "شاهد المعاينة", d: "فيديو مجاني وصفحة تفصيلية لكل مكتبة." },
  { n: "02", t: "أنشئ حسابك", d: "بريد إلكتروني وكلمة مرور، وتأكيد البريد." },
  { n: "03", t: "حوّل المبلغ", d: "InstaPay أو محفظة إلكترونية أو تحويل بنكي." },
  { n: "04", t: "ارفع إثبات الدفع", d: "صورة التحويل تُرسل مع الطلب بأمان." },
  { n: "05", t: "تفعيل المكتبة", d: "بعد موافقة الإدارة تُفتح المكتبة دائمًا في حسابك." },
];

const faqs = [
  {
    q: "هل الدفع شهري أم يُدفع مرة واحدة؟",
    a: "الدفع مرة واحدة فقط لكل مكتبة، وتحصل على وصول دائم من خلال حسابك دون أي تجديد.",
  },
  {
    q: "كيف يتم تفعيل المكتبة بعد الدفع؟",
    a: "ترفع صورة إثبات الدفع داخل الموقع، ثم يراجع الفريق التحويل ويوافق عليه، فتُفتح المكتبة في حسابك بعد اعتماد الطلب.",
  },
  {
    q: "هل يمكنني مشاهدة المكتبة قبل الشراء؟",
    a: "نعم، لكل مكتبة فيديو معاينة مجاني وصفحة تفصيلية تعرض الأقسام والمحتويات والمستهدف منها.",
  },
  {
    q: "ما وسائل الدفع المتاحة؟",
    a: "تظهر لك وسائل الدفع التي جهزتها الإدارة بالفعل، مثل InstaPay أو المحافظ الإلكترونية أو التحويل البنكي، مع بيانات التحويل في صفحة الشراء.",
  },
  {
    q: "هل أستطيع تحميل الملفات؟",
    a: "الملفات تُعرض داخل قارئ محمي على المنصة بعلامة مائية تحمل بيانات حسابك، لتقليل خطر النسخ أو المشاركة.",
  },
  {
    q: "هل تعمل المكتبة على الموبايل؟",
    a: "نعم، الموقع متجاوب بالكامل ويعمل على الموبايل والتابلت والكمبيوتر، ويمكنك المتابعة من نفس المكان الذي توقفت عنده.",
  },
];

export default async function HomePage() {
  const libraries = await getLibraries({ publishedOnly: true });
  const libraryStats = await Promise.all(libraries.map(async (lib) => {
    const [sections, resources] = await Promise.all([getSections(lib.id), getResources(lib.id)]);
    return { id: lib.id, sections: sections.length, items: resources.filter((resource) => resource.published).length };
  }));
  const previewLibrary = libraries.find((lib) => Boolean(lib.videoUrl));

  return (
    <div>
      {/* ----------------- HERO SECTION ----------------- */}
      <section className="relative border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-60" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(65%_60%_at_80%_0%,rgba(34,211,238,0.18),transparent_65%)]" />

        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">Your Engineering Knowledge Hub</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300">
                SENSE Engineering Digital Libraries
              </span>
            </div>

            <h1 className="font-display text-3xl font-black leading-[1.25] text-white sm:text-4xl lg:text-[52px] lg:leading-[1.2]">
              كل مصادر التعلم الهندسي
              <span className="block text-gradient">في مكان واحد</span>
            </h1>

            <p className="max-w-xl text-sm leading-8 text-slate-300 sm:text-base">
مكتبات رقمية متخصصة في الميكاترونكس والميكانيكا والكهرباء والبرمجة. كورسات ومراجع وبرامج هندسية ومشروعات عملية ومسارات تعلم منظمة — بتصميم عربي واضح، وشراء مرة واحدة ووصول دائم بعد اعتماد الدفع.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link className="btn-primary" href="/libraries">
                استكشف المكتبات
              </Link>
              {previewLibrary ? (
                <Link className="btn-ghost" href={`/library/${previewLibrary.slug}#video`}>
                  <span aria-hidden="true">▶</span> شاهد فيديو المعاينة
                </Link>
              ) : (
                <Link className="btn-ghost" href="#how-it-works">
                  تعرّف على طريقة الاشتراك
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-300">✓</span> وصول دائم بدون اشتراك
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-300">✓</span> قارئ PDF محمي
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-300">✓</span> دفع مُراجع يدويًا
              </span>
            </div>
          </div>

          {/* Right Mockup Card */}
          <div className="relative">
            <div className="card-surface relative overflow-hidden p-3">
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  sense / my-libraries
                </span>
                <span className="text-[10px] font-bold text-cyan-300">PREVIEW</span>
              </div>

              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={defaultCovers.mechatronics}
                  alt="مكتبة الميكاترونكس"
                  className="h-52 w-full object-cover sm:h-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-cyan-300">MECHATRONICS DIGITAL LIBRARY</p>
                    <p className="font-display text-lg font-extrabold text-white">جاهزة على حسابك</p>
                  </div>
                  <span className="rounded-lg bg-cyan-400 px-2 py-1 text-[10px] font-extrabold text-navy-950">
                    وصول دائم
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center">
                  <p className="text-[11px] font-extrabold text-white">PLC</p>
                  <p className="text-[10px] text-slate-400">مسار صناعي</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center">
                  <p className="text-[11px] font-extrabold text-white">Robotics</p>
                  <p className="text-[10px] text-slate-400">تطبيقات عملية</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center">
                  <p className="text-[11px] font-extrabold text-white">CAD</p>
                  <p className="text-[10px] text-slate-400">تصميم ثلاثي الأبعاد</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-cyan-200">متابعة التعلّم</span>
                  <span className="text-slate-400">مثال توضيحي لواجهة العضو</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-navy-950">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: "46%" }} />
                </div>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              🔒 مستندات بعلامة مائية باسم حسابك
            </p>
          </div>
        </div>

        {/* Stats counter row */}
        <div className="border-t border-white/10 bg-navy-900/40">
          <div className="container-page grid grid-cols-2 gap-4 py-8 lg:grid-cols-4">
            <div className="card-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">مكتبات هندسية</span>
                <span className="text-lg">📚</span>
              </div>
              <p className="font-display mt-2 text-2xl font-black text-white sm:text-3xl">{libraries.length}</p>
              <p className="text-[11px] text-slate-400">مكتبات منشورة ومتاحة حاليًا</p>
            </div>

            <div className="card-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">ملف ودرس ومرجع</span>
                <span className="text-lg">🗃️</span>
              </div>
              <p className="font-display mt-2 text-2xl font-black text-cyan-300 sm:text-3xl">منظم</p>
              <p className="text-[11px] text-slate-400">ملفات ومصادر حسب التخصص</p>
            </div>

            <div className="card-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">قسم منظم</span>
                <span className="text-lg">🧭</span>
              </div>
              <p className="font-display mt-2 text-2xl font-black text-white sm:text-3xl">مرقّم</p>
              <p className="text-[11px] text-slate-400">أقسام مرتبة حسب مسار التعلم</p>
            </div>

            <div className="card-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">تبدأ من</span>
                <span className="text-lg">💳</span>
              </div>
              <p className="font-display mt-2 text-lg font-black text-emerald-400 sm:text-xl">أسعار واضحة</p>
              <p className="text-[11px] text-slate-400">تظهر في صفحة كل مكتبة بعد نشرها</p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- LIBRARIES CATALOGUE ----------------- */}
      <section id="libraries" className="container-page py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="chip mb-3">Digital Libraries</span>
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl md:text-[34px]">
              اختر مكتبتك الهندسية
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300/90 sm:text-base">
              كل مكتبة صفحة مستقلة بفيديو معاينة مجاني، محتويات مفصلة، سعر واضح، ووصول دائم بعد التفعيل.
            </p>
          </div>
          <Link className="btn-ghost text-xs" href="/libraries">
            كل المكتبات ←
          </Link>
        </div>

        {libraries.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-3xl">📚</p>
            <h3 className="mt-3 text-lg font-extrabold text-white">المكتبات قيد التجهيز</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-300">ستظهر المكتبات هنا بعد مراجعة محتواها وأسعارها وإضافة فيديوهات المعاينة ونشرها من إدارة SENSE.</p>
            <Link href="/contact" className="btn-ghost mt-5 text-xs">تواصل معنا</Link>
          </div>
        ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                      <h3 className="mt-0.5 font-display text-lg font-extrabold leading-tight text-white">
                        {lib.titleEn}
                      </h3>
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
                        {egp(lib.finalPrice)} ج.م
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
        </div>
        )}
      </section>

      {/* ----------------- WHY US / FEATURES ----------------- */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip mb-3">لماذا نحن؟</span>
          <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl md:text-[34px]">
            مزايا الاشتراك في مكتبة رقمية واحدة
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300/90 sm:text-base">
            بنينا المنصة لتحل مشكلة تشتت المصادر: ملفات مبعثرة، روابط منتهية، وشروحات غير مرتبة. هنا كل شيء منظم ومُحدّث ومحمي.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card-surface p-5 transition hover:border-cyan-400/35">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-xl">
                {f.icon}
              </span>
              <h3 className="mt-4 font-display text-base font-extrabold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300/90">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------- HOW TO BUY (5 STEPS) ----------------- */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip mb-3">كيف تشتري؟</span>
          <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl md:text-[34px]">
            خمس خطوات ويصبح المحتوى على حسابك
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300/90 sm:text-base">
            لا يتم فتح المحتوى بمجرد رفع الصورة، بل بعد مراجعة الإدارة للتحويل وتأكيده.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {steps.map((s) => (
            <div key={s.n} className="card-surface relative p-5">
              <span className="font-display text-2xl font-black text-cyan-400/40">{s.n}</span>
              <h3 className="mt-2 font-display text-sm font-extrabold text-white">{s.t}</h3>
              <p className="mt-1.5 text-xs leading-6 text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------- ONE-TIME PAYMENT & OFFICIAL INFO ----------------- */}
      <section className="container-page grid items-center gap-10 py-16 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="max-w-2xl">
            <span className="chip mb-3">دفع مرة واحدة</span>
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl md:text-[34px]">
              اشتراكك ليس شهريًا — المكتبة ملكك
            </h2>
          </div>
          <p className="text-sm leading-8 text-slate-300">
            تُشترى كل مكتبة مرة واحدة، ويظل الوصول إليها مرتبطًا بحسابك دون اشتراكات شهرية. وتشمل عضويتك تحديثات المحتوى التي تضيفها المنصة إلى المكتبة.
          </p>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-300">◆</span>
              <span className="leading-7">وسائل دفع يدوية تتيحها الإدارة: InstaPay أو المحافظ الإلكترونية أو التحويل البنكي.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-300">◆</span>
              <span className="leading-7">مراجعة يدوية لإثبات الدفع وتفعيل بعد التأكد من التحويل.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-300">◆</span>
              <span className="leading-7">الوصول مرتبط بالحساب وليس بالجهاز، مع حد أقصى للجلسات لكل مستخدم.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-300">◆</span>
              <span className="leading-7">تحديث الملفات وإضافة أقسام جديدة لا يلغي عضويتك.</span>
            </li>
          </ul>
          <Link className="inline-flex text-xs font-bold text-cyan-300 underline" href="/refund">
            اقرأ سياسة الاسترداد والاسترجاع
          </Link>
        </div>

        {/* Right card: payment workflow */}
        <div className="card-surface p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300">طريقة الدفع وتفعيل المكتبة</p>
          <div className="mt-4 space-y-3">
            {[
              ["01", "اختر المكتبة", "راجع السعر ومحتويات المكتبة وفيديو المعاينة المجاني."],
              ["02", "حوّل المبلغ", "ستظهر بيانات التحويل البنكي أو InstaPay أو المحفظة داخل صفحة الشراء بعد اعتمادها من الإدارة."],
              ["03", "ارفع إثبات الدفع", "أرسل صورة أو ملف الإيصال من حسابك ليصل الطلب إلى لوحة الإدارة."],
              ["04", "استلم التفعيل", "بعد مراجعة التحويل يدويًا، تُفتح المكتبة على حسابك بشكل دائم."],
            ].map(([n, title, text]) => (
              <div key={n} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
                <span className="font-tech grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-400/10 text-xs font-bold text-cyan-200">{n}</span>
                <div>
                  <p className="text-xs font-bold text-white">{title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-6 text-slate-400">لن نعرض أي بيانات تحويل قبل إدخالها واعتمادها من لوحة إدارة SENSE.</p>
        </div>
      </section>

      {/* ----------------- SECURITY & CONTENT ACCESS ----------------- */}
      <section className="container-page py-12">
        <div className="card-surface relative overflow-hidden p-8 sm:p-12 border-cyan-400/25">
          <div className="absolute inset-0 -z-10 blueprint-bg opacity-20" />
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <span className="chip mb-2">MEMBER ACCESS &amp; CONTENT CARE</span>
              <h2 className="font-display text-2xl font-black text-white sm:text-3xl">مكتبتك مرتبطة بحسابك</h2>
              <p className="mt-3 text-sm leading-8 text-slate-300">نستخدم صلاحيات دخول لكل مكتبة وتخزينًا خاصًا للملفات، مع مراجعة يدوية للمدفوعات وعلامات مائية على بعض المستندات المعروضة داخل القارئ.</p>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
                <li>🔐 لا يفتح المحتوى المدفوع إلا لحساب لديه صلاحية شراء.</li>
                <li>🗂️ ملفات المحتوى وإثباتات الدفع تُخزّن في مساحات خاصة عند ضبط التخزين السحابي.</li>
                <li>💧 يمكن إظهار بريد العضو كعلامة مائية داخل المستندات المدعومة.</li>
                <li>🧾 لا يتفعل الطلب إلا بعد مراجعة الإدارة لإثبات التحويل.</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="rounded-2xl border border-white/10 bg-navy-950/70 p-4"><span className="text-2xl block mb-2">📚</span><span className="font-bold text-white block">مكتبات متخصصة</span><span className="text-[11px] text-slate-400 mt-1 block">كل تخصص في مساحة مستقلة</span></div>
              <div className="rounded-2xl border border-white/10 bg-navy-950/70 p-4"><span className="text-2xl block mb-2">🔒</span><span className="font-bold text-emerald-400 block">صلاحيات حساب</span><span className="text-[11px] text-slate-400 mt-1 block">وصول للمشتريات فقط</span></div>
              <div className="rounded-2xl border border-white/10 bg-navy-950/70 p-4"><span className="text-2xl block mb-2">🧾</span><span className="font-bold text-cyan-300 block">تفعيل يدوي</span><span className="text-[11px] text-slate-400 mt-1 block">بعد مراجعة الإيصال</span></div>
              <div className="rounded-2xl border border-white/10 bg-navy-950/70 p-4"><span className="text-2xl block mb-2">🧭</span><span className="font-bold text-amber-300 block">تنظيم واضح</span><span className="text-[11px] text-slate-400 mt-1 block">فهرس وترتيب لكل مكتبة</span></div>
            </div>
          </div>
        </div>
      </section>



      {/* ----------------- FAQ SECTION ----------------- */}
      <section id="faq" className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip mb-3">الأسئلة الشائعة</span>
          <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl md:text-[34px]">
            كل ما تحتاج معرفته قبل الشراء
          </h2>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqs.map((f, i) => (
            <details
              key={f.q}
              open={i === 0}
              className="card-surface group p-5 transition hover:border-cyan-400/35"
            >
              <summary className="flex items-center justify-between gap-4 font-display text-base font-extrabold text-white">
                <span>{f.q}</span>
                <span className="faq-sign text-xl font-bold text-cyan-300 transition-transform">+</span>
              </summary>
              <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-7 text-slate-300/90">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ----------------- CTA BANNER ----------------- */}
      <section className="container-page my-12">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-blue-600/25 via-navy-800 to-cyan-500/20 p-8 text-center sm:p-12">
          <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
          <h2 className="font-display text-2xl font-black text-white sm:text-3xl">
            ابدأ رحلتك الهندسية اليوم
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-200">
            أنشئ حسابك مجانًا، شاهد فيديو المعاينة لكل مكتبة، ثم فعّل المكتبة التي تحتاجها بدفعة واحدة.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="btn-primary" href="/register">
              إنشاء حساب مجاني
            </Link>
            <Link className="btn-ghost" href="/libraries">
              تصفح المكتبات
            </Link>
          </div>
          <p className="mt-5 text-[11px] text-slate-400">
            تواصل مع فريق SENSE من صفحة التواصل لإرسال استفسارك.
          </p>
        </div>
      </section>
    </div>
  );
}
