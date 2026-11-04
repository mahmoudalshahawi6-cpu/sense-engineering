"use client";

import { useMemo, useState } from "react";
import {
  Search,
  FileText,
  Video,
  Link2,
  FileBox,
  ChevronLeft,
  CheckCircle2,
  Lock,
  ExternalLink,
  Menu,
} from "lucide-react";
import { saveProgressAction } from "@/app/actions";
import { LogoMark } from "@/components/Logo";

export type ReaderResource = {
  id: number;
  title: string;
  kind: string;
  description: string;
  content: string;
  externalUrl: string | null;
  duration: string;
  isFree: boolean;
  hasFile: boolean;
  key: string;
};

export type ReaderSection = {
  id: number;
  code: string;
  title: string;
  description: string;
  resources: ReaderResource[];
};

const kindLabel: Record<string, string> = {
  document: "مستند",
  video: "فيديو",
  link: "رابط",
  file: "ملف",
};

const kindIcon: Record<string, typeof FileText> = {
  document: FileText,
  video: Video,
  link: Link2,
  file: FileBox,
};

export default function Reader({
  library,
  sections,
  user,
  initialResourceId,
  completedIds,
}: {
  library: { id: number; slug: string; titleAr: string; titleEn: string };
  sections: ReaderSection[];
  user: { id: number; email: string; name: string };
  initialResourceId: number | null;
  completedIds: number[];
}) {
  const all = useMemo(() => sections.flatMap((s) => s.resources), [sections]);
  const [activeId, setActiveId] = useState<number>(
    initialResourceId && all.some((r) => r.id === initialResourceId)
      ? initialResourceId
      : (all[0]?.id ?? 0)
  );
  const [query, setQuery] = useState("");
  const [done, setDone] = useState<number[]>(completedIds);
  const [railOpen, setRailOpen] = useState(false);
  const [fileKeys, setFileKeys] = useState<Record<number, string>>(() =>
    Object.fromEntries(all.filter((resource) => resource.key).map((resource) => [resource.id, resource.key]))
  );
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState("");

  const active = all.find((r) => r.id === activeId) ?? all[0];
  const activeSection = sections.find((s) => s.resources.some((r) => r.id === active?.id));

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        resources: s.resources.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            s.title.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.resources.length > 0);
  }, [sections, query]);

  async function open(resourceId: number) {
    const resource = all.find((item) => item.id === resourceId);
    setActiveId(resourceId);
    setRailOpen(false);
    setFileError("");
    void saveProgressAction({ libraryId: library.id, resourceId });

    if (resource?.kind === "file" && resource.hasFile) {
      setLoadingFile(true);
      try {
        const response = await fetch(`/api/content/${resourceId}/key`, { cache: "no-store" });
        if (!response.ok) throw new Error("تعذر التحقق من صلاحية فتح الملف.");
        const payload = (await response.json()) as { key?: string };
        if (!payload.key) throw new Error("تعذر إنشاء رابط عرض آمن للملف.");
        setFileKeys((current) => ({ ...current, [resourceId]: payload.key! }));
      } catch (error) {
        setFileError(error instanceof Error ? error.message : "تعذر فتح الملف. حاول تسجيل الدخول مرة أخرى.");
      } finally {
        setLoadingFile(false);
      }
    }
  }

  function markComplete(resourceId: number) {
    setDone((prev) => (prev.includes(resourceId) ? prev : [...prev, resourceId]));
    void saveProgressAction({ libraryId: library.id, resourceId, completed: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-950 text-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1500px] items-center gap-4 px-4 lg:px-7">
          <a href="/" aria-label="الصفحة الرئيسية" className="shrink-0 flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 p-1">
              <LogoMark size={28} />
            </span>
          </a>
          <div className="min-w-0 flex-1">
            <p className="font-tech truncate text-[11px] tracking-wider text-cyan-300">
              {library.titleEn.toUpperCase()}
            </p>
            <h1 className="font-display truncate text-sm sm:text-base font-extrabold text-white">
              {library.titleAr}
            </h1>
          </div>

          <div className="relative hidden w-[320px] max-w-[38vw] items-center md:flex">
            <Search size={15} className="absolute right-3 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث داخل محتوى المكتبة…"
              className="field !py-2 ps-3 pe-8 text-xs"
            />
          </div>

          <a
            href="/account"
            className="btn-ghost hidden items-center gap-1.5 !py-2 !px-3 text-xs sm:inline-flex"
          >
            حسابي
            <ChevronLeft size={14} />
          </a>

          <button
            type="button"
            onClick={() => setRailOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-cyan-300 lg:hidden"
            aria-label="فهرس الأقسام"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1500px] flex-1 items-stretch">
        {/* Index Rail Sidebar */}
        <aside
          className={`${
            railOpen ? "block" : "hidden"
          } w-full shrink-0 border-s border-white/10 bg-navy-900/60 lg:block lg:w-[320px]`}
        >
          <div className="sticky top-[68px] max-h-[calc(100vh-68px)] overflow-y-auto px-5 py-6">
            <div className="relative mb-5 flex items-center md:hidden">
              <Search size={15} className="absolute right-3 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث داخل المكتبة…"
                className="field !py-2 ps-3 pe-8 text-xs"
              />
            </div>

            <span className="chip text-[11px] mb-2">INDEX · فهرس الأقسام</span>

            <nav className="mt-4 space-y-5">
              {filteredSections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-tech text-xs text-cyan-300">{section.code}</span>
                    <h2 className="font-display text-xs font-bold text-white leading-5">
                      {section.title}
                    </h2>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {section.resources.map((r) => {
                      const Icon = kindIcon[r.kind] ?? FileText;
                      const isActive = r.id === active?.id;
                      return (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => open(r.id)}
                            className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-start text-xs transition ${
                              isActive
                                ? "bg-cyan-400/15 text-cyan-200 border border-cyan-400/30 font-bold"
                                : "text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            <Icon
                              size={14}
                              className={`mt-0.5 shrink-0 ${isActive ? "text-cyan-300" : "text-slate-400"}`}
                            />
                            <span className="flex-1 leading-5">{r.title}</span>
                            {done.includes(r.id) && (
                              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-cyan-400" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {filteredSections.length === 0 && (
                <p className="text-xs leading-6 text-slate-400">
                  لا توجد نتائج مطابقة لبحثك. جرّب كلمة أخرى.
                </p>
              )}
            </nav>
          </div>
        </aside>

        {/* Content Pane */}
        <main className="min-w-0 flex-1 p-4 lg:p-8">
          {active ? (
            <article className="card-surface relative mx-auto max-w-[900px] p-6 sm:p-10">
              {/* Watermark layer */}
              <div className="watermark-layer" aria-hidden>
                <LogoMark className="absolute inset-0 m-auto h-[240px] w-[240px] opacity-40" />
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      top: `${(i % 4) * 25 + 5}%`,
                      right: `${Math.floor(i / 4) * 34 + 2}%`,
                    }}
                  >
                    {user.email} · #{String(user.id).padStart(5, "0")}
                  </span>
                ))}
              </div>

              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-tech text-xs text-cyan-300 font-bold">
                    {activeSection?.code ?? "—"}
                  </span>
                  <span className="chip text-[10px]">
                    {kindLabel[active.kind] ?? active.kind}
                  </span>
                  {active.duration && (
                    <span className="font-tech text-[11px] text-slate-400">{active.duration}</span>
                  )}
                </div>

                <h2 className="font-display mt-3 text-xl sm:text-2xl font-extrabold text-white">
                  {active.title}
                </h2>

                {active.description && (
                  <p className="mt-3 text-sm leading-7 text-slate-300">{active.description}</p>
                )}

                <div className="mt-6">
                  {active.kind === "document" && (
                    <div className="rounded-2xl border border-white/10 bg-navy-950/70 p-6 sm:p-8">
                      {active.content ? (
                        <div className="space-y-4">
                          {active.content.split(/\n{2,}/).map((para, i) => (
                            <p key={i} className="text-sm leading-8 text-slate-200">
                              {para}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">لا يوجد محتوى نصي لهذا الدرس.</p>
                      )}
                    </div>
                  )}

                  {active.kind === "video" && active.externalUrl && (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy-950">
                      <div className="relative aspect-video w-full">
                        <iframe
                          src={active.externalUrl.replace(/(?:youtu\.be\/|v=)([\w-]{6,})/, (_m, id) =>
                            `https://www.youtube.com/embed/${id}`
                          )}
                          title={active.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    </div>
                  )}

                  {active.kind === "link" && (
                    <div className="rounded-2xl border border-white/10 bg-navy-950/70 p-6">
                      <p className="text-sm leading-7 text-slate-300">
                        هذا العنصر يشير إلى موقع أو رابط رسمي خارجي لتحميل البرامج أو المراجع.
                      </p>
                      <a
                        href={active.externalUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary mt-4 text-xs"
                      >
                        <ExternalLink size={14} />
                        فتح الرابط الرسمي
                      </a>
                    </div>
                  )}

                  {active.kind === "file" && (
                    <div>
                      {loadingFile ? (
                        <div className="rounded-2xl border border-white/10 bg-navy-950/70 p-8 text-center text-sm text-slate-300">
                          جارٍ التحقق من صلاحية عرض الملف…
                        </div>
                      ) : active.hasFile && fileKeys[active.id] ? (
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950">
                          <iframe
                            src={`/api/content/${active.id}?k=${fileKeys[active.id]}#toolbar=0&navpanes=0&scrollbar=0`}
                            title={active.title}
                            className="h-[68vh] w-full"
                          />
                        </div>
                      ) : active.hasFile ? (
                        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-6 text-sm text-rose-200">
                          {fileError || "تعذر تجهيز الملف. حاول اختيار العنصر مرة أخرى."}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-navy-950/70 p-6">
                          <p className="text-xs text-slate-400">
                            الملف مرفوع على التخزين الخاص ويمكن إدارته من لوحة التحكم.
                          </p>
                        </div>
                      )}
                      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Lock size={12} className="text-cyan-300" />
                        الملف محمي برابط مؤقت وعلامة مائية باسم حسابك.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => markComplete(active.id)}
                    disabled={done.includes(active.id)}
                    className="btn-primary text-xs"
                  >
                    <CheckCircle2 size={15} />
                    {done.includes(active.id) ? "تمت دراسة هذا العنصر" : "وضع علامة كمكتمل"}
                  </button>
                  <a href={`/library/${library.slug}`} className="btn-ghost text-xs">
                    صفحة المكتبة
                  </a>
                  <span className="font-tech text-xs text-slate-400 ms-auto">
                    {done.length} / {all.length} مكتمل
                  </span>
                </div>
              </div>
            </article>
          ) : (
            <div className="p-12 text-center text-sm text-slate-400">
              لا يوجد محتوى في هذه المكتبة حاليًا.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
