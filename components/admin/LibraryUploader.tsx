"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Film, Image as ImageIcon, LoaderCircle, CheckCircle2, AlertCircle, ExternalLink, FolderPlus } from "lucide-react";

type SectionOption = { id: number; code: string; title: string };
type ResourceOption = { id: number; title: string; fileName: string | null; published: boolean; isFree: boolean; sectionId: number };
type LibraryOption = { id: number; slug: string; titleAr: string; sections: SectionOption[]; resources: ResourceOption[] };
type UploadStatus = "ready" | "uploading" | "done" | "error";
type LocalFile = { id: string; file: File; status: UploadStatus; message?: string };

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.mp4,.webm,.txt,.md";
const MAX_SIZE = 50 * 1024 * 1024;

function readableSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(file: File) {
  if (file.type.startsWith("video/")) return Film;
  if (file.type.startsWith("image/")) return ImageIcon;
  return FileText;
}

export default function LibraryUploader({ libraries, supabaseReady }: { libraries: LibraryOption[]; supabaseReady: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [libraryId, setLibraryId] = useState(libraries[0]?.id ?? 0);
  const selectedLibrary = libraries.find((item) => item.id === libraryId) ?? libraries[0];
  const [sectionId, setSectionId] = useState(selectedLibrary?.sections[0]?.id ?? 0);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [isFree, setIsFree] = useState(false);
  const [published, setPublished] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState("");

  const pendingCount = useMemo(() => files.filter((item) => item.status === "ready" || (item.status === "error" && !["أكبر من 50 ميجابايت", "صيغة غير مدعومة"].includes(item.message || ""))).length, [files]);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const next: LocalFile[] = incoming.map((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (file.size > MAX_SIZE) return { id: crypto.randomUUID(), file, status: "error", message: "أكبر من 50 ميجابايت" };
      if (!ACCEPT.split(",").some((entry) => entry.replace(".", "") === extension)) {
        return { id: crypto.randomUUID(), file, status: "error", message: "صيغة غير مدعومة" };
      }
      return { id: crypto.randomUUID(), file, status: "ready" };
    });
    setFiles((current) => [...current.filter((item) => item.status !== "done"), ...next]);
    setNotice("");
  }

  async function uploadOne(item: LocalFile) {
    const file = item.file;
    const signResponse = await fetch("/api/admin/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "library", libraryId, sectionId, fileName: file.name, contentType: file.type, size: file.size }),
    });
    const signed = await signResponse.json();
    if (!signResponse.ok) throw new Error(signed.error || "تعذر تجهيز رابط الرفع.");

    const headers: Record<string, string> = {
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
      "cache-control": "3600",
    };
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
      headers.apikey = anonKey;
      headers.Authorization = `Bearer ${anonKey}`;
    }
    const uploadResponse = await fetch(signed.signedUrl as string, { method: "PUT", headers, body: file });
    if (!uploadResponse.ok) {
      const detail = await uploadResponse.text().catch(() => "");
      throw new Error(detail.slice(0, 180) || "فشل رفع الملف إلى التخزين. تحقق من إعدادات Supabase وصلاحيات الحاوية.");
    }

    const completeResponse = await fetch("/api/admin/uploads/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "library", bucket: signed.bucket, objectPath: signed.objectPath,
        fileName: file.name, title: file.name.replace(/\.[^.]+$/, ""), libraryId, sectionId, isFree, published,
      }),
    });
    const completed = await completeResponse.json();
    if (!completeResponse.ok) throw new Error(completed.error || "تم رفع الملف لكن لم يتم تسجيله داخل المكتبة.");
  }

  async function uploadAll() {
    if (!supabaseReady) {
      setNotice("اربط Supabase Storage أولًا من إعدادات الاستضافة. بعد الربط ستتمكن من رفع ملفات كبيرة مباشرة من جهازك.");
      return;
    }
    if (!libraryId || !sectionId) {
      setNotice("اختر المكتبة والقسم أولًا.");
      return;
    }
    const ready = files.filter((item) => item.status === "ready" || (item.status === "error" && !["أكبر من 50 ميجابايت", "صيغة غير مدعومة"].includes(item.message || "")));
    if (!ready.length) {
      setNotice("اختر ملفات صالحة للرفع أولًا.");
      return;
    }
    setIsUploading(true);
    setNotice("");
    for (const item of ready) {
      setFiles((current) => current.map((row) => row.id === item.id ? { ...row, status: "uploading", message: "جارٍ الرفع والحفظ…" } : row));
      try {
        await uploadOne(item);
        setFiles((current) => current.map((row) => row.id === item.id ? { ...row, status: "done", message: "تمت الإضافة إلى المكتبة" } : row));
      } catch (error) {
        setFiles((current) => current.map((row) => row.id === item.id ? { ...row, status: "error", message: error instanceof Error ? error.message : "تعذر رفع الملف" } : row));
      }
    }
    setIsUploading(false);
    setNotice("انتهت عملية الرفع. الملفات الناجحة أصبحت في قائمة محتوى المكتبة.");
    router.refresh();
  }

  function changeLibrary(value: number) {
    setLibraryId(value);
    const nextLibrary = libraries.find((item) => item.id === value);
    setSectionId(nextLibrary?.sections[0]?.id ?? 0);
  }

  return (
    <div className="space-y-6">
      <section className="card-surface space-y-4 p-5 sm:p-6">
        <div>
          <span className="chip mb-2">UPLOAD CENTER · مركز رفع الملفات</span>
          <h1 className="font-display text-2xl font-black text-white sm:text-3xl">ارفع ملفات المكتبة بسهولة</h1>
          <p className="mt-2 text-sm leading-7 text-slate-300">اختار المكتبة والقسم مرة واحدة، ثم اسحب كل ملفاتك معًا أو اضغط للاختيار. كل ملف سيظهر تلقائيًا داخل المكتبة، وتقدر تتحكم في مجانيته ونشره.</p>
        </div>
        {!supabaseReady && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">
            <strong>التخزين السحابي غير متصل حاليًا.</strong> اربط Supabase Storage من إعدادات الاستضافة أولًا. الرفع المحلي لا يحفظ ملفات دائمة على Netlify.
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="field-label">1. اختار المكتبة</span>
            <select className="field" value={libraryId} onChange={(event) => changeLibrary(Number(event.target.value))}>
              {libraries.map((library) => <option key={library.id} value={library.id}>{library.titleAr}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="field-label">2. اختار القسم</span>
            <select className="field" value={sectionId} onChange={(event) => setSectionId(Number(event.target.value))}>
              {(selectedLibrary?.sections ?? []).map((section) => <option key={section.id} value={section.id}>{section.code} — {section.title}</option>)}
            </select>
          </label>
        </div>
        {!selectedLibrary?.sections.length && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
            هذه المكتبة لا تحتوي على أقسام بعد. أضف الأقسام أولًا من <Link className="underline font-bold" href={`/admin/libraries/${libraryId}`}>إدارة المكتبة</Link>.
          </div>
        )}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => { event.preventDefault(); setIsDragging(false); addFiles(event.dataTransfer.files); }}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${isDragging ? "border-cyan-300 bg-cyan-400/10" : "border-white/20 bg-white/[0.03] hover:border-cyan-400/60 hover:bg-cyan-400/5"}`}
        >
          <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.currentTarget.value = ""; }} />
          <UploadCloud className="mx-auto text-cyan-300" size={42}/>
          <p className="mt-3 text-base font-extrabold text-white">3. اسحب ملفاتك هنا أو اضغط للاختيار</p>
          <p className="mt-2 text-xs leading-6 text-slate-400">PDF · صور · MP4 · WEBM · TXT · MD — حتى 50 ميجابايت للملف الواحد</p>
        </div>
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-sm font-extrabold text-white">الملفات المختارة ({files.length})</h2>
              <button type="button" onClick={() => setFiles((current) => current.filter((item) => item.status === "done"))} className="text-xs text-slate-400 hover:text-white">مسح الملفات غير المرفوعة</button>
            </div>
            <div className="space-y-2">
              {files.map((item) => {
                const Icon = fileIcon(item.file);
                return (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <Icon size={20} className="shrink-0 text-cyan-300"/>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{item.file.name}</p>
                      <p className="text-[11px] text-slate-400">{readableSize(item.file.size)}</p>
                      {item.message && <p className={`mt-1 text-[11px] ${item.status === "error" ? "text-rose-300" : item.status === "done" ? "text-emerald-300" : "text-cyan-200"}`}>{item.message}</p>}
                    </div>
                    {item.status === "done" ? <CheckCircle2 size={18} className="text-emerald-300"/> : item.status === "uploading" ? <LoaderCircle size={18} className="animate-spin text-cyan-300"/> : item.status === "error" ? <AlertCircle size={18} className="text-rose-300"/> : <span className="text-[11px] text-slate-400">جاهز</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-5 rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="flex items-center gap-2 text-xs text-white"><input type="checkbox" checked={isFree} onChange={(event) => setIsFree(event.target.checked)} className="h-4 w-4 accent-cyan-400"/> اجعل الملفات مجانية قبل الشراء</label>
          <label className="flex items-center gap-2 text-xs text-white"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} className="h-4 w-4 accent-cyan-400"/> انشر الملفات فور الرفع (يمكنك إخفاؤها لاحقًا)</label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] leading-5 text-slate-400">افتراضيًا يتم نشر الملفات فور رفعها. أزل علامة النشر لو تريد مراجعتها كمسودة أولًا. عنوان كل ملف يؤخذ من اسمه، ويمكنك تعديله من زر «تعديل».</p>
          <button type="button" disabled={isUploading || pendingCount === 0 || !selectedLibrary?.sections.length} onClick={uploadAll} className="btn-primary text-sm">
            {isUploading ? <LoaderCircle size={16} className="animate-spin"/> : <UploadCloud size={16}/>} ارفع الملفات المختارة
          </button>
        </div>
        {notice && <p role="status" className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-xs leading-6 text-cyan-100">{notice}</p>}
      </section>

      {selectedLibrary && (
        <section className="card-surface space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-extrabold text-white">المحتوى الموجود في {selectedLibrary.titleAr}</h2>
              <p className="mt-1 text-xs text-slate-400">راجع الحالة أو افتح تعديل العنصر من القائمة.</p>
            </div>
            <Link href={`/admin/libraries/${selectedLibrary.id}`} className="btn-ghost text-xs"><FolderPlus size={14}/> إدارة الأقسام والتفاصيل</Link>
          </div>
          {selectedLibrary.resources.length === 0 ? <p className="text-sm text-slate-400">لا توجد ملفات مضافة حتى الآن.</p> : (
            <div className="space-y-2">
              {selectedLibrary.resources.map((resource) => (
                <div key={resource.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{resource.title}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{resource.fileName || "عنصر نصي أو رابط"} · {resource.published ? "منشور" : "مسودة"} · {resource.isFree ? "مجاني" : "مدفوع"}</p>
                  </div>
                  <Link href={`/admin/libraries/${selectedLibrary.id}?editResource=${resource.id}`} className="btn-ghost text-xs">تعديل <ExternalLink size={12}/></Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
