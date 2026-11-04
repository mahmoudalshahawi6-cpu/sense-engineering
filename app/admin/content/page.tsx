import { asc } from "drizzle-orm";
import { db } from "@/db";
import { libraries, resources, sections } from "@/db/schema";
import { directUploadsAreConfigured } from "@/lib/storage";
import LibraryUploader from "@/components/admin/LibraryUploader";

export const dynamic = "force-dynamic";
export const metadata = { title: "رفع الملفات | لوحة التحكم" };

export default async function AdminContentPage() {
  const [libraryRows, sectionRows, resourceRows] = await Promise.all([
    db.select().from(libraries).orderBy(asc(libraries.sortOrder), asc(libraries.id)),
    db.select().from(sections).orderBy(asc(sections.sortOrder), asc(sections.id)),
    db.select().from(resources).orderBy(asc(resources.sortOrder), asc(resources.id)),
  ]);

  const data = libraryRows.map((library) => ({
    id: library.id,
    slug: library.slug,
    titleAr: library.titleAr,
    sections: sectionRows.filter((section) => section.libraryId === library.id).map((section) => ({
      id: section.id, code: section.code, title: section.title,
    })),
    resources: resourceRows.filter((resource) => resource.libraryId === library.id).map((resource) => ({
      id: resource.id, title: resource.title, fileName: resource.fileName,
      published: resource.published, isFree: resource.isFree, sectionId: resource.sectionId,
    })),
  }));

  return <LibraryUploader libraries={data} supabaseReady={directUploadsAreConfigured()} />;
}
