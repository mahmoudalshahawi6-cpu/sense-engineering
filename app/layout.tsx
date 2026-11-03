import type { Metadata } from "next";
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
