import { asc, eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  entitlements,
  libraries,
  paymentSettings,
  progress,
  resources,
  sections,
  type Library,
} from "@/db/schema";

export type LibraryWithMeta = Library & { priceValue: number; discountValue: number | null; finalPrice: number };

export function withPrices(lib: Library): LibraryWithMeta {
  const priceValue = Number(lib.price ?? 0);
  const discountValue = lib.discountPrice === null ? null : Number(lib.discountPrice);
  return {
    ...lib,
    priceValue,
    discountValue,
    finalPrice: discountValue !== null && discountValue > 0 ? discountValue : priceValue,
  };
}

export async function getLibraries(opts: { publishedOnly?: boolean } = {}): Promise<LibraryWithMeta[]> {
  const rows = await db
    .select()
    .from(libraries)
    .where(opts.publishedOnly ? eq(libraries.published, true) : undefined)
    .orderBy(asc(libraries.sortOrder), asc(libraries.id));
  return rows.map(withPrices);
}

export async function getLibraryBySlug(
  slug: string,
  opts: { publishedOnly?: boolean } = {}
): Promise<LibraryWithMeta | null> {
  const rows = await db
    .select()
    .from(libraries)
    .where(
      opts.publishedOnly
        ? and(eq(libraries.slug, slug), eq(libraries.published, true))
        : eq(libraries.slug, slug)
    )
    .limit(1);
  return rows[0] ? withPrices(rows[0]) : null;
}

export async function getSections(libraryId: number) {
  return db
    .select()
    .from(sections)
    .where(eq(sections.libraryId, libraryId))
    .orderBy(asc(sections.sortOrder), asc(sections.id));
}

export async function getResources(libraryId: number) {
  return db
    .select()
    .from(resources)
    .where(eq(resources.libraryId, libraryId))
    .orderBy(asc(resources.sortOrder), asc(resources.id));
}

export async function getLibraryContent(libraryId: number) {
  const [secs, res] = await Promise.all([getSections(libraryId), getResources(libraryId)]);
  return secs.map((s) => ({
    ...s,
    resources: res.filter((r) => r.sectionId === s.id),
  }));
}

export async function getEntitledLibraryIds(userId: number): Promise<number[]> {
  const rows = await db
    .select({ libraryId: entitlements.libraryId })
    .from(entitlements)
    .where(eq(entitlements.userId, userId));
  return rows.map((r) => r.libraryId);
}

export async function isEntitled(userId: number, libraryId: number): Promise<boolean> {
  const rows = await db
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(and(eq(entitlements.userId, userId), eq(entitlements.libraryId, libraryId)))
    .limit(1);
  return rows.length > 0;
}

export async function getPaymentSettings(): Promise<Record<string, { label: string; value: string }>> {
  const rows = await db.select().from(paymentSettings);
  const map: Record<string, { label: string; value: string }> = {};
  for (const r of rows) map[r.key] = { label: r.label, value: r.value };
  return map;
}

export async function getProgress(userId: number, libraryId: number) {
  const rows = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.libraryId, libraryId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLibrariesByIds(ids: number[]): Promise<LibraryWithMeta[]> {
  if (!ids.length) return [];
  const rows = await db.select().from(libraries).where(inArray(libraries.id, ids));
  return rows.map(withPrices);
}

export function egp(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export const SITE = {
  name: "SENSE",
  nameAr: "سينس — المكتبات الرقمية الهندسية",
  fullName: "SENSE Engineering Digital Libraries",
  slogan: "Your Engineering Knowledge Hub",
  sloganAr: "وجهتك للمعرفة الهندسية",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
  brand: "SENSE",
};
