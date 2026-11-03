import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  PlayCircle,
  Users,
  BookOpen,
  ShieldCheck,
  FileText,
  Video,
  Link2,
  FileBox,
} from "lucide-react";
import PurchasePanel from "@/components/PurchasePanel";
import { getLibraryBySlug, getLibraryContent, getPaymentSettings, isEntitled, egp } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

import type { Metadata } from "next";
import { CourseJsonLd } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lib = await getLibraryBySlug(slug, { publishedOnly: true });
  if (!lib) {
    return {
      title: "المكتبة غير موجودة | SENSE",
    };
  }

  const cover = lib.coverImage || defaultCovers[lib.slug] || defaultCovers.mechatronics;

  return {
    title: `${lib.titleAr} (${lib.titleEn}) | SENSE`,
    description: `${lib.tagline} — ${lib.description.slice(0, 160)}... دفعة واحدة ووصول دائم مع فيديو معاينة مجاني.`,
    keywords: [
      lib.titleAr,
      lib.titleEn,
      lib.code,
      "كورسات هندسية",
      "كتب ومراجع",
      "مكتبة رقمية هندسية",
      "SENSE Engineering Digital Libraries",
    ],
    openGraph: {
      title: `${lib.titleAr} | SENSE`,
      description: lib.tagline,
      url: `${SITE_URL}/library/${lib.slug}`,
      images: [
        {
          url: cover,
          width: 1200,
          height: 627,
          alt: lib.titleAr,
        },
      ],
    },
    alternates: {
      canonical: `${SITE_URL}/library/${lib.slug}`,
    },
  };
}

function toEmbed(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return /^[\w-]{6,}$/.test(id) ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) return "";
    const watchId = url.searchParams.get("v");
    const pathMatch = url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{6,})/);
    const id = watchId && /^[\w-]{6,}$/.test(watchId) ? watchId : pathMatch?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  } catch {
    return "";
  }
}

const defaultCovers: Record<string, string> = {
  mechatronics: "https://images.pexels.com/photos/3913031/pexels-photo-3913031.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mechanical: "https://images.pexels.com/photos/8439008/pexels-photo-8439008.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  electrical: "https://images.pexels.com/photos/8566473/pexels-photo-8566473.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  programming: "https://images.pexels.com/photos/29320998/pexels-photo-29320998.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

const kindIcon: Record<string, typeof FileText> = {
  document: FileText,
  video: Video,
  link: Link2,
  file: FileBox,
};

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lib = await getLibraryBySlug(slug, { publishedOnly: true });
  if (!lib) notFound();

  const [allContent, user, settings] = await Promise.all([
    getLibraryContent(lib.id),
    getCurrentUser(),
    getPaymentSettings(),
  ]);
  // Public previews show published curriculum items only; unpublished drafts stay in admin.
  const content = allContent.map((section) => ({
    ...section,
    resources: section.resources.filter((resource) => resource.published),
  }));

  const owned = user ? await isEntitled(user.id, lib.id) : false;
  const embed = toEmbed(lib.videoUrl);
  const totalResources = content.reduce((sum, s) => sum + s.resources.length, 0);
  const cover = lib.coverImage || defaultCovers[lib.slug] || defaultCovers.mechatronics;

  return (
    <div>
      <CourseJsonLd
        title={lib.titleAr}
        description={lib.tagline || lib.description.slice(0, 180)}
        price={lib.finalPrice}
        url={`${SITE_URL}/library/${lib.slug}`}
      />
      {/* ---------- HERO ---------- */}
      <section className="relative border-b border-white/10 overflow-hidden py-14 lg:py-20">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-50" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(65%_60%_at_80%_0%,rgba(34,211,238,0.18),transparent_65%)]" />

        <div className="container-page">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{lib.code}</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300">
              {lib.titleEn}
            </span>
          </div>

          <h1 className="font-display mt-5 max-w-3xl text-3xl font-black leading-[1.2] text-white sm:text-4xl lg:text-[48px]">
            {lib.titleAr}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-300 sm:text-base">
            {lib.tagline}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {owned ? (
              <Link href={`/learn/${lib.slug}`} className="btn-primary text-xs">
                ادخل إلى المكتبة الآن
                <ArrowLeft size={16} />
              </Link>
            ) : (
              <a href="#buy" className="btn-primary text-xs">
                شراء المكتبة — {egp(lib.finalPrice)} ج.م
                <ArrowLeft size={16} />
              </a>
            )}
            <a href="#video" className="btn-ghost text-xs">
              <PlayCircle size={16} />
              فيديو المعاينة المجاني
            </a>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card-surface p-3.5">
              <span className="text-[11px] text-slate-400">عدد الأقسام</span>
              <p className="font-display mt-1 text-xl font-extrabold text-cyan-300">
                {String(content.length).padStart(2, "0")}
              </p>
            </div>
            <div className="card-surface p-3.5">
              <span className="text-[11px] text-slate-400">الملفات والمصادر</span>
              <p className="font-display mt-1 text-xl font-extrabold text-white">{totalResources}+</p>
            </div>
            <div className="card-surface p-3.5">
              <span className="text-[11px] text-slate-400">نوع الوصول</span>
              <p className="font-display mt-1 text-xl font-extrabold text-white">دائم</p>
            </div>
            <div className="card-surface p-3.5">
              <span className="text-[11px] text-slate-400">السعر</span>
              <p className="font-display mt-1 text-xl font-extrabold text-emerald-400">
                {egp(lib.finalPrice)} ج.م
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- BODY ---------- */}
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Main content column */}
          <div className="space-y-12">
            {/* Free Video Preview */}
            <div id="video" className="scroll-mt-24 card-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="chip mb-2">FREE PREVIEW</span>
                  <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                    شاهد المكتبة قبل الشراء
                  </h2>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                  متاح مجانًا بدون تسجيل
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                {lib.videoCaption ||
                  "فيديو مجاني يشرح محتوى المكتبة وطريقة تنظيم الملفات، وأنواع الكورسات والمراجع، وكيفية الوصول إليها، والفائدة العملية التي تحصل عليها، وطريقة استخدام المكتبة بعد الاشتراك."}
              </p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-navy-950">
                {embed ? (
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={embed}
                      title={`فيديو معاينة ${lib.titleAr}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="relative flex aspect-video w-full flex-col items-center justify-center p-6 text-center">
                    <PlayCircle size={48} className="text-cyan-400" />
                    <p className="mt-3 text-sm font-bold text-white">فيديو المعاينة المجاني</p>
                    <p className="mt-1 text-xs text-slate-400">
                      يمكن تحديث رابط الفيديو في أي وقت من لوحة الإدارة.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="card-surface p-6 sm:p-8">
              <span className="chip mb-2">ABOUT</span>
              <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                نبذة تعريفية عن المكتبة
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-8 text-slate-300">
                {lib.description}
              </p>
            </div>

            {/* Audience */}
            <div className="card-surface p-6 sm:p-8">
              <div className="flex items-center gap-2.5">
                <Users size={20} className="text-cyan-300" />
                <h2 className="font-display text-lg font-extrabold text-white sm:text-xl">
                  لمن هذه المكتبة؟
                </h2>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-300">
                {lib.audience}
              </p>
            </div>

            {/* Benefits */}
            <div className="card-surface p-6 sm:p-8">
              <span className="chip mb-2">OUTCOMES</span>
              <h2 className="font-display text-lg font-extrabold text-white sm:text-xl">
                ما الفائدة التي ستحصل عليها؟
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(lib.benefits ?? []).map((b) => (
                  <div
                    key={b}
                    className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-slate-200"
                  >
                    <Check size={15} className="mt-0.5 shrink-0 text-cyan-300" />
                    <span className="leading-6">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sections / Contents */}
            <div className="card-surface p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <span className="chip mb-2">CONTENTS</span>
                  <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                    محتويات وأقسام المكتبة
                  </h2>
                </div>
                <span className="text-xs text-slate-400">{content.length} قسم مرقّم</span>
              </div>

              <div className="mt-6 space-y-3">
                {content.map((sec) => (
                  <details
                    key={sec.id}
                    className="group rounded-xl border border-white/10 bg-navy-950/50 p-4 transition hover:border-cyan-400/30"
                  >
                    <summary className="flex items-center justify-between gap-3 font-display text-sm font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <span className="font-tech text-xs text-cyan-300">{sec.code}</span>
                        <span>{sec.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{sec.resources.length} عناصر</span>
                        <span className="faq-sign text-cyan-300">+</span>
                      </div>
                    </summary>

                    {sec.description && (
                      <p className="mt-2 text-xs leading-6 text-slate-400 border-t border-white/10 pt-2">
                        {sec.description}
                      </p>
                    )}

                    <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-2">
                      {sec.resources.map((r) => {
                        const Icon = kindIcon[r.kind] ?? FileText;
                        return (
                          <li
                            key={r.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300"
                          >
                            <span className="flex items-center gap-2">
                              <Icon size={13} className="text-cyan-300" />
                              {r.title}
                            </span>
                            {r.isFree && (
                              <span className="rounded bg-cyan-400/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-200">
                                مجاني
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ))}
              </div>
            </div>

            {/* Previews / Files */}
            <div className="card-surface p-6 sm:p-8">
              <span className="chip mb-2">PREVIEWS</span>
              <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                صور معاينة من ملفات المكتبة
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                الملفات مرتبة داخل القارئ المحمي بعلامة مائية باسمك ورقم حسابك، مع إمكانية البحث والعودة لمكان توقفك.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-950">
                  <img
                    src={cover}
                    alt={lib.titleAr}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-3 text-xs text-slate-300">
                    واجهة القارئ والتصفح المنظم للأقسام.
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-950">
                  <img
                    src="/images/preview-spread.jpg"
                    alt="معاينة الملفات"
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-3 text-xs text-slate-300">
                    شروحات وكتب ومراجع وروابط برامج رسمية.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Checkout */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div id="buy" className="card-surface p-6">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300">
                سعر المكتبة
              </p>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-black text-white">
                  {egp(lib.finalPrice)} ج.م
                </span>
                {lib.discountValue !== null && (
                  <span className="text-sm text-slate-500 line-through">
                    {egp(lib.priceValue)} ج.م
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">شراء مرة واحدة — وصول دائم بدون تجديد</p>

              <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-cyan-300" />
                  <span>وصول دائم لحسابك من الكمبيوتر والموبايل</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-cyan-300" />
                  <span>كل التحديثات المستقبلية بدون أي رسوم</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-cyan-300" />
                  <span>قارئ محمي بعلامة مائية لحفظ المحتوى</span>
                </div>
              </div>

              {owned ? (
                <div className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-cyan-200">
                    <ShieldCheck size={18} />
                    هذه المكتبة مفعّلة بالفعل على حسابك
                  </div>
                  <Link href={`/learn/${lib.slug}`} className="btn-primary mt-3 w-full text-xs">
                    فتح المكتبة الآن
                  </Link>
                </div>
              ) : (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <PurchasePanel
                    libraryId={lib.id}
                    librarySlug={lib.slug}
                    settings={settings}
                    loggedIn={!!user}
                  />
                </div>
              )}
            </div>

            <div className="card-surface p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <BookOpen size={16} className="text-cyan-300" />
                <span>تحتاج مساعدة أو استفسار؟</span>
              </div>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                تواصل مع فريق SENSE عبر نموذج التواصل لأي استفسار تقني أو بخصوص الدفع.
              </p>
              <Link href="/contact" className="btn-ghost mt-3 w-full text-center text-xs">
                تواصل معنا
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
