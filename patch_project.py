from pathlib import Path
import re, shutil, json
root=Path('/mnt/data/sense_work')

def read(p): return (root/p).read_text(encoding='utf-8')
def write(p,s): (root/p).write_text(s,encoding='utf-8')

# Brand and canonical URL configuration
write('src/lib/site.ts', '''export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sense-engineering.netlify.app").replace(/\\/$/, "");
export const BRAND_NAME = "SENSE";
export const BRAND_FULL_NAME = "SENSE — Engineering Digital Libraries";
''')

p='src/lib/data.ts'; s=read(p)
s=s.replace('''export const SITE = {
  name: "Engineering Digital Libraries",
  nameAr: "المكتبات الرقمية الهندسية",
  slogan: "Your Engineering Knowledge Hub",
  sloganAr: "وجهتك للمعرفة الهندسية",
  email: "mahmoudalshahawi6@gmail.com",
  phone: "+20 106 972 4418",
  address: "القاهرة، جمهورية مصر العربية",
  brand: "SENSE MECHATRONICS",
};''','''export const SITE = {
  name: "SENSE",
  nameAr: "سينس — المكتبات الرقمية الهندسية",
  fullName: "SENSE Engineering Digital Libraries",
  slogan: "Your Engineering Knowledge Hub",
  sloganAr: "وجهتك للمعرفة الهندسية",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "mahmoudalshahawi6@gmail.com",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "مصر",
  brand: "SENSE",
};''')
write(p,s)

# Logo wordmark
p='src/components/Logo.tsx'; s=read(p)
s=s.replace('title = "Engineering Digital Libraries"','title = "SENSE Engineering Digital Libraries"')
s=s.replace('''        <span className="block font-display text-[15px] font-extrabold tracking-tight text-white sm:text-base">
          Engineering <span className="text-cyan-300">Digital Libraries</span>
        </span>
        <span className="block text-[10px] font-semibold tracking-[0.18em] text-slate-400 sm:text-[11px]">
          YOUR ENGINEERING KNOWLEDGE HUB
        </span>''','''        <span className="block font-display text-lg font-black tracking-[0.12em] text-white sm:text-xl">
          SENSE
        </span>
        <span className="block text-[9px] font-semibold tracking-[0.12em] text-slate-400 sm:text-[10px]">
          ENGINEERING DIGITAL LIBRARIES
        </span>''')
write(p,s)

# Update accessible brand labels in components
for p in ['src/components/Header.tsx','src/components/Footer.tsx']:
    s=read(p).replace('aria-label="Engineering Digital Libraries"','aria-label="SENSE Engineering Digital Libraries"')
    write(p,s)

# Root layout metadata with planned Netlify subdomain, configurable in env
p='src/app/layout.tsx'; s=read(p)
s=s.replace('import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/JsonLd";','import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/JsonLd";\nimport { SITE_URL } from "@/lib/site";')
s=s.replace('metadataBase: new URL("https://engineering-digital-libraries.com")','metadataBase: new URL(SITE_URL)')
s=s.replace('default: "Engineering Digital Libraries | كل مصادر التعلم الهندسي في مكان واحد"','default: "SENSE | المكتبات الرقمية الهندسية"')
s=s.replace('template: "%s | Engineering Digital Libraries"','template: "%s | SENSE"')
s=s.replace('"Engineering Digital Libraries",','"SENSE",\n    "Engineering Digital Libraries",')
s=s.replace('publisher: "Engineering Digital Libraries"','publisher: "SENSE"')
s=s.replace('siteName: "Engineering Digital Libraries"','siteName: "SENSE"')
s=s.replace('title: "Engineering Digital Libraries — Your Engineering Knowledge Hub"','title: "SENSE — Your Engineering Knowledge Hub"')
s=s.replace('url: "https://engineering-digital-libraries.com"','url: SITE_URL')
s=s.replace('alt: "Engineering Digital Libraries — Your Engineering Knowledge Hub"','alt: "SENSE — Engineering Digital Libraries"')
s=s.replace('"Engineering Digital Libraries — Your Engineering Knowledge Hub"','"SENSE — Your Engineering Knowledge Hub"')
s=s.replace('name: "Sense Mechatronics"','name: "SENSE"')
write(p,s)

# Structured data schema uses the same central URL
p='src/components/JsonLd.tsx'; s=read(p)
s='import { SITE } from "@/lib/data";\nimport { SITE_URL } from "@/lib/site";\n\n'+s
s=s.replace('name: "Engineering Digital Libraries"','name: SITE.name')
s=s.replace('alternateName: ["المكتبات الرقمية الهندسية", "Sense Mechatronics Hub"]','alternateName: ["SENSE Engineering Digital Libraries", "المكتبات الرقمية الهندسية"]')
s=s.replace('url: "https://engineering-digital-libraries.com"','url: SITE_URL')
s=s.replace('logo: "https://engineering-digital-libraries.com/images/hero.jpg"','logo: `${SITE_URL}/images/hero.jpg`')
s=s.replace('telephone: "+20-106-972-4418",','telephone: SITE.phone || undefined,')
s=s.replace('email: "mahmoudalshahawi6@gmail.com",','email: SITE.email,')
s=s.replace('''    sameAs: [
      "https://facebook.com",
      "https://youtube.com",
      "https://linkedin.com",
      "https://instagram.com",
    ],''','''    sameAs: [],''')
s=s.replace('target: "https://engineering-digital-libraries.com/libraries?q={search_term_string}"','target: `${SITE_URL}/libraries?q={search_term_string}`')
s=s.replace('provider = "Sense Mechatronics"','provider = "SENSE"')
write(p,s)

# SEO routes
for p in ['src/app/sitemap.ts','src/app/robots.ts']:
    s=read(p)
    s=s.replace('import type { MetadataRoute } from "next";','import type { MetadataRoute } from "next";\nimport { SITE_URL } from "@/lib/site";')
    s=s.replace('const baseUrl = "https://engineering-digital-libraries.com";','const baseUrl = SITE_URL;')
    write(p,s)

# Footer remove fake generic social profiles and false accreditation/security claims; conditionally show contact info
p='src/components/Footer.tsx'; s=read(p)
s=re.sub(r'const socials = \[.*?\];\n\nexport default function Footer', 'const socials: { href: string; label: string; char: string }[] = [];\n\nexport default function Footer', s, flags=re.S)
s=s.replace('''          <div className="flex flex-wrap gap-2">
            {socials.map((s) => (''','''          {socials.length > 0 && <div className="flex flex-wrap gap-2">
            {socials.map((s) => (''')
s=s.replace('''            ))}
          </div>
        </div>''','''            ))}
          </div>}
        </div>''',1)
s=s.replace('''            <li className="pt-2 text-xs text-slate-400">
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-1.5 hover:text-cyan-300">
                <Mail size={13} className="text-cyan-400" />
                <span>{SITE.email}</span>
              </a>
            </li>
            <li className="text-xs text-slate-400">
              <a href={`tel:${SITE.phone}`} className="flex items-center gap-1.5 hover:text-cyan-300" dir="ltr">
                <Phone size={13} className="text-cyan-400" />
                <span>{SITE.phone}</span>
              </a>
            </li>''','''            {SITE.email && <li className="pt-2 text-xs text-slate-400">
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-1.5 hover:text-cyan-300">
                <Mail size={13} className="text-cyan-400" />
                <span>{SITE.email}</span>
              </a>
            </li>}
            {SITE.phone && <li className="text-xs text-slate-400">
              <a href={`tel:${SITE.phone}`} className="flex items-center gap-1.5 hover:text-cyan-300" dir="ltr">
                <Phone size={13} className="text-cyan-400" />
                <span>{SITE.phone}</span>
              </a>
            </li>}''')
s=s.replace('''          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <span className="text-cyan-300 font-bold block">✓ اعتماد هندسي رسمي</span>
            <span className="text-[10px] text-slate-400">منصة معتمدة برعاية Sense Mechatronics</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <span className="text-emerald-400 font-bold block">🔒 حماية وتشفير 256-Bit SSL</span>
            <span className="text-[10px] text-slate-400">اتصال آمن ومشفّر ضد الاختراق</span>
          </div>''','''          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <span className="text-cyan-300 font-bold block">✓ محتوى تعليمي منظم</span>
            <span className="text-[10px] text-slate-400">مكتبات رقمية مستقلة حسب التخصص</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <span className="text-emerald-400 font-bold block">🔒 وصول مرتبط بالحساب</span>
            <span className="text-[10px] text-slate-400">ملفات خاصة وصلاحيات للمشتركين</span>
          </div>''')
s=s.replace('''            OFFICIAL CERTIFIED PLATFORM · LIFETIME ACCESS · 256-BIT ENCRYPTED''','''            SENSE · LIFETIME LIBRARY ACCESS · SECURE MEMBER AREA''')
s=s.replace('تشغيل وإدارة علامة {SITE.brand} بإشراف المهندس محمود الشهاوي.','تشغيل وإدارة علامة {SITE.brand}.')
write(p,s)

# About page remove unsubstantiated subscriber/content statistics and sharpen wording
p='src/app/(site)/about/page.tsx'; s=read(p)
s=s.replace('title: "من نحن | Engineering Digital Libraries"','title: "من نحن | SENSE"')
s=s.replace('تُشغّلها علامة{ " " }','تُشغّلها علامة{ " " }')
s=s.replace('''          <div className="card-surface flex flex-col justify-center p-6 text-center">
              <p className="font-display text-3xl font-black text-cyan-300">{v}</p>
              <p className="mt-2 text-xs font-bold text-slate-300">{l}</p>
            </div>''','''          <div className="card-surface flex flex-col justify-center p-6 text-center">
              <p className="font-display text-3xl font-black text-cyan-300">{v}</p>
              <p className="mt-2 text-xs font-bold text-slate-300">{l}</p>
            </div>''')
s=s.replace('''          {[
            ["04", "مكتبات رقمية متخصصة"],
            ["+120", "ملف ودرس ومصدر"],
            ["3500+", "مشترك يستفيد من المحتوى"],
            ["24/7", "وصول دائم ومستمر"],
          ].map(([v, l]) => (''','''          {[
            ["04", "مسارات ومكتبات تخصصية"],
            ["مرة واحدة", "شراء بلا تجديد دوري"],
            ["مراجعة يدوية", "تأكيد الدفع قبل التفعيل"],
            ["حساب شخصي", "العودة للمحتوى في أي وقت"],
          ].map(([v, l]) => (''')
s=s.replace('استكشف المكتبات الأربعة المتاحة، شاهد فيديو المعاينة المجاني، ثم اشترك بدفعة واحدة.','استكشف المكتبات المنشورة، شاهد فيديو المعاينة المجاني، ثم اشترِ المكتبة المناسبة بدفعة واحدة.')
write(p,s)

# Contact page removes fake social handles; contact details conditional
p='src/app/(site)/contact/page.tsx'; s=read(p)
s=s.replace('title: "تواصل معنا | Engineering Digital Libraries"','title: "تواصل معنا | SENSE"')
s=re.sub(r'const socials = \[.*?\];\n\nexport default async function ContactPage', 'const socials: { label: string; href: string; handle: string }[] = [];\n\nexport default async function ContactPage', s, flags=re.S)
s=s.replace('''              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <Mail size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">البريد الإلكتروني</span>
                  <a href={`mailto:${SITE.email}`} className="font-bold text-white hover:text-cyan-300" dir="ltr">
                    {SITE.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <Phone size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">الموبايل والواتساب</span>
                  <a href={`tel:${SITE.phone}`} className="font-bold text-white hover:text-cyan-300" dir="ltr">
                    {SITE.phone}
                  </a>
                </div>
              </div>''','''              {SITE.email && <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <Mail size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">البريد الإلكتروني</span>
                  <a href={`mailto:${SITE.email}`} className="font-bold text-white hover:text-cyan-300" dir="ltr">{SITE.email}</a>
                </div>
              </div>}

              {SITE.phone && <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <Phone size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">الموبايل والواتساب</span>
                  <a href={`tel:${SITE.phone}`} className="font-bold text-white hover:text-cyan-300" dir="ltr">{SITE.phone}</a>
                </div>
              </div>}''')
s=s.replace('''              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <MapPin size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">المقر</span>
                  <span className="font-bold text-white">{SITE.address}</span>
                </div>
              </div>''','''              {SITE.address && <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <MapPin size={16} className="mt-0.5 text-cyan-300 shrink-0" />
                <div>
                  <span className="text-[11px] text-slate-400 block">المقر</span>
                  <span className="font-bold text-white">{SITE.address}</span>
                </div>
              </div>}''')
s=s.replace('''          <div className="card-surface p-6">
            <h3 className="font-display text-base font-extrabold text-white">منصات التواصل</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">''','''          {socials.length > 0 && <div className="card-surface p-6">
            <h3 className="font-display text-base font-extrabold text-white">منصات التواصل</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">''')
s=s.replace('''            </div>
          </div>
        </div>
      </div>
    </div>
  );
}''','''            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}''')
write(p,s)

# Homepage remove hardcoded prices/payment details/accreditation and use SENSE branding
p='src/app/(site)/page.tsx'; s=read(p)
s=s.replace('edl / my-libraries','sense / my-libraries')
s=s.replace('''              <p className="font-display mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">٤٩٠ ج.م</p>
              <p className="text-[11px] text-slate-400">دفعة واحدة — بلا تجديد</p>''','''              <p className="font-display mt-2 text-lg font-black text-emerald-400 sm:text-xl">أسعار واضحة</p>
              <p className="text-[11px] text-slate-400">تظهر في صفحة كل مكتبة بعد نشرها</p>''')
start=s.find('        {/* Right card: Official payment info */}')
end=s.find('      </section>', start)
if start!=-1 and end!=-1:
    replacement='''        {/* Right card: payment workflow */}
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

'''
    s=s[:start]+replacement+s[end+len('      </section>'):]
s=s.replace('دعم مباشر عبر mahmoudalshahawi6@gmail.com · 01069724418 · القاهرة، مصر','تواصل مع فريق SENSE من صفحة التواصل لإرسال استفسارك.')
s=s.replace('OFFICIAL ACCREDITATION &amp; SECURITY','MEMBER ACCESS &amp; CONTENT PROTECTION')
write(p,s)

# Libraries page dynamic stats and sensible empty-state/discount handling
p='src/app/(site)/libraries/page.tsx'; s=read(p)
s=s.replace('import { getLibraries, egp, SITE } from "@/lib/data";','import { getLibraries, getSections, getResources, egp, SITE } from "@/lib/data";')
start=s.find('const libraryStats:')
end=s.find('\n\nexport default async function LibrariesPage', start)
if start!=-1 and end!=-1:
    s=s[:start]+s[end+2:]
s=s.replace('''  const libraries = await getLibraries({ publishedOnly: true });

  return (''','''  const libraries = await getLibraries({ publishedOnly: true });
  const libraryStats = await Promise.all(libraries.map(async (lib) => {
    const [sections, resources] = await Promise.all([getSections(lib.id), getResources(lib.id)]);
    return { id: lib.id, sections: sections.length, items: resources.filter((r) => r.published).length };
  }));

  return (''')
s=s.replace('''      {/* Grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {libraries.map((lib) => {''','''      {/* Grid */}
      {libraries.length === 0 ? (
        <div className="card-surface mt-8 p-10 text-center">
          <p className="text-4xl">📚</p>
          <h2 className="mt-4 text-xl font-extrabold text-white">المكتبات قيد التجهيز</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-300">نعمل على مراجعة المحتوى والأسعار وفيديوهات المعاينة قبل نشر المكتبات. ارجع قريبًا للاطلاع على المكتبات المتاحة.</p>
          <Link href="/contact" className="btn-ghost mt-5 text-xs">تواصل معنا</Link>
        </div>
      ) : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {libraries.map((lib) => {''')
s=s.replace('''          const stats = libraryStats[lib.slug] || { sections: 12, items: 25 };
          const discountPercent =
            lib.discountValue && lib.priceValue
              ? Math.round(((lib.priceValue - lib.discountValue) / lib.priceValue) * 100)
              : 25;''','''          const stats = libraryStats.find((item) => item.id === lib.id) || { sections: 0, items: 0 };
          const discountPercent =
            lib.discountValue !== null && lib.priceValue > 0 && lib.discountValue > 0 && lib.discountValue < lib.priceValue
              ? Math.round(((lib.priceValue - lib.discountValue) / lib.priceValue) * 100)
              : 0;''')
s=s.replace('''                    <span className="font-display text-xl font-extrabold text-white">
                      {egp(lib.finalPrice)} ج.م
                    </span>''','''                    <span className="font-display text-xl font-extrabold text-white">
                      {lib.finalPrice > 0 ? `${egp(lib.finalPrice)} ج.م` : "السعر قريبًا"}
                    </span>''')
s=s.replace('''        })}
      </div>

      {/* Help box */}''','''        })}
      </div>}

      {/* Help box */}''')
write(p,s)

# Admin: new libraries default hidden; prevent publishing without real price and preview video
p='src/app/admin/libraries/[id]/page.tsx'; s=read(p)
s=s.replace('defaultChecked={lib?.published ?? true}', 'defaultChecked={lib?.published ?? false}')
write(p,s)
p='src/app/actions.ts'; s=read(p)
s=s.replace('''  if (!slug || !titleAr || !titleEn) fail("/admin/libraries", "الاسم والرابط مطلوبان.");

  const cover''','''  if (!slug || !titleAr || !titleEn) fail("/admin/libraries", "الاسم والرابط مطلوبان.");
  const priceValue = Number(price);
  const discountValue = discountPrice ? Number(discountPrice) : null;
  if (!Number.isFinite(priceValue) || priceValue < 0) fail("/admin/libraries", "أدخل سعرًا صحيحًا.");
  if (discountValue !== null && (!Number.isFinite(discountValue) || discountValue < 0 || discountValue >= priceValue)) {
    fail("/admin/libraries", "سعر الخصم يجب أن يكون أقل من السعر الأساسي.");
  }
  if (published && priceValue <= 0) fail("/admin/libraries", "لا يمكن نشر مكتبة قبل تحديد سعر صحيح.");
  if (published && !/^https?:\\/\\//i.test(videoUrl)) fail("/admin/libraries", "أضف رابط فيديو المعاينة المجاني قبل نشر المكتبة.");

  const cover''')
# Avoid accepting arbitrary off-site file URL as preview? Only URL protocol checked; YouTube URL in field. fine.
write(p,s)

# Header label
p='src/components/Header.tsx'; s=read(p).replace('aria-label="Engineering Digital Libraries"','aria-label="SENSE Engineering Digital Libraries"'); write(p,s)

# Default admin manager upsert should reset supplied password when email already exists; remove default DB fallback
p='scripts/manage-admin.mjs'; s=read(p)
s=s.replace('''const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const pool = new pg.Pool({ connectionString: DATABASE_URL });''','''const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL غير مضبوط. أضفه إلى متغيرات البيئة أولًا.");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined });''')
s=s.replace('''     values ($1,$2,$3,'admin','active',true,5)
     on conflict (email) do update set role='admin', status='active'
     returning id, name, email, role`,
    [name, email.toLowerCase(), hashPassword(password)]''','''     values ($1,$2,$3,'admin','active',true,5)
     on conflict (email) do update set name=excluded.name, password_hash=excluded.password_hash,
       role='admin', status='active', email_verified=true
     returning id, name, email, role`,
    [name, email.toLowerCase(), hashPassword(password)]''')
write(p,s)

# Rebrand hardcoded page metadata/title fragments without altering descriptive product names
for p in root.glob('src/app/**/*.tsx'):
    s=p.read_text(encoding='utf-8')
    s=s.replace('| Engineering Digital Libraries','| SENSE')
    s=s.replace('Engineering Digital Libraries | كل مصادر التعلم الهندسي في مكان واحد','SENSE | كل مصادر التعلم الهندسي في مكان واحد')
    p.write_text(s,encoding='utf-8')
