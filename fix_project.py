from pathlib import Path
import re
root=Path('/mnt/data/sense_work')
def read(p): return (root/p).read_text(encoding='utf-8')
def write(p,s): (root/p).write_text(s,encoding='utf-8')

# Clean root metadata block after prior broad replacements.
write('src/app/layout.tsx', '''import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SENSE | المكتبات الرقمية الهندسية",
    template: "%s | SENSE",
  },
  description:
    "SENSE منصة للمكتبات الرقمية الهندسية في الميكاترونكس والميكانيكا والكهرباء والبرمجة. كورسات ومراجع وبرامج ومشروعات ومسارات تعلم منظمة — شراء مرة واحدة ووصول دائم.",
  keywords: [
    "SENSE",
    "مكتبة هندسية رقمية",
    "مكتبة ميكاترونكس",
    "هندسة ميكانيكية",
    "هندسة كهربائية",
    "تعلم البرمجة",
    "كورسات هندسية",
    "كتب ومراجع هندسية",
    "برامج هندسية",
    "Engineering Digital Libraries",
  ],
  authors: [{ name: "SENSE" }],
  creator: "SENSE",
  publisher: "SENSE",
  formatDetection: { telephone: true, email: true },
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "SENSE",
    title: "SENSE — Your Engineering Knowledge Hub",
    description:
      "مكتبات رقمية متخصصة لطلاب وخريجي الهندسة، مع فيديو معاينة مجاني وشراء مرة واحدة ووصول دائم بعد تأكيد الدفع.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/images/hero.jpg`,
        width: 1200,
        height: 627,
        alt: "SENSE — Engineering Digital Libraries",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SENSE — Your Engineering Knowledge Hub",
    description:
      "مكتبات هندسية رقمية في الميكاترونكس والميكانيكا والكهرباء والبرمجة.",
    images: [`${SITE_URL}/images/hero.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@500;700;800;900&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#050d1b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-navy-950 text-slate-100 antialiased font-body">
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_45%_at_85%_-5%,rgba(34,211,238,0.14),transparent_60%),radial-gradient(45%_40%_at_5%_10%,rgba(43,127,255,0.16),transparent_60%)]" />
        {children}
      </body>
    </html>
  );
}
''')

# Remove duplicate home trust section that remained after the first rewrite.
p='src/app/(site)/page.tsx'; s=read(p)
start=s.find('      {/* ----------------- ACCREDITATION & SECURITY TRUST SECTION ----------------- */}')
end=s.find('      {/* ----------------- FAQ SECTION ----------------- */}', start)
if start!=-1 and end!=-1:
    s=s[:start]+s[end:]
# Remove illustrative mock stats that could look like real platform counts.
s=s.replace('<p className="text-[10px] text-slate-400">15 ملف</p>','<p className="text-[10px] text-slate-400">مسار صناعي</p>')
s=s.replace('<p className="text-[10px] text-slate-400">12 ملف</p>','<p className="text-[10px] text-slate-400">تطبيقات عملية</p>')
s=s.replace('<p className="text-[10px] text-slate-400">9 ملفات</p>','<p className="text-[10px] text-slate-400">تصميم ثلاثي الأبعاد</p>')
s=s.replace('<span className="text-slate-400">تقدمك 68%</span>','<span className="text-slate-400">آخر درس وصلت إليه</span>')
s=s.replace('style={{ width: "68%" }}','style={{ width: "46%" }}')
s=s.replace('<p className="font-display mt-2 text-2xl font-black text-cyan-300 sm:text-3xl">+120</p>','<p className="font-display mt-2 text-2xl font-black text-cyan-300 sm:text-3xl">منظم</p>')
s=s.replace('<p className="text-[11px] text-slate-400">محتوى قابل للتحديث دائمًا</p>','<p className="text-[11px] text-slate-400">ملفات ومصادر حسب التخصص</p>')
s=s.replace('<p className="font-display mt-2 text-2xl font-black text-white sm:text-3xl">46</p>','<p className="font-display mt-2 text-2xl font-black text-white sm:text-3xl">13</p>')
s=s.replace('<p className="text-[11px] text-slate-400">فهرس مرقّم لكل تخصص</p>','<p className="text-[11px] text-slate-400">مجلدات رئيسية في المكتبة الواحدة</p>')
write(p,s)

# Update library metadata canonical urls to configured URL and remove hardcoded phone.
p='src/app/(site)/library/[slug]/page.tsx'; s=read(p)
s=s.replace('import { getCurrentUser } from "@/lib/auth";','import { getCurrentUser } from "@/lib/auth";\nimport { SITE_URL } from "@/lib/site";\nimport { SITE } from "@/lib/data";')
s=s.replace('`https://engineering-digital-libraries.com/library/${lib.slug}`','`${SITE_URL}/library/${lib.slug}`')
s=s.replace('''                تواصل مباشرة عبر واتساب 01069724418 أو عبر نموذج التواصل لأي استفسار تقني أو بخصوص الدفع.''','''                تواصل مع فريق SENSE عبر نموذج التواصل لأي استفسار تقني أو بخصوص الدفع.''')
write(p,s)

# Remove old fixed company contact references from any remaining visible site code.
for p in [Path('src/app/(site)/page.tsx'), Path('src/app/(site)/library/[slug]/page.tsx')]:
    s=read(str(p))
    s=s.replace('mahmoudalshahawi6@gmail.com · 01069724418 · القاهرة، مصر','استخدم صفحة التواصل لإرسال استفسارك إلى فريق SENSE.')
    s=s.replace('واتساب 01069724418 أو','نموذج التواصل أو')
    write(str(p),s)

# JSON-LD sameAs and hardcoded old URL correction.
p='src/components/JsonLd.tsx'; s=read(p).replace('sameAs: "https://engineering-digital-libraries.com",','sameAs: SITE_URL,')
s=s.replace('المنصة الهندسية الرقمية المعتمدة لطلاب وخريجي الهندسة','منصة تعليمية رقمية لطلاب وخريجي الهندسة')
write(p,s)

# Library details: ensure paid library requires a price and preview video before publication (action handles too).
p='src/app/admin/libraries/[id]/page.tsx'; s=read(p)
s=s.replace('''          <div className="md:col-span-2">
            <label className="field-label">رابط فيديو المعاينة المجاني (YouTube)</label>''','''          <div className="md:col-span-2">
            <label className="field-label">رابط فيديو المعاينة المجاني (YouTube)</label>''')
s=s.replace('''              <input type="checkbox" name="published" defaultChecked={lib?.published ?? false} className="h-4 w-4 accent-cyan-400" />
              منشورة''','''              <input type="checkbox" name="published" defaultChecked={lib?.published ?? false} className="h-4 w-4 accent-cyan-400" />
              منشورة (تأكد من السعر وفيديو المعاينة قبل النشر)''')
write(p,s)

# Update app/site URLs in contact/footer etc are centrally configured.
