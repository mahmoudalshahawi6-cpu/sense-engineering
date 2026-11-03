import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { db } from "@/db";
import { libraries } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  // Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/libraries`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic libraries pages
  try {
    const publishedLibs = await db
      .select({ slug: libraries.slug, createdAt: libraries.createdAt })
      .from(libraries)
      .where(eq(libraries.published, true));

    const libraryRoutes: MetadataRoute.Sitemap = publishedLibs.map((lib) => ({
      url: `${baseUrl}/library/${lib.slug}`,
      lastModified: lib.createdAt ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    }));

    return [...staticRoutes, ...libraryRoutes];
  } catch {
    return staticRoutes;
  }
}
