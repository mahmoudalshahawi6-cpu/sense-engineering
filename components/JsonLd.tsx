import { SITE } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE.name,
    alternateName: ["SENSE Engineering Digital Libraries", "المكتبات الرقمية الهندسية"],
    url: SITE_URL,
    logo: `${SITE_URL}/images/hero.jpg`,
    description:
      "منصة تعليمية رقمية لطلاب وخريجي الهندسة: كورسات، كتب ومراجع، برامج هندسية، مشروعات عملية ومسارات تعلم منظمة.",
    ...(SITE.address
      ? { address: { "@type": "PostalAddress", addressCountry: "EG", addressLocality: SITE.address } }
      : {}),
    contactPoint: {
      "@type": "ContactPoint",
      ...(SITE.phone ? { telephone: SITE.phone } : {}),
      contactType: "customer support",
      ...(SITE.email ? { email: SITE.email } : {}),
      areaServed: ["EG"],
      availableLanguage: ["Arabic", "English"],
    },
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE_URL,
    inLanguage: "ar-EG",
    description: "كل مصادر التعلم الهندسي في مكان واحد — Your Engineering Knowledge Hub",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/libraries?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function CourseJsonLd({
  title,
  description,
  price,
  url,
  provider = "SENSE",
}: {
  title: string;
  description: string;
  price: number;
  url: string;
  provider?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: title,
    description: description,
    provider: {
      "@type": "EducationalOrganization",
      name: provider,
      sameAs: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      category: "Paid",
      price: price,
      priceCurrency: "EGP",
      availability: "https://schema.org/InStock",
      url: url,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      inLanguage: "ar",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FaqJsonLd({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
