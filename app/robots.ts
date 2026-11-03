import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/libraries",
          "/library/*",
          "/about",
          "/contact",
          "/faq",
          "/privacy",
          "/terms",
          "/refund",
          "/login",
          "/register",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/account",
          "/account/*",
          "/learn/*",
          "/api/*",
          "/forgot-password",
          "/reset-password",
          "/verify",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/libraries",
          "/library/*",
          "/about",
          "/contact",
          "/faq",
          "/privacy",
          "/terms",
          "/refund",
        ],
        disallow: [
          "/admin/*",
          "/account/*",
          "/learn/*",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
