import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getCurrentUser, signContentKey } from "@/lib/auth";
import { getLibraryBySlug, getLibraryContent, getProgress, isEntitled } from "@/lib/data";
import Reader, { type ReaderSection } from "@/components/Reader";

export const dynamic = "force-dynamic";
export const metadata = { title: "المكتبة المشتراة | SENSE" };

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/learn/${(await params).slug}`);

  const { slug } = await params;
  const lib = await getLibraryBySlug(slug);
  if (!lib) redirect("/libraries");

  const entitled = await isEntitled(user.id, lib.id);

  if (!entitled) {
    return (
      <section className="relative flex min-h-screen items-center justify-center bg-navy-950 px-4 py-20 text-white">
        <div className="absolute inset-0 -z-10 blueprint-bg opacity-40" />
        <div className="card-surface relative max-w-lg p-8 sm:p-12 text-center space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
            <Lock size={28} />
          </div>
          <h1 className="font-display text-2xl font-black text-white">
            هذا المحتوى متاح للمشتركين فقط
          </h1>
          <p className="text-sm leading-7 text-slate-300">
            حسابك لا يملك صلاحية الوصول إلى «{lib.titleAr}». اشترِ المكتبة لتفعيل الوصول الدائم إلى كل ملفاتها ودروسها عبر حسابك.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 pt-2">
            <Link href={`/library/${lib.slug}#buy`} className="btn-primary text-xs">
              شراء المكتبة الآن
            </Link>
            <Link href="/account" className="btn-ghost text-xs">
              العودة إلى حسابي
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const [content, prog] = await Promise.all([
    getLibraryContent(lib.id),
    getProgress(user.id, lib.id),
  ]);

  const sections: ReaderSection[] = content.map((s) => ({
    id: s.id,
    code: s.code,
    title: s.title,
    description: s.description,
    resources: s.resources
      .filter((r) => r.published)
      .map((r) => ({
        id: r.id,
        title: r.title,
        kind: r.kind,
        description: r.description,
        content: r.content,
        externalUrl: r.externalUrl,
        duration: r.duration,
        isFree: r.isFree,
        hasFile: !!r.filePath,
        key: signContentKey(r.id, user.id),
      })),
  }));

  return (
    <Reader
      library={{ id: lib.id, slug: lib.slug, titleAr: lib.titleAr, titleEn: lib.titleEn }}
      sections={sections}
      user={{ id: user.id, email: user.email, name: user.name }}
      initialResourceId={prog?.resourceId ?? null}
      completedIds={prog?.completedIds ?? []}
    />
  );
}
